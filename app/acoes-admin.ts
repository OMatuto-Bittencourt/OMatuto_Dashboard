"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin, perfisPermitidos, podeGerenciar, type Perfil } from "@/lib/auth";
import { executar } from "@/lib/db";
import { gerarHash } from "@/lib/senha";
import { registrarEvento, senhaTemporaria } from "@/lib/usuarios";

export type EstadoAdmin = { erro?: string; ok?: string; senha?: string; email?: string } | undefined;

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function criarUsuario(_: EstadoAdmin, form: FormData): Promise<EstadoAdmin> {
  const ator = await exigirAdmin();
  const nome = String(form.get("nome") ?? "").trim().replace(/\s+/g, " ");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const perfil = String(form.get("perfil") ?? "usuario") as Perfil;

  if (nome.length < 3 || nome.length > 120) return { erro: "Informe o nome completo." };
  if (!RE_EMAIL.test(email) || email.length > 200) return { erro: "E-mail inválido." };
  if (!perfisPermitidos(ator).includes(perfil)) return { erro: "Você não pode criar contas com esse perfil." };

  const [existe] = await executar<{ id: string }>(`select id from dashboard.usuarios where email = $1`, [email]);
  if (existe) return { erro: "Já existe uma conta com esse e-mail." };

  const senha = senhaTemporaria();
  const [novo] = await executar<{ id: string }>(
    `insert into dashboard.usuarios (email, nome, senha_hash, perfil, trocar_senha, criado_por)
     values ($1, $2, $3, $4, true, $5) returning id`,
    [email, nome, await gerarHash(senha), perfil, ator.id],
  );
  await registrarEvento(novo.id, ator.id, "criado", { perfil });
  revalidatePath("/admin");
  return { ok: `Conta criada para ${nome}.`, senha, email };
}

async function alvoGerenciavel(id: string) {
  const ator = await exigirAdmin();
  const [alvo] = await executar<{ id: string; perfil: Perfil; ativo: boolean; email: string; nome: string | null }>(
    `select id, perfil, ativo, email, nome from dashboard.usuarios where id = $1`,
    [id],
  );
  if (!alvo || !podeGerenciar(ator, alvo)) return { ator, alvo: null };
  return { ator, alvo };
}

export async function alternarAtivo(_: EstadoAdmin, form: FormData): Promise<EstadoAdmin> {
  const { ator, alvo } = await alvoGerenciavel(String(form.get("id") ?? ""));
  if (!alvo) return { erro: "Você não tem permissão para alterar esta conta." };
  const ativar = !alvo.ativo;
  // Desativar tambem incrementa a versao da senha: as sessoes abertas caem na hora.
  await executar(
    `update dashboard.usuarios set ativo = $2, versao_senha = versao_senha + case when $2 then 0 else 1 end, atualizado_em = now() where id = $1`,
    [alvo.id, ativar],
  );
  await registrarEvento(alvo.id, ator.id, ativar ? "reativado" : "desativado");
  revalidatePath("/admin");
  return { ok: `${alvo.nome ?? alvo.email} ${ativar ? "reativada" : "desativada"}.` };
}

export async function redefinirSenha(_: EstadoAdmin, form: FormData): Promise<EstadoAdmin> {
  const { ator, alvo } = await alvoGerenciavel(String(form.get("id") ?? ""));
  if (!alvo) return { erro: "Você não tem permissão para alterar esta conta." };
  if (!alvo.ativo) return { erro: "Reative a conta antes de redefinir a senha." };
  const senha = senhaTemporaria();
  await executar(
    `update dashboard.usuarios set senha_hash = $2, trocar_senha = true, versao_senha = versao_senha + 1, atualizado_em = now() where id = $1`,
    [alvo.id, await gerarHash(senha)],
  );
  await registrarEvento(alvo.id, ator.id, "senha_redefinida");
  revalidatePath("/admin");
  return { ok: `Senha de ${alvo.nome ?? alvo.email} redefinida.`, senha, email: alvo.email };
}
