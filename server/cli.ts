import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { postgres, migrate } from "./db.js";
import { config } from "./config.js";
import { digest, token } from "./security.js";
const [command, email, name, output] = process.argv.slice(2);
const invitePath = command === "recover" ? name : output;
const db = postgres(process.env.DATABASE_URL || "");
try {
  if (command === "migrate") {
    await migrate(db);
    console.log("Database migration complete.");
  } else if (
    ["invite", "recover"].includes(command) &&
    email &&
    name &&
    invitePath
  ) {
    const settings = config(),
      invitation = token();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Valid email required");
    // Refuse replacement. Write one-time enrollment material to a new mode-0600 file.
    await writeFile(
      invitePath,
      `${settings.origin}/komite/aktivasi#${invitation}\n`,
      { flag: "wx", mode: 0o600 },
    );
    await db.transaction(async (sql) => {
      if (command === "recover") {
        const user = (
          await sql.query(
            "UPDATE app_users SET enabled=false,password_hash=NULL,totp_secret=NULL,last_totp_step=-1,invite_hash=$1,invite_expires=now()+interval '24 hours' WHERE email=$2 AND role='komite_mutu' RETURNING id",
            [digest(invitation), email.toLowerCase()],
          )
        ).rows[0];
        if (!user) throw new Error("Committee account not found");
        await sql.query("DELETE FROM sessions WHERE user_id=$1", [user.id]);
        await sql.query(
          "INSERT INTO audit_log(id,actor_id,action,metadata) VALUES($1,$2,'account.recovery_started','{}')",
          [randomUUID(), user.id],
        );
        return;
      }
      const id = randomUUID();
      await sql.query(
        "INSERT INTO app_users(id,name,email,role,can_manage_accounts,invite_hash,invite_expires) VALUES($1,$2,$3,'komite_mutu',true,$4,now()+interval '24 hours')",
        [id, name, email.toLowerCase(), digest(invitation)],
      );
      await sql.query(
        "INSERT INTO audit_log(id,actor_id,action,metadata) VALUES($1,$2,'account.bootstrapped','{}')",
        [randomUUID(), id],
      );
    });
    console.log(
      "One-time invitation saved to the requested private file. Deliver through an approved secure channel; remove the file after enrollment.",
    );
  } else
    throw new Error(
      "Usage: db:migrate OR account:invite -- email name /private/file OR account:recover -- email /private/file",
    );
} finally {
  await db.close();
}
