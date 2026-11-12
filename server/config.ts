export interface Config {
  origin: string;
  key: string;
  production: boolean;
  attachments: boolean;
  publicReportsPerHour?: number;
}
export function config(): Config {
  const origin = process.env.APP_ORIGIN;
  if (!origin || new URL(origin).origin !== origin)
    throw new Error(
      "APP_ORIGIN must be a complete origin without a trailing slash",
    );
  const production = process.env.NODE_ENV === "production";
  if (production && !origin.startsWith("https://"))
    throw new Error("Production APP_ORIGIN requires HTTPS");
  if (!process.env.DATA_ENCRYPTION_KEY)
    throw new Error("DATA_ENCRYPTION_KEY is required");
  const publicReportsPerHour = Number(
    process.env.PUBLIC_REPORTS_PER_HOUR || 120,
  );
  if (
    !Number.isSafeInteger(publicReportsPerHour) ||
    publicReportsPerHour < 1 ||
    publicReportsPerHour > 10000
  )
    throw new Error("PUBLIC_REPORTS_PER_HOUR must be between 1 and 10000");
  return {
    origin,
    key: process.env.DATA_ENCRYPTION_KEY,
    production,
    attachments: process.env.ALLOW_ATTACHMENTS === "true",
    publicReportsPerHour,
  };
}
