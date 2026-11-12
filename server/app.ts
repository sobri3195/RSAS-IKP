import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import QRCode from "qrcode";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { type Database, type Sql, committee } from "./db.js";
import { type Config } from "./config.js";
import {
  cryptoBox,
  token,
  digest,
  hashPassword,
  verifyPassword,
  validTotp,
  newTotp,
  totp,
} from "./security.js";
import {
  reportInput,
  reviewInput,
  emptyReview,
  transitions,
  reportStatuses,
  reportKinds,
  date as calendarDate,
  statusNames,
  type ReportDetail,
} from "../shared/report.js";
import { backupSchema } from "../src/schemas/models.js";

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};
const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<any>): express.RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
const uuid = z.string().uuid();
const credentials = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(200)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(128),
    otp: z.string().regex(/^\d{6}$/),
  })
  .strict();
const filesInput = z
  .array(
    z
      .object({
        name: z.string().min(1).max(120),
        mime: z.enum(["image/png", "image/jpeg"]),
        base64: z
          .string()
          .max(1_400_000)
          .regex(/^[A-Za-z0-9+/]*={0,2}$/),
      })
      .strict(),
  )
  .max(3);
const submission = z
  .object({
    report: reportInput,
    idempotencyKey: uuid,
    challenge: z.string().max(200),
    website: z.literal(""),
    files: filesInput.default([]),
  })
  .strict();
const filtersInput = z
  .object({
    from: calendarDate.optional(),
    to: calendarDate.optional(),
    unit: z.string().max(120).optional(),
    kind: z.enum(reportKinds).optional(),
    status: z.enum(reportStatuses).optional(),
    grade: z.enum(["BIRU", "HIJAU", "KUNING", "MERAH"]).optional(),
  })
  .strict()
  .refine((v) => !v.from || !v.to || v.from <= v.to, "Periode tidak valid.");
const equal = (a: string, b: string) => {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
const serialize = (row: any) =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k,
      v instanceof Date ? v.toISOString() : v,
    ]),
  );
const summaryColumns =
  "id,number,status,kind,unit,category,grade,incident_at,created_at,updated_at,version,deadline";

async function cleanPhoto(file: z.infer<typeof filesInput>[number]) {
  const raw = Buffer.from(file.base64, "base64");
  if (raw.length > 1_000_000)
    fail(400, "Ukuran lampiran maksimum 1 MB per foto.");
  try {
    const image = sharp(raw, { limitInputPixels: 16_000_000, animated: false });
    const metadata = await image.metadata();
    if (
      !["png", "jpeg"].includes(metadata.format || "") ||
      file.mime !== `image/${metadata.format}`
    )
      fail(400, "Hanya foto PNG/JPEG yang valid diizinkan.");
    const clean = await image
      .rotate()
      .toFormat(metadata.format as "png" | "jpeg")
      .toBuffer();
    if (clean.length > 2_000_000)
      fail(400, "Foto hasil pemrosesan terlalu besar.");
    return { mime: file.mime, base64: clean.toString("base64") };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    return fail(400, "Berkas foto tidak dapat dibaca.");
  }
}

