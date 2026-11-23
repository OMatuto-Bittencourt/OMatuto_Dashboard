// Gera o SQL para criar um usuário do painel em dashboard.usuarios.
// Uso: node scripts/novo-usuario.mjs email@bcef.com.br "Nome Sobrenome" [usuario|master]
//
// Cria uma senha provisória aleatória (mostrada uma única vez) e o hash no mesmo formato
// de lib/senha.ts. O usuário entra com ela e é obrigado a trocar no primeiro acesso.
// Rode o SQL no SQL Editor do projeto do painel (omatuto-dados).
import { randomBytes, scryptSync } from "node:crypto";

const [email, nome, perfil = "usuario"] = process.argv.slice(2);
if (!email || !email.includes("@") || !["usuario", "master"].includes(perfil)) {
  console.error('Uso: node scripts/novo-usuario.mjs email@bcef.com.br "Nome Sobrenome" [usuario|master]');
  process.exit(1);
}

// Mesmos parâmetros de lib/senha.ts — se mudarem lá, mudar aqui.
const N = 16384, R = 8, P = 1, TAM = 64;
const senha = randomBytes(12).toString("base64url"); // 16 caracteres
const salt = randomBytes(16);
const hash = scryptSync(senha.normalize("NFKC"), salt, TAM, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
const senhaHash = `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;

const q = (s) => (s ? `'${String(s).replace(/'/g, "''")}'` : "null");

console.log(`\nSenha provisória (envie por canal seguro; não fica salva em lugar nenhum):\n  ${senha}\n`);
console.log("SQL:\n");
console.log(`insert into dashboard.usuarios (email, nome, senha_hash, perfil, trocar_senha)
values (${q(email.trim().toLowerCase())}, ${q(nome)}, ${q(senhaHash)}, ${q(perfil)}, true);\n`);
