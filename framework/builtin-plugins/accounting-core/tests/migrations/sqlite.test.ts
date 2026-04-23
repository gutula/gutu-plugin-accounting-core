import { describe, expect, it } from "bun:test";

import {
  buildAccountingCoreSqliteMigrationSql,
  buildAccountingCoreSqliteRollbackSql,
  getAccountingCoreSqliteLookupIndexName,
  getAccountingCoreSqliteStatusIndexName
} from "../../src/sqlite";

describe("accounting-core sqlite helpers", () => {
  it("creates the business tables and indexes", () => {
    const sql = buildAccountingCoreSqliteMigrationSql().join("\n");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS accounting_core_primary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS accounting_core_secondary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS accounting_core_exception_records");
    expect(sql).toContain(getAccountingCoreSqliteLookupIndexName("accounting_core_"));
    expect(sql).toContain(getAccountingCoreSqliteStatusIndexName("accounting_core_"));
  });

  it("rolls the sqlite tables back safely", () => {
    const sql = buildAccountingCoreSqliteRollbackSql({ tablePrefix: "accounting_core_preview_" }).join("\n");
    expect(sql).toContain("DROP TABLE IF EXISTS accounting_core_preview_exception_records");
  });
});
