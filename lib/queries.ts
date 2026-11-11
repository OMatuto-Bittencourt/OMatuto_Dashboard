import "server-only";
import { query } from "./db";

export type LojaMes = {
  loja_id: string;
  loja_numero: number;
  loja_nome: string;
  rede: string | null;
  cidade: string | null;
  faturamento: number | null;
  pessoas: number | null;
  dias_com_venda: number | null;
  ultima_venda: string | null;
  headcount_pago: number | null;
  salario_pago: number | null;
  fgts_estimado: number | null;
  custo_folha: number | null;
  coligadas: number[] | null;
};

export type SerieMes = {
  mes: string;
  faturamento: number;
  pessoas: number;
  fat_com_folha: number;
  custo_folha: number;
  headcount: number;
};

export type Dia = { data: string; faturamento: number; pessoas: number };

/** Meses (YYYY-MM) com faturamento no Colibri, mais recente primeiro. */
export async function meses(): Promise<string[]> {
  const rows = await query<{ mes: string }>(`
    select to_char(competencia, 'YYYY-MM') as mes
    from colibri_matuto.vw_fat_mensal_loja
    group by competencia
    having sum(faturamento) > 0
    order by competencia desc`);
  return rows.map((r) => r.mes);
}

/** Faturamento x folha por loja em um mes (YYYY-MM). */
export async function lojasDoMes(mes: string): Promise<LojaMes[]> {
  return query<LojaMes>(
    `
    select v.loja_id::text, v.loja_numero, v.loja_nome, v.rede, v.cidade,
           v.faturamento::float8, v.pessoas::float8, v.dias_com_venda::int,
           to_char(u.ultima_venda, 'YYYY-MM-DD') as ultima_venda,
           v.headcount_pago::int, v.salario_pago::float8, v.fgts_estimado::float8,
           v.custo_folha::float8, v.coligadas
    from colibri_matuto.vw_loja_fat_folha_mensal v
    left join (
      select loja_id, max(data) as ultima_venda
      from colibri_matuto.fat_diario_multi_loja
      where (linha->>'faturamento')::numeric > 0
      group by loja_id
    ) u on u.loja_id = v.loja_id
    where v.competencia = to_date($1, 'YYYY-MM')
    order by v.faturamento desc nulls last, v.loja_numero`,
    [mes],
  );
}

/** Serie mensal da rede. Folha considera apenas lojas com faturamento e coligada ligada no mes. */
export async function serieRede(): Promise<SerieMes[]> {
  return query<SerieMes>(`
    select to_char(competencia, 'YYYY-MM') as mes,
           coalesce(sum(faturamento), 0)::float8 as faturamento,
           coalesce(sum(pessoas), 0)::float8 as pessoas,
           coalesce(sum(faturamento) filter (where custo_folha is not null and faturamento > 0), 0)::float8 as fat_com_folha,
           coalesce(sum(custo_folha) filter (where faturamento > 0), 0)::float8 as custo_folha,
           coalesce(sum(headcount_pago) filter (where faturamento > 0), 0)::int as headcount
    from colibri_matuto.vw_loja_fat_folha_mensal
    group by competencia
    having sum(faturamento) > 0
    order by competencia`);
}

/** Faturamento diario da rede no mes. */
export async function diarioDoMes(mes: string): Promise<Dia[]> {
  return query<Dia>(
    `
    select to_char(data, 'YYYY-MM-DD') as data,
           coalesce(sum((linha->>'faturamento')::numeric), 0)::float8 as faturamento,
           coalesce(sum((linha->>'pessoas')::numeric), 0)::float8 as pessoas
    from colibri_matuto.fat_diario_multi_loja
    where data >= to_date($1, 'YYYY-MM') and data < to_date($1, 'YYYY-MM') + interval '1 month'
    group by data
    order by data`,
    [mes],
  );
}

export type Atualizacao = { colibri_ultima_data: string | null; colibri_sync: string | null; rm_ultima_competencia: string | null };

export async function atualizacao(): Promise<Atualizacao> {
  const [r] = await query<Atualizacao>(`
    select (select to_char(max(data), 'YYYY-MM-DD') from colibri_matuto.fat_diario_multi_loja) as colibri_ultima_data,
           (select to_char(max(sincronizado_em) at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') from colibri_matuto.fat_diario_multi_loja) as colibri_sync,
           (select to_char(max(make_date(anocomp, mescomp, 1)), 'YYYY-MM') from rh_matuto.folha_resumo) as rm_ultima_competencia`);
  return r;
}

/* ---------- Ligacao Colibri x RM ---------- */

