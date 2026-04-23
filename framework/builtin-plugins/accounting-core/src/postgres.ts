export type AccountingCoreSqlOptions = {
  schemaName?: string;
  dropSchema?: boolean;
};

export function buildAccountingCoreMigrationSql(options: AccountingCoreSqlOptions = {}): string[] {
  const schemaName = normalizeIdentifier(options.schemaName ?? "accounting_core", "schemaName");
  return [
    `CREATE SCHEMA IF NOT EXISTS ${schemaName};`,
    `CREATE TABLE IF NOT EXISTS ${schemaName}.primary_records (id text PRIMARY KEY, tenant_id text NOT NULL, title text NOT NULL, counterparty_id text NOT NULL, company_id text NOT NULL, branch_id text NOT NULL, record_state text NOT NULL, approval_state text NOT NULL, posting_state text NOT NULL, fulfillment_state text NOT NULL, amount_minor integer NOT NULL, currency_code text NOT NULL, revision_no integer NOT NULL, reason_code text NULL, effective_at timestamptz NOT NULL, correlation_id text NOT NULL, process_id text NOT NULL, upstream_refs jsonb NOT NULL, downstream_refs jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());`,
    `CREATE TABLE IF NOT EXISTS ${schemaName}.secondary_records (id text PRIMARY KEY, tenant_id text NOT NULL, primary_record_id text NOT NULL, label text NOT NULL, status text NOT NULL, requested_action text NOT NULL, reason_code text NULL, correlation_id text NOT NULL, process_id text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());`,
    `CREATE TABLE IF NOT EXISTS ${schemaName}.exception_records (id text PRIMARY KEY, tenant_id text NOT NULL, primary_record_id text NOT NULL, severity text NOT NULL, status text NOT NULL, reason_code text NOT NULL, upstream_ref text NULL, downstream_ref text NULL, updated_at timestamptz NOT NULL DEFAULT now());`,
    `CREATE UNIQUE INDEX IF NOT EXISTS ${getAccountingCoreLookupIndexName()} ON ${schemaName}.primary_records (tenant_id, title, correlation_id);`,
    `CREATE INDEX IF NOT EXISTS ${getAccountingCoreStatusIndexName()} ON ${schemaName}.exception_records (tenant_id, status, severity);`
  ];
}

export function buildAccountingCoreRollbackSql(options: AccountingCoreSqlOptions = {}): string[] {
  const schemaName = normalizeIdentifier(options.schemaName ?? "accounting_core", "schemaName");
  const dropSchema = options.dropSchema ?? schemaName !== "accounting_core";
  return [
    `DROP TABLE IF EXISTS ${schemaName}.exception_records CASCADE;`,
    `DROP TABLE IF EXISTS ${schemaName}.secondary_records CASCADE;`,
    `DROP TABLE IF EXISTS ${schemaName}.primary_records CASCADE;`,
    ...(dropSchema ? [`DROP SCHEMA IF EXISTS ${schemaName} CASCADE;`] : [])
  ];
}

export function getAccountingCoreLookupIndexName(): string {
  return "accounting_core_primary_lookup_idx";
}

export function getAccountingCoreStatusIndexName(): string {
  return "accounting_core_exception_status_idx";
}

function normalizeIdentifier(value: string, label: string): string {
  if (!/^[a-z][a-z0-9_]*$/i.test(value)) {
    throw new Error(`${label} must use simple alphanumeric or underscore SQL identifiers`);
  }
  return value.toLowerCase();
}
