import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { executar } from "./db";
import { COOKIE_SESSAO, DURACAO_SESSAO_S, assinarSessao, lerSessao } from "./sessao-token";

export type Usuario = {
  id: string;
  email: string;
  nome: string | null;
  perfil: "master" | "usuario";
  trocar_senha: boolean;
  versao_senha: number;
};

/** Usuario da sessao atual, conferido no banco (ativo e com a mesma versao de senha). */
export async function usuarioAtual(): Promise<Usuario | null> {
  const dados = lerSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  if (!dados) return null;
  const [u] = await executar<Usuario>(
    `select id, email, nome, perfil, trocar_senha, versao_senha
     from dashboard.usuarios where id = $1 and ativo`,
    [dados.u],
  );
  if (!u || u.versao_senha !== dados.v) return null;
  return u;
}

/** Exige sessao valida. Por padrao, tambem exige que a troca de senha obrigatoria ja tenha sido feita. */
export async function exigirUsuario(opts: { permitirTrocaPendente?: boolean } = {}): Promise<Usuario> {
  const u = await usuarioAtual();
  if (!u) redirect("/login");
  if (u.trocar_senha && !opts.permitirTrocaPendente) redirect("/trocar-senha");
  return u;
}

export async function gravarCookieSessao(u: Pick<Usuario, "id" | "versao_senha">) {
  const token = assinarSessao({ u: u.id, v: u.versao_senha, e: Math.floor(Date.now() / 1000) + DURACAO_SESSAO_S });
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO_S,
  });
}

export async function apagarCookieSessao() {
  (await cookies()).delete(COOKIE_SESSAO);
}

/* ---------- Limite de tentativas (memoria do processo) ---------- */

const MAX_FALHAS = 5;
const JANELA_MS = 15 * 60 * 1000;
const falhas = new Map<string, { n: number; desde: number }>();

export function bloqueado(chave: string): boolean {
  const f = falhas.get(chave);
  if (!f) return false;
  if (Date.now() - f.desde > JANELA_MS) {
    falhas.delete(chave);
    return false;
  }
  return f.n >= MAX_FALHAS;
}

export function registrarFalha(chave: string) {
  const f = falhas.get(chave);
  if (!f || Date.now() - f.desde > JANELA_MS) falhas.set(chave, { n: 1, desde: Date.now() });
  else f.n += 1;
}

export function limparFalhas(chave: string) {
  falhas.delete(chave);
}