export type Ligacao = {
  loja_id: string;
  loja_numero: number;
  loja_nome: string;
  rede: string | null;
  codcoligada: number;
  coligada_nome: string | null;
  cnpj: string | null;
  vigente_de: string;
  vigente_ate: string | null;
  observacao: string | null;
  ativos: number;
};

export async function ligacoes(): Promise<Ligacao[]> {
  return query<Ligacao>(`
    select l.id::text as loja_id, l.numero as loja_numero, l.nome as loja_nome, l.nome_rede_pai as rede,
           cl.codcoligada, c.nome as coligada_nome, c.cnpj,
           to_char(cl.vigente_de, 'YYYY-MM-DD') as vigente_de, to_char(cl.vigente_ate, 'YYYY-MM-DD') as vigente_ate,
           cl.observacao,
           (select count(*) from rh_matuto.funcionarios f where f.codcoligada = cl.codcoligada and f.codsituacao <> 'D')::int as ativos
    from colibri_matuto.coligada_loja cl
    join colibri_matuto.lojas l on l.id = cl.loja_id
    left join rh_matuto.coligadas_rm c on c.codcoligada = cl.codcoligada
    order by l.numero, cl.codcoligada`);
}

export type Pendencia = {
  tipo: "LOJA_SEM_COLIGADA" | "COLIGADA_SEM_LOJA";
  loja_id: string | null;
  loja_numero: number | null;
  loja_nome: string | null;
  codcoligada: number | null;
  coligada_nome: string | null;
  fat_60d: number | null;
  ult_venda: string | null;
  funcionarios_ativos: number | null;
};

export async function pendencias(): Promise<Pendencia[]> {
  return query<Pendencia>(`
    select tipo, loja_id::text, loja_numero, loja_nome, codcoligada, coligada_nome,
           fat_60d::float8, to_char(ult_venda, 'YYYY-MM-DD') as ult_venda, funcionarios_ativos::int
    from colibri_matuto.vw_pendencias_ligacao
    order by tipo desc, fat_60d desc nulls last, funcionarios_ativos desc nulls last`);
}

export type Classificacao = { codcoligada: number; nome: string | null; tipo: string; observacao: string | null };

export async function classificacoes(): Promise<Classificacao[]> {
  return query<Classificacao>(`
    select cc.codcoligada, c.nome, cc.tipo, cc.observacao
    from rh_matuto.coligada_classificacao cc
    left join rh_matuto.coligadas_rm c using (codcoligada)
    order by cc.tipo, cc.codcoligada`);
}

/* ---------- Modelo de dados ---------- */

export type Tabela = {
  schema: string;
  tabela: string;
  tipo: "tabela" | "view";
  linhas: number | null;
  colunas: number;
  pk: string | null;
  fks: string | null;
  comentario: string | null;
};

export async function modeloDados(): Promise<Tabela[]> {
  return query<Tabela>(`
    with rel as (
      select c.oid, n.nspname as schema, c.relname as tabela,
             case c.relkind when 'v' then 'view' else 'tabela' end as tipo,
             case when c.relkind = 'r' then coalesce(s.n_live_tup, greatest(c.reltuples, 0))::bigint end as linhas,
             obj_description(c.oid, 'pg_class') as comentario
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_stat_user_tables s on s.relid = c.oid
      where n.nspname in ('colibri_matuto', 'rh_matuto') and c.relkind in ('r', 'v')
    ),
    pk as (
      select con.conrelid as oid,
             string_agg(a.attname, ', ' order by array_position(con.conkey, a.attnum)) as pk
      from pg_constraint con
      join pg_attribute a on a.attrelid = con.conrelid and a.attnum = any (con.conkey)
      where con.contype = 'p'
      group by con.conrelid
    ),
    fk as (
      select con.conrelid as oid,
             string_agg(
               (select string_agg(a.attname, ', ') from pg_attribute a where a.attrelid = con.conrelid and a.attnum = any (con.conkey))
               || ' -> ' || con.confrelid::regclass::text, '; ' order by con.conname) as fks
      from pg_constraint con
      where con.contype = 'f'
      group by con.conrelid
    )
    select rel.schema, rel.tabela, rel.tipo, rel.linhas::float8 as linhas,
           (select count(*) from pg_attribute a where a.attrelid = rel.oid and a.attnum > 0 and not a.attisdropped)::int as colunas,
           pk.pk, fk.fks, rel.comentario
    from rel
    left join pk using (oid)
    left join fk using (oid)
    order by rel.schema, rel.tipo, rel.tabela`);
}
