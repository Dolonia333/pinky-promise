import { pendingMigrations } from "../../scripts/migration-plan.mjs";

export type DbSource = "postgres" | "pglite";

export interface Sql {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

type PGlite = import("@electric-sql/pglite").PGlite;
type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

const rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
const databaseUrl = rawDatabaseUrl?.trim() ? rawDatabaseUrl : undefined;

export const dbSource: DbSource = databaseUrl ? "postgres" : "pglite";

const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const asText = (value: string) => value;

const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
};

function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) => run<T>(text, params);
  return sql;
}

function createPostgresSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, asText);
    types.setTypeParser(OID_INTERVAL, asText);
    const pool = new Pool({ connectionString: databaseUrl });
    return toSql(async <T>(text: string, params: unknown[]) => {
      const result = await pool.query(text, params);
      return result.rows as T[];
    });
  })().catch((error) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw error;
  });
  return globalRef.__pgSqlPromise__;
}

async function migratePglite(pg: PGlite): Promise<void> {
  const files = import.meta.glob("/migrations/*.sql", { query: "?raw", import: "default", eager: true }) as Record<
    string,
    string
  >;
  const applied = (await pg.query<{ name: string }>("select name from _migrations")).rows.map((row) => row.name);
  for (const { name, path } of pendingMigrations(Object.keys(files), applied)) {
    await pg.transaction(async (tx) => {
      await tx.exec(files[path]);
      await tx.query("insert into _migrations (name) values ($1)", [name]);
    });
  }
}

async function createPgliteSql(): Promise<Sql> {
  globalRef.__pgliteInstance__ ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite({ parsers: { [OID_INT8]: Number, [OID_DATE]: asText, [OID_INTERVAL]: asText } });
    await pg.waitReady;
    await pg.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    return pg;
  })().catch((error) => {
    globalRef.__pgliteInstance__ = undefined;
    throw error;
  });

  const pg = await globalRef.__pgliteInstance__;
  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined)
    .then(() => migratePglite(pg));
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  return toSql(async <T>(text: string, params: unknown[]) => (await pg.query<T>(text, params)).rows);
}

let sqlPromise: Promise<Sql> | null = null;

export function getSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    return Promise.reject(new Error("The database is server-only. Call getSql() from server code."));
  }
  sqlPromise ??= (dbSource === "postgres" ? createPostgresSql() : createPgliteSql()).catch((error) => {
    sqlPromise = null;
    throw error;
  });
  return sqlPromise;
}

export async function getPglite(): Promise<PGlite> {
  if (dbSource !== "pglite") throw new Error("The local database is only used when DATABASE_URL is empty.");
  await getSql();
  const pg = await globalRef.__pgliteInstance__;
  if (!pg) throw new Error("The local database failed to start.");
  return pg;
}

export function ensureDbReady(): Promise<void> {
  if (dbSource !== "pglite") return Promise.resolve();
  return getSql().then(() => undefined);
}
