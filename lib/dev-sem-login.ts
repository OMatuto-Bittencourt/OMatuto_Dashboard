// Atalho de desenvolvimento: DEV_SEM_LOGIN=1 no .env.local libera as telas internas sem login,
// para trabalhar em layout sem banco. Só vale em `next dev` — em build/produção NODE_ENV é
// "production" e a chave é ignorada. Para voltar ao normal, apague a linha do .env.local.
import type { Usuario } from "./auth";

export const SEM_LOGIN = process.env.NODE_ENV === "development" && process.env.DEV_SEM_LOGIN === "1";

if (SEM_LOGIN) console.warn("⚠ DEV_SEM_LOGIN=1: autenticação DESLIGADA (somente desenvolvimento).");

export const USUARIO_DEV: Usuario = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "dev@local",
  nome: "Desenvolvimento",
  // Perfil comum de propósito: o atalho serve para layout e NÃO pode liberar a gestão de contas
  // (/admin grava no banco real). Para testar o admin, entre com um login de verdade.
  perfil: "usuario",
  trocar_senha: false,
  versao_senha: 1,
};
