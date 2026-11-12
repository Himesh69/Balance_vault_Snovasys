-- Initialize database roles for BalanceVault (PRD Section 9.2)
-- balancevault_migrator: Full DDL + DML (Used by Prisma migrate only)
-- balancevault_app: DML only (Used by running API)

-- Create app role if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'balancevault_app') THEN
      CREATE ROLE balancevault_app WITH LOGIN PASSWORD 'app_secret_pass';
   END IF;
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'balancevault_migrator') THEN
      CREATE ROLE balancevault_migrator WITH LOGIN SUPERUSER PASSWORD 'migrator_secret_pass';
   END IF;
END
$do$;

-- Grant privileges
GRANT CONNECT ON DATABASE balancevault TO balancevault_app;
GRANT CONNECT ON DATABASE balancevault TO balancevault_migrator;

-- Default schema permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO balancevault_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO balancevault_app;

