import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Hash de senha com scrypt (nativo do Node). Formato: scrypt$N$r$p$salt_b64$hash_b64
const N = 16384;
const R = 8;
const P = 1;
const TAM = 64;

function scrypt(senha: string, salt: Buffer, tam: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((ok, erro) => scryptCb(senha, salt, tam, opts, (e, k) => (e ? erro(e) : ok(k))));
}

export async function gerarHash(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(senha.normalize("NFKC"), salt, TAM, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function conferirSenha(senha: string, armazenado: string): Promise<boolean> {
  const partes = armazenado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = partes;
  const esperado = Buffer.from(hashB64, "base64");
  const calc = await scrypt(senha.normalize("NFKC"), Buffer.from(saltB64, "base64"), esperado.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  });
  return calc.length === esperado.length && timingSafeEqual(calc, esperado);
}

// Hash fixo usado quando o e-mail nao existe, para o tempo de resposta nao revelar quais e-mails sao validos.
let hashFicticio: Promise<string> | null = null;
export function hashParaEmailInexistente(): Promise<string> {
  hashFicticio ??= gerarHash(randomBytes(16).toString("hex"));
  return hashFicticio;
}

/** Regras minimas para a nova senha. Retorna a mensagem de erro ou null. */
export function validarNovaSenha(nova: string, email: string): string | null {
  if (nova.length < 10) return "A nova senha precisa ter pelo menos 10 caracteres.";
  if (nova.length > 200) return "A nova senha é longa demais.";
  if (!/[a-zA-Z]/.test(nova) || !/\d/.test(nova)) return "Use letras e números na nova senha.";
  if (nova.toLowerCase().includes(email.split("@")[0].toLowerCase())) return "A senha não pode conter o seu e-mail.";
  return null;
}
