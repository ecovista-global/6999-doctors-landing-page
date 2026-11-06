-- Migration 0003: Audit Log Immutability & Append-Only Trigger (MT-114 / SD-048)

CREATE OR REPLACE FUNCTION enforce_audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
  IF NULLIF(current_setting('app.bypass_audit_immutability', true), '') = 'on' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'audit_log is append-only and cannot be modified';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_log is append-only and cannot be deleted';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON "audit_log";

CREATE TRIGGER trg_audit_log_immutable
BEFORE UPDATE OR DELETE ON "audit_log"
FOR EACH ROW
EXECUTE FUNCTION enforce_audit_log_immutable();
