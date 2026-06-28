-- Rollback script: destroys all Leave Management tables in the correct order.
-- Run ONLY in a development/staging environment.
-- For Django-managed rollback use: python manage.py migrate leaves zero

BEGIN;

DROP TABLE IF EXISTS leaves_leavebalance CASCADE;
DROP TABLE IF EXISTS leaves_leaverequest CASCADE;
DROP TABLE IF EXISTS leaves_leavetype CASCADE;

-- Remove Django migration record so `migrate leaves 0001` can be re-applied.
DELETE FROM django_migrations WHERE app = 'leaves';

COMMIT;
