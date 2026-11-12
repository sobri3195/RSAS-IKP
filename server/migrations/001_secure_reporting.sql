-- Additive migration. Existing browser demo records are imported explicitly, never deleted.
CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS app_users (
 id uuid PRIMARY KEY, name text NOT NULL, email text UNIQUE NOT NULL,
 role text NOT NULL CHECK (role IN ('komite_mutu','user','technical_admin')),
 can_manage_accounts boolean NOT NULL DEFAULT false, password_hash text,
 totp_secret text, last_totp_step bigint NOT NULL DEFAULT -1, enabled boolean NOT NULL DEFAULT false,
 invite_hash text UNIQUE, invite_expires timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_users(id),
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, hits integer NOT NULL, reset_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS report_counters (year integer PRIMARY KEY, value bigint NOT NULL CHECK (value > 0));
CREATE TABLE IF NOT EXISTS master_units (id text PRIMARY KEY, name text UNIQUE NOT NULL);
INSERT INTO master_units(id,name) VALUES ('igd','IGD'),('rawat-inap','Rawat Inap'),('rawat-jalan','Rawat Jalan'),('icu','ICU'),('kamar-operasi','Kamar Operasi'),('farmasi','Farmasi'),('laboratorium','Laboratorium'),('radiologi','Radiologi'),('lainnya','Lainnya') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS reports (
 id uuid PRIMARY KEY, number text UNIQUE NOT NULL, tracking_hash text UNIQUE NOT NULL,
 status text NOT NULL CHECK (status IN ('submitted','under_review','validated','investigation','action_plan','effectiveness_review','closed','needs_revision','archived')),
 kind text NOT NULL CHECK (kind IN ('KPCS','KNC','KTC','KTD','Sentinel')),
 unit text NOT NULL REFERENCES master_units(id), category text NOT NULL, grade text CHECK (grade IN ('BIRU','HIJAU','KUNING','MERAH')),
 incident_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 version integer NOT NULL DEFAULT 1, deadline date, payload text NOT NULL,
 idempotency_hash text UNIQUE, legacy_id uuid UNIQUE
);
CREATE INDEX IF NOT EXISTS reports_filters ON reports (created_at DESC, unit, kind, status);
CREATE TABLE IF NOT EXISTS attachments (
 id uuid PRIMARY KEY, report_id uuid NOT NULL REFERENCES reports(id), name text NOT NULL,
 mime text NOT NULL CHECK (mime IN ('image/png','image/jpeg')), payload text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_log (
 id uuid PRIMARY KEY, actor_id uuid, report_id uuid REFERENCES reports(id), action text NOT NULL,
 metadata jsonb NOT NULL DEFAULT '{}', at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_by_report ON audit_log (report_id, at DESC);
CREATE TABLE IF NOT EXISTS import_archives (
 id uuid PRIMARY KEY, actor_id uuid NOT NULL, source_hash text UNIQUE NOT NULL,
 payload text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports FORCE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
ALTER TABLE import_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_archives FORCE ROW LEVEL SECURITY;
-- All clinical SQL is executed with SET LOCAL app.role after server authentication.
CREATE POLICY committee_reports ON reports FOR ALL USING (current_setting('app.role',true) = 'komite_mutu') WITH CHECK (current_setting('app.role',true) = 'komite_mutu');
CREATE POLICY committee_files ON attachments FOR ALL USING (current_setting('app.role',true) = 'komite_mutu') WITH CHECK (current_setting('app.role',true) = 'komite_mutu');
CREATE POLICY committee_audit ON audit_log FOR SELECT USING (current_setting('app.role',true) = 'komite_mutu');
CREATE POLICY append_audit ON audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY committee_imports ON import_archives FOR ALL USING (current_setting('app.role',true) = 'komite_mutu') WITH CHECK (current_setting('app.role',true) = 'komite_mutu');
-- Public submissions use a narrowly scoped server transaction; no SQL or DB keys reach clients.
-- Audit records cannot be changed even by the application table owner.
CREATE FUNCTION deny_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Audit log is append only'; END $$;
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION deny_audit_mutation();
INSERT INTO schema_migrations(version) VALUES (1);
