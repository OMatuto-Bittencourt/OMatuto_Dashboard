"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apagarCookieSessao, bloqueado, gravarCookieSessao, limparFalhas, registrarFalha, usuarioAtual } from "@/lib/auth";
import { executar } from "@/lib/db";
import { conferirSenha, gerarHash, hashParaEmailInexistente, validarNovaSenha } from "@/lib/senha";

export type EstadoForm = { erro?: string; email?: string } | undefined;

/** Aceita apenas caminhos internos (evita redirecionamento para outro site). */
function destinoSeguro(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  if (!email || !senha) return { erro: "Informe e-mail e senha.", email };

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconhecido";
  const chaves = [`email:${email}`, `ip:${ip}`];
  if (chaves.some(bloqueado)) return { erro: "Muitas tentativas. Aguarde 15 minutos e tente de novo.", email };

  const [u] = await executar<{ id: string; senha_hash: string; trocar_senha: boolean; versao_senha: number }>(
    `select id, senha_hash, trocar_senha, versao_senha from dashboard.usuarios where email = $1 and ativo`,
    [email],
  );
  const ok = await conferirSenha(senha, u?.senha_hash ?? (await hashParaEmailInexistente()));
  if (!u || !ok) {
    chaves.forEach(registrarFalha);
    return { erro: "E-mail ou senha incorretos.", email };
  }

  chaves.forEach(limparFalhas);
  await executar(`update dashboard.usuarios set ultimo_login = now() where id = $1`, [u.id]);
  await gravarCookieSessao(u);
  redirect(u.trocar_senha ? "/trocar-senha" : destinoSeguro(form.get("destino")));
}

export async function trocarSenha(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const u = await usuarioAtual();
  if (!u) redirect("/login");

  const atual = String(form.get("atual") ?? "");
  const nova = String(form.get("nova") ?? "");
  const confirmacao = String(form.get("confirmacao") ?? "");

  const [reg] = await executar<{ senha_hash: string }>(`select senha_hash from dashboard.usuarios where id = $1`, [u.id]);
  if (!reg || !(await conferirSenha(atual, reg.senha_hash))) return { erro: "A senha atual não confere." };
  if (nova !== confirmacao) return { erro: "A confirmação não é igual à nova senha." };
  if (nova === atual) return { erro: "A nova senha precisa ser diferente da atual." };
  const problema = validarNovaSenha(nova, u.email);
  if (problema) return { erro: problema };

  const [atualizado] = await executar<{ id: string; versao_senha: number }>(
    `update dashboard.usuarios
        set senha_hash = $2, trocar_senha = false, versao_senha = versao_senha + 1, atualizado_em = now()
      where id = $1
      returning id, versao_senha`,
    [u.id, await gerarHash(nova)],
  );
  await gravarCookieSessao(atualizado);
  redirect("/?senha=alterada");
}

export async function sair() {
  await apagarCookieSessao();
  redirect("/login");
}
