// Token de sessao assinado (HMAC-SHA256). Usado pelo middleware e pelo servidor; sem acesso ao banco.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_SESSAO = "mto_sessao";
export const DURACAO_SESSAO_S = 8 * 60 * 60; // 8 horas

export type DadosSessao = { u: string; v: number; e: number }; // usuario, versao_senha, expira (epoch s)

function segredo(): Buffer {
  const definido = process.env.SESSION_SECRET;
  if (definido && definido.length >= 32) return Buffer.from(definido);
  // Sem SESSION_SECRET, deriva da DATABASE_URL (que contem a senha do banco e nunca vai ao navegador).
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("Defina SESSION_SECRET ou DATABASE_URL.");
  return createHash("sha256").update(`omatuto-dashboard-sessao:${base}`).digest();
}

const b64url = (b: Buffer) => b.toString("base64url");

export function assinarSessao(dados: DadosSessao): string {
  const corpo = b64url(Buffer.from(JSON.stringify(dados)));
  const assinatura = b64url(createHmac("sha256", segredo()).update(corpo).digest());
  return `${corpo}.${assinatura}`;
}

export function lerSessao(token: string | undefined): DadosSessao | null {
  if (!token) return null;
  const [corpo, assinatura] = token.split(".");
  if (!corpo || !assinatura) return null;
  const esperado = createHmac("sha256", segredo()).update(corpo).digest();
  const recebido = Buffer.from(assinatura, "base64url");
  if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) return null;
  try {
    const dados = JSON.parse(Buffer.from(corpo, "base64url").toString()) as DadosSessao;
    if (typeof dados.u !== "string" || typeof dados.v !== "number" || typeof dados.e !== "number") return null;
    if (dados.e * 1000 < Date.now()) return null;
    return dados;
  } catch {
    return null;
  }
}