export function createApp(db: Database, settings: Config) {
  const app = express(),
    box = cryptoBox(settings.key),
    cookieName = settings.production ? "__Host-rsas_session" : "rsas_session";
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      referrerPolicy: { policy: "no-referrer" },
    }),
  );
  app.use("/api", (_req, res, next) => {
    res.set({
      "Cache-Control": "no-store, private",
      Pragma: "no-cache",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
    });
    next();
  });
  app.use("/api", (req, _res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.headers.origin !== settings.origin || !req.is("application/json"))
    )
      return next(
        new HttpError(403, "Origin atau format permintaan tidak diizinkan."),
      );
    next();
  });
  app.use(express.json({ limit: "6mb" }));
  function ip(req: Request) {
    // Only trust platform-injected identity on Vercel. Ignore arbitrary X-Forwarded-For.
    return process.env.VERCEL === "1"
      ? String(
          req.headers["x-vercel-forwarded-for"] || req.socket.remoteAddress,
        )
          .split(",")[0]
          .trim()
      : req.socket.remoteAddress || "unknown";
  }
  async function limit(key: string, max: number, seconds: number) {
    const rows = await db.query(
      `INSERT INTO rate_limits(key,hits,reset_at) VALUES ($1,1,now()+$2*interval '1 second')
      ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.hits+1 END,
      reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+$2*interval '1 second' ELSE rate_limits.reset_at END RETURNING hits`,
      [box.hmac(key), seconds],
    );
    if (rows.rows[0].hits > max)
      fail(429, "Terlalu banyak permintaan. Coba kembali nanti.");
  }
  async function audit(
    sql: Sql,
    actor: string | null,
    report: string | null,
    action: string,
    metadata: object = {},
  ) {
    await sql.query(
      "INSERT INTO audit_log(id,actor_id,report_id,action,metadata) VALUES ($1,$2,$3,$4,$5)",
      [randomUUID(), actor, report, action, JSON.stringify(metadata)],
    );
  }
  function sessionToken(req: Request) {
    const value = req.headers.cookie
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    return value && /^[\w-]{43}$/.test(value) ? value : "";
  }
  async function auth(req: Request, committeeOnly = true) {
    const raw = sessionToken(req);
    if (!raw) fail(401, "Silakan masuk ke akun internal.");
    const { rows } = await db.query(
      "SELECT u.id,u.name,u.role,u.can_manage_accounts FROM sessions s JOIN app_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.enabled=true",
      [digest(raw)],
    );
    const user = rows[0];
    if (!user) fail(401, "Sesi berakhir. Silakan masuk kembali.");
    if (committeeOnly && user.role !== "komite_mutu")
      fail(403, "Hanya Komite Mutu yang berwenang.");
    const csrf = box.hmac(`csrf:${raw}`);
    if (
      !["GET", "HEAD"].includes(req.method) &&
      !equal(String(req.headers["x-csrf-token"] || ""), csrf)
    )
      fail(403, "Token keamanan tidak valid.");
    return {
      id: user.id as string,
      name: user.name as string,
      role: user.role as string,
      canManageAccounts: user.can_manage_accounts as boolean,
      csrf,
    };
  }
  function queryFilter(query: Request["query"]) {
    const f = filtersInput.parse(query),
      values: string[] = [],
      parts: string[] = [];
    const add = (sql: string, value: string) => {
      values.push(value);
      parts.push(sql.replace("?", `$${values.length}`));
    };
    if (f.from)
      add(
        "incident_at >= (?::date::timestamp AT TIME ZONE 'Asia/Jakarta')",
        f.from,
      );
    if (f.to)
      add(
        "incident_at < ((?::date + interval '1 day') AT TIME ZONE 'Asia/Jakarta')",
        f.to,
      );
    for (const key of ["unit", "kind", "status", "grade"] as const)
      if (f[key]) add(`${key} = ?`, f[key]!);
    return {
      values,
      where: parts.length ? `WHERE ${parts.join(" AND ")}` : "",
    };
  }
  async function list(sql: Sql, req: Request) {
    const f = queryFilter(req.query);
    return (
      await sql.query(
        `SELECT ${summaryColumns} FROM reports ${f.where} ORDER BY created_at DESC LIMIT 10001`,
        f.values,
      )
    ).rows.map(serialize);
  }
  async function nextNumber(sql: Sql) {
    const year = new Date(Date.now() + 7 * 3600000).getUTCFullYear();
    const { rows } = await sql.query(
      "INSERT INTO report_counters(year,value) VALUES ($1,1) ON CONFLICT(year) DO UPDATE SET value=report_counters.value+1 RETURNING value",
      [year],
    );
    return `IKP-RSAS-${year}-${String(rows[0].value).padStart(6, "0")}`;
  }
  app.get(
    "/api/health",
    asyncRoute(async (_req, res) => {
      await db.query("SELECT version FROM schema_migrations WHERE version=1");
      res.json({ ok: true });
    }),
  );
  app.get(
    "/api/public/config",
    asyncRoute(async (req, res) => {
      await limit(`config:${ip(req)}`, 120, 60);
      const challenge = `${Date.now()}.${token()}`;
      res.json({
        units: (
          await db.query("SELECT id,name FROM master_units ORDER BY name")
        ).rows,
        attachments: settings.attachments,
        challenge: `${challenge}.${box.hmac(challenge)}`,
      });
    }),
  );
  app.post(
    "/api/public/reports",
    asyncRoute(async (req, res) => {
      await limit(
        `submit:${ip(req)}`,
        settings.publicReportsPerHour || 120,
        3600,
      );
      const input = submission.parse(req.body),
        [time, nonce, signature] = input.challenge.split(".");
      if (
        !signature ||
        !equal(signature, box.hmac(`${time}.${nonce}`)) ||
        Date.now() - Number(time) > 7200000 ||
        Number(time) > Date.now()
      )
        fail(400, "Sesi formulir kedaluwarsa. Muat ulang formulir.");
      if (
        !(
          await db.query("SELECT id FROM master_units WHERE id=$1", [
            input.report.unit,
          ])
        ).rows.length
      )
        fail(400, "Unit pelapor tidak valid.");
      if (input.files.length && !settings.attachments)
        fail(400, "Lampiran belum diizinkan kebijakan RS.");
      const id = randomUUID(),
        trackingCode = box.hmac(`tracking:${input.idempotencyKey}`),
        idem = digest(input.idempotencyKey);
      const requestHash = digest(
        JSON.stringify({ report: input.report, files: input.files }),
      );
      const images = await Promise.all(input.files.map(cleanPhoto));
      const result = await committee(db, async (sql) => {
        // Serialize retries of the same submission across serverless instances.
        await sql.query("SELECT pg_advisory_xact_lock(hashtext($1))", [idem]);
        const existing = (
          await sql.query(
            "SELECT id,number,payload,created_at FROM reports WHERE idempotency_hash=$1",
            [idem],
          )
        ).rows[0];
        if (existing) {
          const saved = box.decrypt<any>(
            existing.payload,
            `report:${existing.id}`,
          );
          if (saved.requestHash !== requestHash)
            fail(
              409,
              "Permintaan berbeda menggunakan kunci pengiriman yang sama.",
            );
          return {
            number: existing.number,
            trackingCode,
            receivedAt: serialize(existing).created_at,
          };
        }
        const number = await nextNumber(sql),
          payload = { ...input.report, ...emptyReview(), requestHash };
        const row = await sql.query(
          "INSERT INTO reports(id,number,tracking_hash,status,kind,unit,category,incident_at,payload,idempotency_hash) VALUES($1,$2,$3,'submitted',$4,$5,$6,$7,$8,$9) RETURNING created_at",
          [
            id,
            number,
            digest(trackingCode),
            input.report.kind,
            input.report.unit,
            input.report.category,
            `${input.report.incidentDate}T${input.report.incidentTime}:00+07:00`,
            box.encrypt(payload, `report:${id}`),
            idem,
          ],
        );
        for (const image of images) {
          const fileId = randomUUID();
          await sql.query(
            "INSERT INTO attachments(id,report_id,name,mime,payload) VALUES($1,$2,$3,$4,$5)",
            [
              fileId,
              id,
              `foto-${fileId.slice(0, 8)}.${image.mime === "image/png" ? "png" : "jpg"}`,
              image.mime,
              box.encrypt(image.base64, `file:${id}:${fileId}`),
            ],
          );
        }
        await audit(sql, null, id, "report.submitted", {
          sentinel: input.report.kind === "Sentinel",
        });
        return {
          number,
          trackingCode,
          receivedAt: serialize(row.rows[0]).created_at,
        };
      });
      res.status(201).json(result);
    }),
  );
  app.post(
    "/api/public/track",
    asyncRoute(async (req, res) => {
      await limit(`track:${ip(req)}`, 30, 900);
      const { code } = z
        .object({ code: z.string().regex(/^[a-f\d]{64}$/) })
        .strict()
        .parse(req.body);
      const row = await committee(
        db,
        async (sql) =>
          (
            await sql.query(
              "SELECT number,status,updated_at FROM reports WHERE tracking_hash=$1",
              [digest(code)],
            )
          ).rows[0],
      );
      if (!row) fail(404, "Kode pelacakan tidak ditemukan.");
      res.json(serialize(row));
    }),
  );
  app.post(
    "/api/auth/login",
    asyncRoute(async (req, res) => {
      await limit(`login-ip:${ip(req)}`, 30, 900);
      const data = credentials.parse(req.body);
      await limit(`login-account:${data.email}`, 10, 900);
      const user = (
        await db.query("SELECT * FROM app_users WHERE email=$1", [data.email])
      ).rows[0];
      // Run scrypt even for unknown accounts to reduce username timing differences.
      const passwordOk = await verifyPassword(
        data.password,
        user?.password_hash || `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`,
      );
      const step = user?.totp_secret
        ? validTotp(
            box.decrypt<string>(user.totp_secret, `totp:${user.id}`),
            data.otp,
            Number(user.last_totp_step),
          )
        : null;
      if (!user?.enabled || !passwordOk || step === null) {
        await audit(db, user?.id || null, null, "auth.login_failed");
        fail(401, "Email, kata sandi, atau kode autentikator tidak valid.");
      }
      const raw = token();
      await db.transaction(async (sql) => {
        const update = await sql.query(
          "UPDATE app_users SET last_totp_step=$1 WHERE id=$2 AND last_totp_step<$1 RETURNING id",
          [step, user.id],
        );
        if (!update.rows.length)
          fail(401, "Kode autentikator sudah digunakan.");
        await sql.query("DELETE FROM sessions WHERE expires_at<now()");
        await sql.query(
          "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",
          [digest(raw), user.id],
        );
        await audit(sql, user.id, null, "auth.login");
      });
      res.cookie(cookieName, raw, {
        httpOnly: true,
        secure: settings.production,
        sameSite: "strict",
        path: "/",
        maxAge: 8 * 3600 * 1000,
      });
      res.json({
        id: user.id,
        name: user.name,
        role: user.role,
        canManageAccounts: user.can_manage_accounts,
        csrf: box.hmac(`csrf:${raw}`),
      });
    }),
  );
  app.get(
    "/api/auth/session",
    asyncRoute(async (req, res) => {
      res.json(await auth(req, false));
    }),
  );
  app.post(
    "/api/auth/logout",
    asyncRoute(async (req, res) => {
      const user = await auth(req, false);
      await db.transaction(async (sql) => {
        await sql.query("DELETE FROM sessions WHERE token_hash=$1", [
          digest(sessionToken(req)),
        ]);
        await audit(sql, user.id, null, "auth.logout");
      });
      res.clearCookie(cookieName, {
        httpOnly: true,
        secure: settings.production,
        sameSite: "strict",
        path: "/",
      });
      res.status(204).end();
    }),
  );
  app.post(
    "/api/auth/enroll/start",
    asyncRoute(async (req, res) => {
      await limit(`enroll:${ip(req)}`, 20, 900);
      const { invitation } = z
        .object({ invitation: z.string().regex(/^[\w-]{43}$/) })
        .strict()
        .parse(req.body);
      const data = await db.transaction(async (sql) => {
        const user = (
          await sql.query(
            "SELECT * FROM app_users WHERE invite_hash=$1 AND invite_expires>now() AND enabled=false FOR UPDATE",
            [digest(invitation)],
          )
        ).rows[0];
        if (!user) fail(400, "Undangan tidak valid atau sudah kedaluwarsa.");
        const secret = user.totp_secret
          ? box.decrypt<string>(user.totp_secret, `totp:${user.id}`)
          : newTotp();
        await sql.query("UPDATE app_users SET totp_secret=$1 WHERE id=$2", [
          box.encrypt(secret, `totp:${user.id}`),
          user.id,
        ]);
        return {
          name: user.name,
          uri: totp(secret, user.email).toString(),
          secret,
        };
      });
      res.json(data);
    }),
  );
  app.post(
    "/api/auth/enroll/complete",
    asyncRoute(async (req, res) => {
      await limit(`enroll-finish:${ip(req)}`, 10, 900);
      const data = z
        .object({
          invitation: z.string().regex(/^[\w-]{43}$/),
          password: z.string().min(12).max(128),
          otp: z.string().regex(/^\d{6}$/),
        })
        .strict()
        .parse(req.body);
      await db.transaction(async (sql) => {
        const user = (
          await sql.query(
            "SELECT * FROM app_users WHERE invite_hash=$1 AND invite_expires>now() AND enabled=false FOR UPDATE",
            [digest(data.invitation)],
          )
        ).rows[0];
        if (!user?.totp_secret)
          fail(400, "Undangan tidak valid atau belum diinisialisasi.");
        const step = validTotp(
          box.decrypt<string>(user.totp_secret, `totp:${user.id}`),
          data.otp,
          Number(user.last_totp_step),
        );
        if (step === null) fail(400, "Kode autentikator tidak valid.");
        await sql.query(
          "UPDATE app_users SET password_hash=$1,last_totp_step=$2,enabled=true,invite_hash=NULL,invite_expires=NULL WHERE id=$3",
          [await hashPassword(data.password), step, user.id],
        );
        await audit(sql, user.id, null, "auth.enrolled");
      });
      res.status(204).end();
    }),
  );
  return finishRoutes();

  function finishRoutes() {
    // One authorization boundary for all committee APIs, including files and exports.
    const router = express.Router();
    router.use((req, res, next) => {
      auth(req)
        .then(async (user) => {
          await limit(`committee:${user.id}`, 240, 60);
          res.locals.user = user;
          next();
        })
        .catch(next);
    });
    router.post(
      "/units",
      asyncRoute(async (req, res) => {
        const input = z
          .object({
            id: z.string().regex(/^[a-z0-9-]{1,80}$/),
            name: z.string().trim().min(1).max(120),
          })
          .strict()
          .parse(req.body);
        await db.transaction(async (sql) => {
          await sql.query("INSERT INTO master_units(id,name) VALUES($1,$2)", [
            input.id,
            input.name,
          ]);
          await audit(sql, res.locals.user.id, null, "unit.created", {
            id: input.id,
          });
        });
        res.status(201).json(input);
      }),
    );
    router.patch(
      "/units/:id",
      asyncRoute(async (req, res) => {
        const id = z
            .string()
            .regex(/^[a-z0-9-]{1,80}$/)
            .parse(req.params.id),
          input = z
            .object({ name: z.string().trim().min(1).max(120) })
            .strict()
            .parse(req.body);
        await db.transaction(async (sql) => {
          const row = await sql.query(
            "UPDATE master_units SET name=$1 WHERE id=$2 RETURNING id",
            [input.name, id],
          );
          if (!row.rows.length) fail(404, "Unit tidak ditemukan.");
          await audit(sql, res.locals.user.id, null, "unit.renamed", { id });
        });
        res.status(204).end();
      }),
    );
    router.get(
      "/reports",
      asyncRoute(async (req, res) => {
        const rows = await committee(db, async (sql) => {
          await audit(sql, res.locals.user.id, null, "reports.list");
          return list(sql, req);
        });
        if (rows.length > 10000)
          fail(400, "Persempit periode: maksimum 10.000 laporan per tampilan.");
        res.json(rows);
      }),
    );
    router.get(
      "/reports/:id",
      asyncRoute(async (req, res) => {
        const id = uuid.parse(req.params.id);
        const result = await committee(db, async (sql) => {
          const row = (
            await sql.query("SELECT * FROM reports WHERE id=$1", [id])
          ).rows[0];
          if (!row) fail(404, "Laporan tidak ditemukan.");
          const data = box.decrypt<any>(row.payload, `report:${id}`);
          delete data.requestHash;
          const files = (
            await sql.query(
              "SELECT id,name,mime FROM attachments WHERE report_id=$1",
              [id],
            )
          ).rows;
          await audit(sql, res.locals.user.id, id, "report.read");
          const clean = serialize(row);
          for (const key of [
            "payload",
            "tracking_hash",
            "idempotency_hash",
            "legacy_id",
          ])
            delete clean[key];
          return { ...clean, data, files };
        });
        res.json(result);
      }),
    );
    router.patch(
      "/reports/:id",
      asyncRoute(async (req, res) => {
        const id = uuid.parse(req.params.id),
          review = reviewInput.parse(req.body),
          actor = res.locals.user.id;
        const result = await committee(db, async (sql) => {
          const row = (
            await sql.query("SELECT * FROM reports WHERE id=$1 FOR UPDATE", [
              id,
            ])
          ).rows[0];
          if (!row) fail(404, "Laporan tidak ditemukan.");
          if (row.version !== review.version)
            fail(409, "Laporan berubah. Muat ulang sebelum menyimpan.");
          if (
            row.status === "archived" ||
            (review.status !== row.status &&
              !transitions[row.status as keyof typeof transitions].includes(
                review.status,
              ))
          )
            fail(409, "Perubahan status tidak diizinkan.");
          const previous = box.decrypt<ReportDetail["data"]>(
            row.payload,
            `report:${id}`,
          );
          if (row.status === "closed" && review.status === "closed")
            fail(409, "Laporan selesai hanya dapat diarsipkan.");
          if (
            review.corrections &&
            !["under_review", "needs_revision"].includes(row.status)
          )
            fail(
              409,
              "Koreksi hanya diizinkan selama peninjauan atau perbaikan.",
            );
          if (
            row.status === "closed" &&
            (review.kind !== row.kind ||
              review.category !== row.category ||
              JSON.stringify([
                review.risk,
                review.investigation,
                review.actions,
              ]) !==
                JSON.stringify([
                  previous.risk,
                  previous.investigation,
                  previous.actions,
                ]))
          )
            fail(409, "Pengarsipan tidak boleh mengubah laporan selesai.");
          const data = {
            ...previous,
            ...review.corrections,
            kind: review.kind,
            category: review.category,
            risk: review.risk,
            investigation: review.investigation,
            actions: review.actions,
          };
          await sql.query(
            "UPDATE reports SET status=$1,kind=$2,category=$3,grade=$4,deadline=NULLIF($5,'')::date,payload=$6,version=version+1,updated_at=now() WHERE id=$7",
            [
              review.status,
              review.kind,
              review.category,
              review.risk.grade,
              review.investigation.deadline,
              box.encrypt(data, `report:${id}`),
              id,
            ],
          );
          await audit(sql, actor, id, "report.reviewed", {
            from: row.status,
            to: review.status,
            version: row.version + 1,
            kind: review.kind,
            grade: review.risk.grade,
            note: box.encrypt(review.note, `audit:${id}`),
            previous: box.encrypt(previous, `history:${id}:${row.version}`),
          });
          return { version: row.version + 1 };
        });
        res.json(result);
      }),
    );
    router.post(
      "/reports/:id/files",
      asyncRoute(async (req, res) => {
        if (!settings.attachments)
          fail(400, "Lampiran belum diizinkan kebijakan RS.");
        const id = uuid.parse(req.params.id),
          input = z
            .object({
              version: z.number().int().positive(),
              file: filesInput.element,
            })
            .strict()
            .parse(req.body),
          image = await cleanPhoto(input.file);
        await committee(db, async (sql) => {
          const row = (
            await sql.query(
              "SELECT status,version FROM reports WHERE id=$1 FOR UPDATE",
              [id],
            )
          ).rows[0];
          if (!row) fail(404, "Laporan tidak ditemukan.");
          if (
            row.version !== input.version ||
            ["closed", "archived"].includes(row.status)
          )
            fail(
              409,
              "Laporan berubah atau sudah ditutup. Muat ulang sebelum mengunggah.",
            );
          const count = (
            await sql.query(
              "SELECT count(*) AS total FROM attachments WHERE report_id=$1",
              [id],
            )
          ).rows[0];
          if (Number(count.total) >= 20)
            fail(400, "Maksimum 20 foto per laporan.");
          const file = randomUUID();
          await sql.query(
            "INSERT INTO attachments(id,report_id,name,mime,payload) VALUES($1,$2,$3,$4,$5)",
            [
              file,
              id,
              `bukti-${file.slice(0, 8)}.${image.mime === "image/png" ? "png" : "jpg"}`,
              image.mime,
              box.encrypt(image.base64, `file:${id}:${file}`),
            ],
          );
          await sql.query(
            "UPDATE reports SET version=version+1,updated_at=now() WHERE id=$1",
            [id],
          );
          await audit(sql, res.locals.user.id, id, "file.uploaded", {
            file,
            version: row.version + 1,
          });
        });
        res.status(201).json({ uploaded: true });
      }),
    );
    router.get(
      "/reports/:id/files/:file",
      asyncRoute(async (req, res) => {
        const id = uuid.parse(req.params.id),
          file = uuid.parse(req.params.file);
        const row = await committee(db, async (sql) => {
          const row = (
            await sql.query(
              "SELECT * FROM attachments WHERE id=$1 AND report_id=$2",
              [file, id],
            )
          ).rows[0];
          if (row)
            await audit(sql, res.locals.user.id, id, "file.download", { file });
          return row;
        });
        if (!row) fail(404, "Lampiran tidak ditemukan.");
        res.set({
          "Content-Type": row.mime,
          "Content-Disposition": `attachment; filename="${file}.${row.mime === "image/png" ? "png" : "jpg"}"`,
        });
        res.send(
          Buffer.from(
            box.decrypt<string>(row.payload, `file:${id}:${file}`),
            "base64",
          ),
        );
      }),
    );
    router.get(
      "/notifications",
      asyncRoute(async (_req, res) => {
        const rows = await committee(
          db,
          async (sql) =>
            (
              await sql.query(
                "SELECT id,number,status,kind,deadline,payload,created_at FROM reports WHERE status NOT IN ('closed','archived') ORDER BY created_at DESC LIMIT 10000",
              )
            ).rows,
        );
        const now = Date.now(),
          soon = now + 3 * 86400000,
          notes: object[] = [];
        for (const row of rows) {
          const add = (type: string, message: string) =>
            notes.push({
              id: `${row.id}:${type}`,
              reportId: row.id,
              number: row.number,
              type,
              message,
            });
          if (row.status === "submitted")
            add("new", "Laporan baru menunggu peninjauan.");
          if (["submitted", "under_review"].includes(row.status))
            add("validation", "Laporan belum divalidasi.");
          if (row.kind === "Sentinel")
            add("sentinel", "Kejadian sentinel perlu perhatian Komite Mutu.");
          const deadline = row.deadline
            ? new Date(row.deadline).getTime()
            : null;
          if (deadline && deadline <= soon)
            add(
              "investigation",
              deadline < now
                ? "Tenggat investigasi/RCA terlewati."
                : "Tenggat investigasi mendekat.",
            );
          const data = box.decrypt<ReportDetail["data"]>(
            row.payload,
            `report:${row.id}`,
          );
          if (data.actions.some((a) => !a.done))
            add("actions", "Tindakan perbaikan belum diselesaikan.");
        }
        res.json(notes);
      }),
    );
    router.get(
      "/audit",
      asyncRoute(async (req, res) => {
        const id = req.query.reportId ? uuid.parse(req.query.reportId) : null;
        const rows = await committee(
          db,
          async (sql) =>
            (
              await sql.query(
                "SELECT a.id,a.actor_id,a.report_id,a.action,a.metadata,a.at,u.name AS actor FROM audit_log a LEFT JOIN app_users u ON u.id=a.actor_id WHERE ($1::uuid IS NULL OR a.report_id=$1) ORDER BY a.at DESC LIMIT 500",
                [id],
              )
            ).rows,
        );
        res.json(
          rows.map((row) => {
            const result = serialize(row);
            if (row.metadata.note && row.report_id)
              result.metadata = {
                ...row.metadata,
                note: box.decrypt(row.metadata.note, `audit:${row.report_id}`),
              };
            return result;
          }),
        );
      }),
    );
    router.get(
      "/qr",
      asyncRoute(async (req, res) => {
        const { unit, format } = z
          .object({
            unit: z
              .string()
              .regex(/^[a-z0-9-]{1,80}$/)
              .optional(),
            format: z.enum(["png", "svg"]),
          })
          .strict()
          .parse(req.query);
        if (
          unit &&
          !(await db.query("SELECT id FROM master_units WHERE id=$1", [unit]))
            .rows.length
        )
          fail(400, "Unit tidak valid.");
        const url = `${settings.origin}/lapor${unit ? `?unit=${encodeURIComponent(unit)}` : ""}`;
        await audit(db, res.locals.user.id, null, "qr.download", {
          unit: unit || null,
        });
        res
          .type(format === "svg" ? "image/svg+xml" : "image/png")
          .attachment(`rsas-lapor${unit ? `-${unit}` : ""}.${format}`);
        if (format === "svg")
          res.send(
            await QRCode.toString(url, {
              type: "svg",
              errorCorrectionLevel: "M",
              margin: 4,
              color: { dark: "#000000", light: "#ffffff" },
            }),
          );
        else
          res.send(
            await QRCode.toBuffer(url, {
              type: "png",
              width: 1024,
              margin: 4,
              errorCorrectionLevel: "M",
            }),
          );
      }),
    );
    router.get(
      "/export/:format",
      asyncRoute(async (req, res) => {
        const format = z.enum(["xlsx", "pdf"]).parse(req.params.format);
        const rows = await committee(db, async (sql) => {
          const rows = await list(sql, req);
          await audit(
            sql,
            res.locals.user.id,
            null,
            `reports.export_${format}`,
            { count: rows.length },
          );
          return rows;
        });
        if (rows.length > 10000) fail(400, "Persempit periode ekspor.");
        if (format === "xlsx") {
          const workbook = new ExcelJS.Workbook(),
            sheet = workbook.addWorksheet("IKP");
          sheet.addRow([
            "Nomor laporan",
            "Unit",
            "Jenis",
            "Grading",
            "Status",
            "Diterima",
          ]);
          rows.forEach((r) =>
            sheet.addRow([
              r.number,
              r.unit,
              r.kind,
              r.grade || "Belum dinilai",
              r.status,
              r.created_at,
            ]),
          );
          sheet.columns.forEach((c) => {
            c.width = 25;
          });
          res
            .type(
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            .attachment("rsas-ikp.xlsx")
            .send(Buffer.from(await workbook.xlsx.writeBuffer()));
        } else {
          const doc = new PDFDocument({ size: "A4", margin: 40 }),
            chunks: Buffer[] = [];
          const finished = new Promise<Buffer>((resolve, reject) => {
            doc.on("data", (c) => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);
          });
          doc.fontSize(16).text("RSAS-SAFETY | Komite Mutu");
          doc
            .fontSize(10)
            .text("Ringkasan internal tanpa identitas pasien")
            .moveDown();
          for (const r of rows)
            doc
              .fontSize(9)
              .text(
                `${r.number} | ${r.unit} | ${r.kind} | ${statusNames[r.status as keyof typeof statusNames]} | ${r.grade || "Belum dinilai"}`,
              )
              .moveDown(0.5);
          doc.end();
          res
            .type("application/pdf")
            .attachment("rsas-ikp.pdf")
            .send(await finished);
        }
      }),
    );
    router.get(
      "/accounts",
      asyncRoute(async (_req, res) => {
        if (!res.locals.user.canManageAccounts)
          fail(403, "Kewenangan pengelolaan akun diperlukan.");
        res.json(
          (
            await db.query(
              "SELECT id,name,email,role,enabled,can_manage_accounts FROM app_users ORDER BY created_at",
            )
          ).rows,
        );
      }),
    );
    router.post(
      "/accounts",
      asyncRoute(async (req, res) => {
        const user = res.locals.user;
        if (!user.canManageAccounts)
          fail(403, "Kewenangan pengelolaan akun diperlukan.");
        const data = z
          .object({
            name: z.string().trim().min(1).max(120),
            email: z
              .string()
              .trim()
              .email()
              .max(200)
              .transform((v) => v.toLowerCase()),
          })
          .strict()
          .parse(req.body);
        const invitation = token();
        await db.transaction(async (sql) => {
          await sql.query(
            "INSERT INTO app_users(id,name,email,role,invite_hash,invite_expires) VALUES($1,$2,$3,'komite_mutu',$4,now()+interval '24 hours')",
            [randomUUID(), data.name, data.email, digest(invitation)],
          );
          await audit(sql, user.id, null, "account.invited");
        });
        res.status(201).json({
          invitation,
          url: `${settings.origin}/komite/aktivasi#${invitation}`,
        });
      }),
    );
    router.post(
      "/accounts/:id/disable",
      asyncRoute(async (req, res) => {
        const user = res.locals.user,
          id = uuid.parse(req.params.id);
        if (!user.canManageAccounts || id === user.id)
          fail(403, "Tindakan tidak diizinkan.");
        await db.transaction(async (sql) => {
          await sql.query(
            "UPDATE app_users SET enabled=false,invite_hash=NULL,invite_expires=NULL WHERE id=$1",
            [id],
          );
          await sql.query("DELETE FROM sessions WHERE user_id=$1", [id]);
          await audit(sql, user.id, null, "account.disabled", { userId: id });
        });
        res.status(204).end();
      }),
    );
    installBackupRoutes(router);
    app.use("/api/committee", router);
    app.use("/api", (_req, _res, next) =>
      next(new HttpError(404, "Endpoint tidak ditemukan.")),
    );
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          error: "Periksa isian formulir.",
          issues: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
        return;
      }
      const status =
        err instanceof HttpError
          ? err.status
          : err.type === "entity.too.large"
            ? 413
            : err.type === "entity.parse.failed"
              ? 400
              : err.code === "23505"
                ? 409
                : 500;
      if (status === 429) res.set("Retry-After", "900");
      // Do not log request bodies, credentials, clinical data, or database error details.
      if (status === 500)
        console.error("RSAS API failure", {
          code: typeof err.code === "string" ? err.code : "internal",
        });
      res.status(status).json({
        error:
          err instanceof HttpError
            ? err.message
            : status === 409
              ? "Data sudah ada atau berubah. Muat ulang."
              : status === 413
                ? "Permintaan terlalu besar."
                : status === 400
                  ? "JSON tidak valid."
                  : "Layanan sementara tidak tersedia.",
      });
    });
    return app;
  }

  function installBackupRoutes(router: express.Router) {
    router.get(
      "/backup",
      asyncRoute(async (_req, res) => {
        const data = await committee(db, async (sql) => {
          const reports = (
            await sql.query("SELECT * FROM reports ORDER BY id")
          ).rows.map(serialize);
          const attachments = (
            await sql.query("SELECT * FROM attachments ORDER BY id")
          ).rows.map(serialize);
          const imports = (
            await sql.query("SELECT * FROM import_archives ORDER BY id")
          ).rows.map(serialize);
          await audit(sql, res.locals.user.id, null, "backup.exported", {
            reports: reports.length,
          });
          const events = (
            await sql.query("SELECT * FROM audit_log ORDER BY at,id")
          ).rows.map(serialize);
          return {
            units: (
              await sql.query("SELECT id,name FROM master_units ORDER BY id")
            ).rows,
            version: 2,
            createdAt: new Date().toISOString(),
            reports,
            attachments,
            imports,
            audit: events,
          };
        });
        res
          .type("application/json")
          .attachment("rsas-encrypted-backup.json")
          .send({ data, signature: box.hmac(JSON.stringify(data)) });
      }),
    );
    router.post(
      "/backup/restore",
      asyncRoute(async (req, res) => {
        const input = z
          .object({
            data: z
              .object({
                units: z
                  .array(
                    z
                      .object({
                        id: z.string().regex(/^[a-z0-9-]{1,80}$/),
                        name: z.string().min(1).max(120),
                      })
                      .strict(),
                  )
                  .max(1000),
                version: z.literal(2),
                createdAt: z.string(),
                reports: z.array(z.record(z.string(), z.any())).max(10000),
                attachments: z.array(z.record(z.string(), z.any())).max(30000),
                imports: z.array(z.record(z.string(), z.any())).max(10000),
                audit: z.array(z.record(z.string(), z.any())).max(100000),
              })
              .strict(),
            signature: z.string().length(64),
          })
          .strict()
          .parse(req.body);
        if (!equal(input.signature, box.hmac(JSON.stringify(input.data))))
          fail(
            400,
            "Tanda tangan backup tidak valid untuk kunci lingkungan ini.",
          );
        await committee(db, async (sql) => {
          for (const unit of input.data.units) {
            const existing = (
              await sql.query("SELECT name FROM master_units WHERE id=$1", [
                unit.id,
              ])
            ).rows[0];
            if (existing && existing.name !== unit.name)
              fail(
                409,
                "Master unit berbeda. Gunakan database pemulihan terpisah.",
              );
            await sql.query(
              "INSERT INTO master_units(id,name) VALUES($1,$2) ON CONFLICT DO NOTHING",
              [unit.id, unit.name],
            );
          }
          for (const row of input.data.reports) {
            uuid.parse(row.id);
            reportInput
              .passthrough()
              .parse(box.decrypt(row.payload, `report:${row.id}`));
            const existing = (
              await sql.query("SELECT * FROM reports WHERE id=$1", [row.id])
            ).rows[0];
            if (existing) {
              if (JSON.stringify(serialize(existing)) !== JSON.stringify(row))
                fail(
                  409,
                  "Laporan yang ada berbeda. Pulihkan backup ke database kosong terpisah.",
                );
              continue;
            }
            await sql.query(
              "INSERT INTO reports(id,number,tracking_hash,status,kind,unit,category,grade,incident_at,created_at,updated_at,version,deadline,payload,idempotency_hash,legacy_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)",
              [
                row.id,
                row.number,
                row.tracking_hash,
                row.status,
                row.kind,
                row.unit,
                row.category,
                row.grade,
                row.incident_at,
                row.created_at,
                row.updated_at,
                row.version,
                row.deadline,
                row.payload,
                row.idempotency_hash,
                row.legacy_id,
              ],
            );
          }
          for (const row of input.data.attachments) {
            box.decrypt(row.payload, `file:${row.report_id}:${row.id}`);
            await sql.query(
              "INSERT INTO attachments(id,report_id,name,mime,payload,created_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING",
              [
                row.id,
                row.report_id,
                row.name,
                row.mime,
                row.payload,
                row.created_at,
              ],
            );
          }
          for (const row of input.data.imports) {
            box.decrypt(row.payload, `import:${row.id}`);
            await sql.query(
              "INSERT INTO import_archives(id,actor_id,source_hash,payload,created_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING",
              [
                row.id,
                row.actor_id,
                row.source_hash,
                row.payload,
                row.created_at,
              ],
            );
          }
          for (const row of input.data.audit)
            await sql.query(
              "INSERT INTO audit_log(id,actor_id,report_id,action,metadata,at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING",
              [
                row.id,
                row.actor_id,
                row.report_id,
                row.action,
                JSON.stringify(row.metadata),
                row.at,
              ],
            );
          await sql.query(
            "INSERT INTO report_counters(year,value) SELECT substring(number from 'IKP-RSAS-([0-9]{4})-')::int,max(substring(number from 'IKP-RSAS-[0-9]{4}-([0-9]+)')::bigint) FROM reports GROUP BY 1 ON CONFLICT(year) DO UPDATE SET value=GREATEST(report_counters.value,EXCLUDED.value)",
          );
          await audit(sql, res.locals.user.id, null, "backup.restored", {
            reports: input.data.reports.length,
          });
        });
        res.json({ restored: input.data.reports.length });
      }),
    );
    router.post(
      "/legacy-import",
      asyncRoute(async (req, res) => {
        const data = backupSchema.parse(req.body),
          sourceHash = digest(JSON.stringify(data));
        const result = await committee(db, async (sql) => {
          await sql.query("SELECT pg_advisory_xact_lock(814772)");
          if (
            (
              await sql.query(
                "SELECT id FROM import_archives WHERE source_hash=$1",
                [sourceHash],
              )
            ).rows.length
          )
            return { imported: 0, alreadyImported: true };
          const allUnits = (await sql.query("SELECT id,name FROM master_units"))
            .rows;
          const unitId = async (name: string) => {
            const original = name.trim() || "Lainnya",
              existing = allUnits.find(
                (u) => u.name.toLowerCase() === original.toLowerCase(),
              );
            if (existing) return existing.id as string;
            const id = `legacy-${digest(original).slice(0, 16)}`;
            await sql.query("INSERT INTO master_units(id,name) VALUES($1,$2)", [
              id,
              original,
            ]);
            allUnits.push({ id, name: original });
            return id;
          };
          for (const name of data.units) await unitId(name);
          const archive = randomUUID();
          await sql.query(
            "INSERT INTO import_archives(id,actor_id,source_hash,payload) VALUES($1,$2,$3,$4)",
            [
              archive,
              res.locals.user.id,
              sourceHash,
              box.encrypt(data, `import:${archive}`),
            ],
          );
          let count = 0;
          for (const old of data.incidents) {
            const existing = (
              await sql.query("SELECT id FROM reports WHERE legacy_id=$1", [
                old.id,
              ])
            ).rows[0];
            if (existing) continue; // Never overwrite a previously imported report.
            const id = randomUUID(),
              r = old.incident;
            const inv = data.investigations.find(
                (i) => i.incidentId === old.id,
              ),
              actions = data.actions.filter((a) => a.incidentId === old.id);
            const payload = {
              incidentDate: r.incidentDate || old.createdAt.slice(0, 10),
              incidentTime: r.incidentTime || "00:00",
              discoveredDate: r.incidentDate || old.createdAt.slice(0, 10),
              unit: await unitId(r.unit),
              location: r.location || "Belum tercatat (impor)",
              service: r.service || "Belum tercatat (impor)",
              kind: r.sentinel.includes("terkonfirmasi")
                ? "Sentinel"
                : r.kind === "KPC"
                  ? "KPCS"
                  : reportKinds.includes(r.kind as any)
                    ? r.kind
                    : "KNC",
              category: "Impor data sebelumnya",
              chronology: r.chronology || "Draft sebelumnya belum lengkap",
              discovery: "Belum tercatat (impor)",
              patientCondition: "Belum tercatat (impor)",
              impact: old.impact || "Belum tercatat (impor)",
              immediateAction: old.immediateAction || "Belum tercatat (impor)",
              supervisorNotified: "Belum",
              patientReference: old.patient.name,
              medicalNumber: old.patient.medicalNumber,
              contributingFactors: "",
              reporterName: old.reporter,
              reporterTitle: r.authorTitle,
              contact: "",
              factual: true,
              ...emptyReview(),
              legacy: {
                incident: old,
                investigations: inv || null,
                actions,
                sourceArchive: archive,
                originalStatus: old.status,
              },
            };
            if (inv)
              payload.investigation = {
                owner: "",
                deadline: "",
                summary: inv.summary,
                facts: inv.facts,
                timeline: inv.timeline,
                whys: inv.whys,
                fishbone: inv.fishbone,
                roots: inv.roots.join("\n"),
                recommendations: inv.recommendations.join("\n"),
              };
            payload.risk = {
              grade: old.riskAssessment.grade,
              impact: old.riskAssessment.impact,
              probability: old.riskAssessment.probability,
              reason: old.riskAssessment.reason,
            };
            payload.actions = actions.map((a) => ({
              id: a.id,
              corrective: a.corrective,
              preventive: a.preventive,
              owner: a.owner,
              deadline: a.target,
              done: a.status === "Selesai",
              evidence: a.evidence,
              evaluation: a.evaluation,
              reviewer: a.reviewer,
            }));
            // Imported histories are preserved; every record requires committee revalidation.
            await sql.query(
              "INSERT INTO reports(id,number,tracking_hash,status,kind,unit,category,grade,incident_at,payload,legacy_id) VALUES($1,$2,$3,'needs_revision',$4,$5,$6,$7,$8,$9,$10)",
              [
                id,
                await nextNumber(sql),
                digest(token()),
                payload.kind,
                payload.unit,
                payload.category,
                payload.risk.grade,
                `${payload.incidentDate}T${payload.incidentTime}:00+07:00`,
                box.encrypt(payload, `report:${id}`),
                old.id,
              ],
            );
            await audit(sql, res.locals.user.id, id, "report.legacy_imported", {
              archive,
              originalNumber: old.displayNumber,
              originalStatus: old.status,
            });
            count++;
          }
          await audit(sql, res.locals.user.id, null, "legacy.imported", {
            archive,
            count,
          });
          return { imported: count, alreadyImported: false };
        });
        res.status(201).json(result);
      }),
    );
  }
}
