import "server-only";
import { randomInt } from "node:crypto";
import { executar } from "./db";
import type { Perfil } from "./auth";

export type ContaLinha = {
  id: string;
  nome: string | null;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  trocar_senha: boolean;
  criado_em: string;
  criado_por_nome: string | null;
  ultimo_login: string | null;
};

export type Evento = {
  em: string;
  acao: string;
  usuario: string;
  ator: string | null;
  detalhes: Record<string, unknown> | null;
};

export type ResumoCriador = { criador: string; contas: number; ativas: number; ultima: string };
export type CriacaoMes = { mes: string; contas: number };

export async function listarContas(): Promise<ContaLinha[]> {
  return executar<ContaLinha>(`
    select u.id, u.nome, u.email, u.perfil, u.ativo, u.trocar_senha,
           to_char(u.criado_em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI') as criado_em,
           coalesce(c.nome, c.email) as criado_por_nome,
           to_char(u.ultimo_login at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI') as ultimo_login
    from dashboard.usuarios u
    left join dashboard.usuarios c on c.id = u.criado_por
    order by u.criado_em desc`);
}

export async function resumoPorCriador(): Promise<ResumoCriador[]> {
  return executar<ResumoCriador>(`
    select coalesce(c.nome, c.email, 'Criado no banco') as criador,
           count(*)::int as contas, count(*) filter (where u.ativo)::int as ativas,
           to_char(max(u.criado_em) at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI') as ultima
    from dashboard.usuarios u
    left join dashboard.usuarios c on c.id = u.criado_por
    group by 1 order by contas desc, ultima desc`);
}

export async function criacoesPorMes(): Promise<CriacaoMes[]> {
  return executar<CriacaoMes>(`
    select to_char(m, 'YYYY-MM') as mes,
           (select count(*) from dashboard.usuarios u
             where date_trunc('month', u.criado_em at time zone 'America/Sao_Paulo') = m)::int as contas
    from generate_series(date_trunc('month', now() at time zone 'America/Sao_Paulo') - interval '5 months',
                         date_trunc('month', now() at time zone 'America/Sao_Paulo'), interval '1 month') m
    order by m`);
}

export async function eventosRecentes(limite = 30): Promise<Evento[]> {
  return executar<Evento>(
    `select to_char(e.em at time zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI') as em, e.acao,
            coalesce(u.nome, u.email) as usuario, coalesce(a.nome, a.email) as ator, e.detalhes
     from dashboard.usuarios_eventos e
     join dashboard.usuarios u on u.id = e.usuario_id
     left join dashboard.usuarios a on a.id = e.ator_id
     order by e.em desc, e.id desc limit $1`,
    [limite],
  );
}

export async function registrarEvento(usuarioId: string, atorId: string | null, acao: string, detalhes?: Record<string, unknown>) {
  await executar(`insert into dashboard.usuarios_eventos (usuario_id, ator_id, acao, detalhes) values ($1, $2, $3, $4)`, [
    usuarioId,
    atorId,
    acao,
    detalhes ? JSON.stringify(detalhes) : null,
  ]);
}

/** Senha temporaria legivel (sem 0/O/1/l/I), com letras e numeros. Valida so ate a primeira troca. */
export function senhaTemporaria(): string {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const numeros = "23456789";
  const todos = letras + numeros;
  const s = [letras[randomInt(letras.length)], numeros[randomInt(numeros.length)]];
  while (s.length < 12) s.push(todos[randomInt(todos.length)]);
  for (let i = s.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [s[i], s[j]] = [s[j], s[i]];
  }
  return `${s.slice(0, 4).join("")}-${s.slice(4, 8).join("")}-${s.slice(8).join("")}`;
}
