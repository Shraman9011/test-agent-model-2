-- ============================================================
-- Rollback script: removes the users_user table and all
-- associated indexes, constraints, and Django migration records.
--
-- ⚠ WARNING: Run ONLY in development/staging environments.
--             This will DELETE all user data irreversibly.
--
-- Django-managed rollback (preferred):
--     python manage.py migrate users zero
--
-- Manual SQL rollback (emergency only):
-- ============================================================

BEGIN;

-- Drop the users table (CASCADE removes FK references from other tables)
DROP TABLE IF EXISTS users_user CASCADE;

-- Remove Django migration record so the migration can be re-applied cleanly.
DELETE FROM django_migrations WHERE app = 'users';

COMMIT;
