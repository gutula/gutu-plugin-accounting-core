import { describe, expect, it } from "bun:test";

import {
  buildAccountingCoreMigrationSql,
  buildAccountingCoreRollbackSql,
  getAccountingCoreLookupIndexName,
  getAccountingCoreStatusIndexName
} from "../../src/postgres";

describe("accounting-core postgres helpers", () => {
  it("creates the business tables and indexes", () => {
    const sql = buildAccountingCoreMigrationSql().join("\n");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS accounting_core.primary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS accounting_core.secondary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS accounting_core.exception_records");
    expect(sql).toContain(getAccountingCoreLookupIndexName());
    expect(sql).toContain(getAccountingCoreStatusIndexName());
  });

  it("rolls the schema back safely", () => {
    const sql = buildAccountingCoreRollbackSql({ schemaName: "accounting_core_preview", dropSchema: true }).join("\n");
    expect(sql).toContain("DROP TABLE IF EXISTS accounting_core_preview.exception_records");
    expect(sql).toContain("DROP SCHEMA IF EXISTS accounting_core_preview CASCADE");
  });
});
