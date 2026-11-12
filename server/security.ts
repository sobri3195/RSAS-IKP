import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import * as OTPAuth from "otpauth";
const passwordCost = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const derivePassword = (value: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCallback(value, salt, 64, passwordCost, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
export const token = () => randomBytes(32).toString("base64url");
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function cryptoBox(key: string) {
  if (!/^[a-f\d]{64}$/i.test(key))
    throw new Error(
      "DATA_ENCRYPTION_KEY must be 32 random bytes encoded as 64 hex characters",
    );
  const bytes = Buffer.from(key, "hex");
  return {
    encrypt(value: unknown, context: string) {
      const iv = randomBytes(12),
        cipher = createCipheriv("aes-256-gcm", bytes, iv);
      cipher.setAAD(Buffer.from(context));
      const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(value), "utf8"),
        cipher.final(),
      ]);
      return [
        "v1",
        iv.toString("base64"),
        cipher.getAuthTag().toString("base64"),
        encrypted.toString("base64"),
      ].join(".");
    },
    decrypt<T>(value: string, context: string): T {
      const [version, iv, tag, ciphertext] = value.split(".");
      if (version !== "v1") throw new Error("Unsupported ciphertext version");
      const cipher = createDecipheriv(
        "aes-256-gcm",
        bytes,
        Buffer.from(iv, "base64"),
      );
      cipher.setAAD(Buffer.from(context));
      cipher.setAuthTag(Buffer.from(tag, "base64"));
      return JSON.parse(
        Buffer.concat([
          cipher.update(Buffer.from(ciphertext, "base64")),
          cipher.final(),
        ]).toString("utf8"),
      );
    },
    hmac(value: string) {
      return createHmac("sha256", bytes).update(value).digest("hex");
    },
  };
}
export async function hashPassword(value: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${(await derivePassword(value, salt)).toString("hex")}`;
}
export async function verifyPassword(value: string, hash: string) {
  const [algorithm, salt, encoded] = hash.split(":");
  if (algorithm !== "scrypt" || !salt || !encoded) return false;
  const actual = await derivePassword(value, salt),
    expected = Buffer.from(encoded, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export const totp = (secret: string, label = "RSAS") =>
  new OTPAuth.TOTP({
    issuer: "RSAS-SAFETY",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
export const newTotp = () => new OTPAuth.Secret({ size: 20 }).base32;
export function validTotp(
  secret: string,
  value: string,
  lastStep: number,
  now = Date.now(),
) {
  const delta = totp(secret).validate({
    token: value,
    window: 1,
    timestamp: now,
  });
  const step = Math.floor(now / 30000) + (delta ?? 0);
  return delta !== null && step > lastStep ? step : null;
}
