import "server-only";
import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL nao configurada.");
  }
  // O Supabase exige TLS. O certificado do pooler e assinado pela CA do Supabase;
  // informe-a em DATABASE_CA_CERT (conteudo PEM) para validacao completa.
  // DATABASE_SSL=disable apenas para desenvolvimento local.
  const ca = process.env.DATABASE_CA_CERT;
  const ssl = process.env.DATABASE_SSL === "disable" ? false : ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false };
  return new Pool({
    connectionString,
    ssl,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

function pool(): Pool {
  if (!globalThis.__pgPool) globalThis.__pgPool = createPool();
  return globalThis.__pgPool;
}

/** Escrita: usar apenas para a tabela dashboard.usuarios (login e troca de senha). */
export async function executar<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool().query<T>(sql, params);
  return res.rows;
}

/** Executa uma consulta dentro de uma transacao somente-leitura. */
export async function query<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = await pool().connect();
  try {
    await client.query("begin read only");
    const res = await client.query<T>(sql, params);
    await client.query("commit");
    return res.rows;
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
