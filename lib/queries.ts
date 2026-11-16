import "server-only";
import { query } from "./db";

/* Todas as consultas leem o schema `dashboard` (views sobre colibri_matuto e rh_matuto).
   DASHBOARD_SCHEMA permite apontar para outro schema com as mesmas views (ex.: dashboard_preview, validação local). */
const S = (process.env.DASHBOARD_SCHEMA || "dashboard").replace(/[^a-z0-9_]/gi, "");
export const SCHEMA_PAINEL = S;

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

export type Cobertura = {
  mes: string;
  dias_sincronizados: number;
  dias_esperados: number;
  completo: boolean;
  mes_fechado: boolean;
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

/** Meses (YYYY-MM) com dados no Colibri e/ou folha no RM, mais recente primeiro. */
export async function meses(): Promise<string[]> {
  const rows = await query<{ mes: string }>(`
    select to_char(competencia, 'YYYY-MM') as mes
    from ${S}.vw_loja_fat_folha_mensal
    group by competencia
    order by competencia desc`);
  return rows.map((r) => r.mes);
}

export async function cobertura(): Promise<Cobertura[]> {
  return query<Cobertura>(`
    select to_char(competencia, 'YYYY-MM') as mes, dias_sincronizados::int, dias_esperados::int, completo, mes_fechado
    from ${S}.vw_cobertura_colibri order by competencia`);
}

export async function lojasDoMes(mes: string): Promise<LojaMes[]> {
  return query<LojaMes>(
    `
    select loja_id, loja_numero, loja_nome, rede, cidade,
           faturamento::float8, pessoas::float8, dias_com_venda::int,
           to_char(ultima_venda, 'YYYY-MM-DD') as ultima_venda,
           headcount_pago::int, salario_pago::float8, fgts_estimado::float8, custo_folha::float8, coligadas
    from ${S}.vw_loja_fat_folha_mensal
    where competencia = to_date($1, 'YYYY-MM')
    order by faturamento desc nulls last, loja_numero`,
    [mes],
  );
}

export async function serieRede(): Promise<SerieMes[]> {
  return query<SerieMes>(`
    select to_char(competencia, 'YYYY-MM') as mes,
           coalesce(sum(faturamento), 0)::float8 as faturamento,
           coalesce(sum(pessoas), 0)::float8 as pessoas,
           coalesce(sum(faturamento) filter (where custo_folha is not null and faturamento > 0), 0)::float8 as fat_com_folha,
           coalesce(sum(custo_folha) filter (where faturamento > 0), 0)::float8 as custo_folha,
           coalesce(sum(headcount_pago) filter (where faturamento > 0), 0)::int as headcount
    from ${S}.vw_loja_fat_folha_mensal
    group by competencia
    having sum(faturamento) > 0
    order by competencia`);
}

export async function diarioDoMes(mes: string, lojaId?: string): Promise<Dia[]> {
  return query<Dia>(
    `
    select to_char(data, 'YYYY-MM-DD') as data,
           coalesce(sum(faturamento), 0)::float8 as faturamento,
           coalesce(sum(pessoas), 0)::float8 as pessoas
    from ${S}.vw_fat_diario_loja
    where loja_id is not null
      and data >= to_date($1, 'YYYY-MM') and data < to_date($1, 'YYYY-MM') + interval '1 month'
      and ($2::text is null or loja_id = $2)
    group by data order by data`,
    [mes, lojaId ?? null],
  );
}

export type Atualizacao = { colibri_ultima_data: string | null; colibri_sync: string | null; rm_sync: string | null; rm_ultima_competencia: string | null };

export async function atualizacao(): Promise<Atualizacao> {
  const [r] = await query<Atualizacao>(`
    select (select to_char(max(inicio), 'YYYY-MM-DD') from colibri_matuto.periodos where relatorio = 'faturamento_diario_loja' and ultimo_sucesso is not null) as colibri_ultima_data,
           (select to_char(max(ultimo_sucesso) at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') from colibri_matuto.periodos) as colibri_sync,
           (select to_char(max(verificado_em) at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') from rh_matuto.sync_estado) as rm_sync,
           (select to_char(max(make_date(ano, mes, 1)), 'YYYY-MM') from rh_matuto.folha_resumo) as rm_ultima_competencia`);
  return r;
}

/* ---------- Vendas ---------- */

export type Fatia = { rotulo: string; valor: number; pessoas: number | null };

export async function lojasComVenda(): Promise<{ loja_id: string; nome: string }[]> {
  return query(`
    select l.loja_id, l.nome from ${S}.vw_lojas l
    where exists (select 1 from ${S}.vw_fat_diario_loja f where f.loja_id = l.loja_id and f.faturamento > 0)
    order by l.numero`);
}

const filtroPeriodo = `data >= to_date($1, 'YYYY-MM') and data < to_date($1, 'YYYY-MM') + interval '1 month' and ($2::text is null or loja_id = $2)`;

export async function modoVenda(mes: string, lojaId?: string): Promise<Fatia[]> {
  return query<Fatia>(
    `select modo_venda as rotulo, coalesce(sum(faturamento), 0)::float8 as valor, coalesce(sum(pessoas), 0)::float8 as pessoas
     from ${S}.vw_modo_venda_diario where loja_id is not null and ${filtroPeriodo}
     group by 1 having sum(faturamento) > 0 order by 2 desc`,
    [mes, lojaId ?? null],
  );
}

export async function meioPagamento(mes: string, lojaId?: string): Promise<Fatia[]> {
  return query<Fatia>(
    `select categoria as rotulo, coalesce(sum(valor), 0)::float8 as valor, null::float8 as pessoas
     from ${S}.vw_meio_pagamento_diario where loja_id is not null and categoria <> 'A classificar' and ${filtroPeriodo}
     group by 1 having sum(valor) > 0 order by 2 desc`,
    [mes, lojaId ?? null],
  );
}

/** Último dia com formas de pagamento apuradas para as lojas 3S (null quando não há 3S no painel). */
export async function apuracaoPagamento3s(): Promise<string | null> {
  const [r] = await query<{ ate: string | null }>(`select to_char(max(periodo_fim), 'YYYY-MM-DD') as ate from "3s_matuto".meio_pagamento_mensal`);
  return r?.ate ?? null;
}

export async function faturamentoPorHora(mes: string, lojaId?: string): Promise<{ hora: number; faturamento: number; pessoas: number; dias: number }[]> {
  return query(
    `select hora, coalesce(sum(faturamento), 0)::float8 as faturamento, coalesce(sum(pessoas), 0)::float8 as pessoas,
            count(distinct data)::int as dias
     from ${S}.vw_fat_hora where loja_id is not null and ${filtroPeriodo}
     group by hora order by hora`,
    [mes, lojaId ?? null],
  );
}

export type EntregaLoja = { loja_nome: string; entregas: number; total_pedido: number; taxa_entrega: number };

export async function entregasPorLoja(mes: string, lojaId?: string): Promise<EntregaLoja[]> {
  return query<EntregaLoja>(
    `select l.nome as loja_nome, coalesce(sum(e.entregas), 0)::float8 as entregas,
            coalesce(sum(e.total_pedido), 0)::float8 as total_pedido, coalesce(sum(e.taxa_entrega), 0)::float8 as taxa_entrega
     from ${S}.vw_entregas_diario e join ${S}.vw_lojas l using (loja_id)
     where ${filtroPeriodo.replace(/loja_id/g, "e.loja_id").replace(/\bdata\b/g, "e.data")}
     group by l.nome, l.numero having sum(e.entregas) > 0 order by total_pedido desc`,
    [mes, lojaId ?? null],
  );
}

/* ---------- Delivery ---------- */

export type DiaDelivery = { data: string; delivery: number; pedidos: number; total: number };

/** Delivery (modo de venda "Entrega") x faturamento total, por dia. */
export async function deliveryDiario(mes: string, lojaId?: string): Promise<DiaDelivery[]> {
  return query<DiaDelivery>(
    `with d as (
       select data, sum(faturamento) as delivery, sum(pessoas) as pedidos
       from ${S}.vw_modo_venda_diario
       where loja_id is not null and lower(modo_venda) = 'entrega' and ${filtroPeriodo}
       group by data
     ), t as (
       select data, sum(faturamento) as total
       from ${S}.vw_fat_diario_loja
       where loja_id is not null and ${filtroPeriodo}
       group by data
     )
     select to_char(t.data, 'YYYY-MM-DD') as data,
            coalesce(d.delivery, 0)::float8 as delivery, coalesce(d.pedidos, 0)::float8 as pedidos, coalesce(t.total, 0)::float8 as total
     from t left join d using (data)
     order by t.data`,
    [mes, lojaId ?? null],
  );
}

export type DeliveryLoja = {
  loja_id: string;
  loja_nome: string;
  origem: string;
  total: number;
  delivery: number;
  pedidos: number;
  taxa_entrega: number | null;
};

/** Delivery por loja: valor, pedidos, participação no faturamento e taxa de entrega (quando o sistema informa). */
export async function deliveryPorLoja(mes: string, lojaId?: string): Promise<DeliveryLoja[]> {
  return query<DeliveryLoja>(
    `with d as (
       select loja_id, sum(faturamento) as delivery, sum(pessoas) as pedidos
       from ${S}.vw_modo_venda_diario
       where loja_id is not null and lower(modo_venda) = 'entrega' and ${filtroPeriodo}
       group by loja_id
     ), t as (
       select loja_id, sum(faturamento) as total,
              bool_or(loja_relatorio like '3S %' and faturamento > 0) as tem_3s,
              bool_or(coalesce(loja_relatorio, '') not like '3S %' and faturamento > 0) as tem_colibri
       from ${S}.vw_fat_diario_loja
       where loja_id is not null and ${filtroPeriodo}
       group by loja_id
     ), e as (
       select loja_id, sum(taxa_entrega) as taxa_entrega, bool_or(taxa_entrega is not null) as informa_taxa
       from ${S}.vw_entregas_diario
       where loja_id is not null and ${filtroPeriodo}
       group by loja_id
     )
     select l.loja_id, l.nome as loja_nome,
            case when t.tem_3s and t.tem_colibri then 'Colibri + 3S' when t.tem_3s then '3S' else 'Colibri' end as origem,
            coalesce(t.total, 0)::float8 as total, coalesce(d.delivery, 0)::float8 as delivery, coalesce(d.pedidos, 0)::float8 as pedidos,
            case when e.informa_taxa then e.taxa_entrega::float8 end as taxa_entrega
     from d join ${S}.vw_lojas l using (loja_id)
     left join t using (loja_id)
     left join e using (loja_id)
     where d.delivery > 0
     order by d.delivery desc`,
    [mes, lojaId ?? null],
  );
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
  cidade_filial1: string | null;
  vigente_de: string;
  vigente_ate: string | null;
  observacao: string | null;
  ativos: number;
};

export async function ligacoes(): Promise<Ligacao[]> {
  return query<Ligacao>(`
    select l.loja_id, l.numero as loja_numero, l.nome as loja_nome, l.rede,
           cl.codcoligada, c.nome as coligada_nome, coalesce(cl.cnpj_loja, c.cnpj) as cnpj,
           coalesce(nullif(concat_ws(' · ', initcap(e.endereco), e.cidade), ''), c.cidade_filial1) as cidade_filial1,
           to_char(cl.vigente_de, 'YYYY-MM-DD') as vigente_de, to_char(cl.vigente_ate, 'YYYY-MM-DD') as vigente_ate,
           cl.observacao, coalesce(a.ativos, 0)::int as ativos
    from ${S}.coligada_loja cl
    join ${S}.vw_lojas l on l.loja_id = cl.loja_id
    left join ${S}.vw_coligadas c on c.codcoligada = cl.codcoligada
    left join ${S}.vw_ativos_coligada a on a.codcoligada = cl.codcoligada
    left join ${S}.estabelecimentos e on e.cnpj = cl.cnpj_loja
    order by l.numero nulls last, cl.codcoligada`);
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
    select tipo, loja_id, loja_numero, loja_nome, codcoligada, coligada_nome,
           fat_60d::float8, to_char(ult_venda, 'YYYY-MM-DD') as ult_venda, funcionarios_ativos::int
    from ${S}.vw_pendencias_ligacao
    order by tipo desc, fat_60d desc nulls last, funcionarios_ativos desc nulls last`);
}

export type Classificacao = { codcoligada: number; nome: string | null; tipo: string; observacao: string | null };

export async function classificacoes(): Promise<Classificacao[]> {
  return query<Classificacao>(`
    select cc.codcoligada, c.nome, cc.tipo, cc.observacao
    from ${S}.coligada_classificacao cc
    left join ${S}.vw_coligadas c using (codcoligada)
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
      where n.nspname in ('colibri_matuto', 'rh_matuto', '3s_matuto', '${S}') and c.relkind in ('r', 'v')
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
