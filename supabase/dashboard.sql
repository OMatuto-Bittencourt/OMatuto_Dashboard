-- Schema `dashboard` do projeto Supabase omatuto-dados (aplicado em 11/11/2026).
-- Ligacao Colibri x RM e views tipadas sobre colibri_matuto / rh_matuto (dados brutos em JSON carregados pelo n8n).
-- Idempotente nas views; as tabelas usam "if not exists".

create extension if not exists btree_gist with schema extensions;
create schema if not exists dashboard;
comment on schema dashboard is 'Objetos do dashboard (ligacao Colibri x RM e views de analise). Nao e alterado pelos syncs do n8n.';

-- ---------------------------------------------------------------------------
-- Tabelas mantidas manualmente
-- ---------------------------------------------------------------------------

-- Ponte Colibri (loja) x RM (coligada/CNPJ). Sem FK para colibri_matuto.lojas para nao travar o sync de lojas.
create table if not exists dashboard.coligada_loja (
  codcoligada int not null,
  loja_id     text not null,
  vigente_de  date not null,
  vigente_ate date,
  observacao  text,
  criado_em   timestamptz not null default now(),
  primary key (codcoligada, vigente_de),
  constraint coligada_loja_vigencia_ck check (vigente_ate is null or vigente_ate >= vigente_de),
  constraint coligada_loja_sem_sobreposicao exclude using gist (codcoligada with =, daterange(vigente_de, vigente_ate, '[]') with &&)
);
create index if not exists coligada_loja_loja_id_idx on dashboard.coligada_loja (loja_id);
comment on table dashboard.coligada_loja is
 'Fonte da verdade da ligacao RM (codcoligada) x Colibri (lojas.id). N coligadas -> 1 loja; 1 coligada -> 1 loja por periodo. Nunca ligar por numero de loja.';

create table if not exists dashboard.coligada_classificacao (
  codcoligada int primary key,
  tipo text not null check (tipo in ('CORPORATIVO','SEM_OPERACAO')),
  observacao text,
  atualizado_em timestamptz not null default now()
);
comment on table dashboard.coligada_classificacao is 'Coligadas que nao sao de loja (backoffice/holding ou CNPJ sem operacao). Excluidas das pendencias.';

alter table dashboard.coligada_loja enable row level security;
alter table dashboard.coligada_classificacao enable row level security;

-- Carga inicial: ligacoes validadas por razao social + cidade da filial 1 (pendentes: lojas 05, 13, 14, 15, 22).
insert into dashboard.coligada_loja (codcoligada, loja_id, vigente_de, observacao) values
 (12,'1492704268636','2024-10-01','06 Exp Horto - Ferreira'),
 (11,'1753363437004','2024-10-01','07 Exp CPS Shop - Dona Zelinda'),
 (13,'1752021182736','2021-10-01','08 Exp D Pedro - Hermes'),
 (14,'1492707319293','2023-09-01','09 Exp Iguatemi - Dona Matilde'),
 (15,'1492707351665','2018-12-01','10 Exp Piracicaba - Andrade e Vedana'),
 (16,'1492707386251','2022-10-01','11 Exp Unimart - Dona Itelva'),
 (17,'1492707416392','2020-09-01','12 Exp Jundiai - Dulce'),
 (22,'1573658454708','2020-02-01','16 Chusc DPedro - Madu'),
 (30,'1660138314661','2024-09-01','17 Exp Guarulhos - Dona Jandira'),
 (31,'1666657703283','2023-04-01','18 Exp Tambore - Verissimo'),
 (33,'1715099280297','2024-10-01','19 Exp Indaiatuba - Dona Neide'),
 (36,'1744913755446','2025-04-01','23 Exp M Sales - Dona Mara'),
 (23,'1677507001385','2024-10-01','41 Chusc Ibitinga - Da Silva (CNPJ atual)'),
 (20,'1677507001385','2020-01-01','41 Chusc Ibitinga - Silva & Silva (CNPJ antigo da loja 01, sem venda)'),
 (24,'1677506947351','2024-10-01','43 Chusc Marechal - Ironita (CNPJ atual)'),
 (7, '1677506947351','2024-10-01','43 Chusc Marechal - Dona Ironita (CNPJ antigo da loja 03, sem venda)')
on conflict do nothing;

insert into dashboard.coligada_classificacao (codcoligada, tipo, observacao) values
 (1,'CORPORATIVO','JJost - servicos administrativos'),
 (2,'CORPORATIVO','MTO Franquias - franqueadora/administracao'),
 (26,'CORPORATIVO','Dila Consultoria'),
 (27,'CORPORATIVO','Eve Consultoria'),
 (29,'CORPORATIVO','95th Publicidade - marketing'),
 (38,'CORPORATIVO','JJ Consultoria Administrativa'),
 (41,'CORPORATIVO','1997 Servicos Integrados - servicos compartilhados'),
 (34,'SEM_OPERACAO','Debora Com. Alimentos - confirmar com DP'),
 (40,'SEM_OPERACAO','Avelino Com. Alimentos - confirmar com DP')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Views (security_invoker: respeitam as permissoes de quem consulta)
-- ---------------------------------------------------------------------------

create or replace view dashboard.vw_lojas with (security_invoker = true) as
select l.id as loja_id, (l.dados->>'numero')::int as numero, l.dados->>'nome' as nome, l.dados->>'nomeRedePai' as rede,
       l.dados->>'cidade' as cidade, l.dados->>'uf' as uf, l.dados->>'razaoSocial' as razao_social, l.dados->>'status' as status
from colibri_matuto.lojas l;

-- Relatorios do Colibri trazem a loja como texto: "N - nome" (diario), "N-nome" (hora/modo/meio) ou "nome" (entregas/turnos).
create or replace view dashboard.vw_loja_chaves with (security_invoker = true) as
select loja_id, numero || ' - ' || nome as chave from dashboard.vw_lojas
union select loja_id, numero || '-' || nome from dashboard.vw_lojas
union select loja_id, nome from dashboard.vw_lojas;

create or replace view dashboard.vw_fat_diario_loja with (security_invoker = true) as
select r.inicio as data, k.loja_id, r.dados->>'numeroENomeLoja' as loja_relatorio,
       (r.dados->>'faturamento')::numeric as faturamento, (r.dados->>'totalReal')::numeric as total_real,
       (r.dados->>'servico')::numeric as servico, (r.dados->>'pessoas')::numeric as pessoas
from colibri_matuto.relatorio_linhas r
left join dashboard.vw_loja_chaves k on k.chave = r.dados->>'numeroENomeLoja'
where r.relatorio = 'faturamento_diario_loja';

create or replace view dashboard.vw_fat_mensal_loja with (security_invoker = true) as
select loja_id, date_trunc('month', data)::date as competencia,
       sum(faturamento) as faturamento, sum(total_real) as total_real, sum(servico) as servico, sum(pessoas) as pessoas,
       count(*) filter (where faturamento > 0) as dias_com_venda, max(data) filter (where faturamento > 0) as ultima_venda
from dashboard.vw_fat_diario_loja where loja_id is not null group by 1, 2;

-- Dias de venda sincronizados por mes (folha x faturamento so e comparavel com o mes completo e fechado)
create or replace view dashboard.vw_cobertura_colibri with (security_invoker = true) as
with m as (
  select date_trunc('month', inicio)::date as competencia, count(distinct inicio) as dias_sincronizados
  from colibri_matuto.periodos
  where relatorio = 'faturamento_diario_loja' and ultimo_sucesso is not null
  group by 1
)
select competencia, dias_sincronizados,
       (least((competencia + interval '1 month - 1 day')::date, current_date) - competencia + 1) as dias_esperados,
       dias_sincronizados >= (least((competencia + interval '1 month - 1 day')::date, current_date) - competencia + 1) as completo,
       (competencia + interval '1 month - 1 day')::date < current_date as mes_fechado
from m;

create or replace view dashboard.vw_coligadas with (security_invoker = true) as
select (f.dados->>'CODCOLIGADA')::int as codcoligada, max(f.dados->>'NOMECOLIGADA') as nome,
       max(regexp_replace(f.dados->>'CNPJCOLIGADA', '\D', '', 'g')) as cnpj,
       max(f.dados->>'CIDADE') filter (where (f.dados->>'CODFILIAL')::int = 1) as cidade_filial1,
       max(f.dados->>'ESTADO') filter (where (f.dados->>'CODFILIAL')::int = 1) as uf_filial1,
       count(*) as filiais
from rh_matuto.filiais f group by 1;

create or replace view dashboard.vw_ativos_coligada with (security_invoker = true) as
select (dados->>'CODCOLIGADA')::int as codcoligada, count(*) as ativos
from rh_matuto.funcionarios where coalesce(dados->>'CODSITUACAO', '') <> 'D' group by 1;

-- Custo parcial: salario pago + FGTS 8% estimado (encargos patronais ainda nao carregados)
create or replace view dashboard.vw_folha_mensal_coligada with (security_invoker = true) as
select (dados->>'CODCOLIGADA')::int as codcoligada, make_date(ano, mes, 1) as competencia,
       count(distinct dados->>'CHAPA') filter (where (dados->>'SALARIOPAGO')::numeric > 0) as headcount_pago,
       sum((dados->>'SALARIOPAGO')::numeric) as salario_pago,
       round(sum(coalesce((dados->>'BASEFGTS')::numeric, 0) + coalesce((dados->>'BASEFGTS13')::numeric, 0)) * 0.08, 2) as fgts_estimado,
       sum((dados->>'SALARIOPAGO')::numeric)
         + round(sum(coalesce((dados->>'BASEFGTS')::numeric, 0) + coalesce((dados->>'BASEFGTS13')::numeric, 0)) * 0.08, 2) as custo_folha
from rh_matuto.folha_resumo group by 1, 2;

create or replace view dashboard.vw_loja_fat_folha_mensal with (security_invoker = true) as
with folha_loja as (
  select cl.loja_id, fm.competencia, sum(fm.headcount_pago) as headcount_pago, sum(fm.salario_pago) as salario_pago,
         sum(fm.fgts_estimado) as fgts_estimado, sum(fm.custo_folha) as custo_folha,
         array_agg(distinct fm.codcoligada order by fm.codcoligada) as coligadas
  from dashboard.vw_folha_mensal_coligada fm
  join dashboard.coligada_loja cl on cl.codcoligada = fm.codcoligada and fm.competencia >= cl.vigente_de
   and (cl.vigente_ate is null or fm.competencia <= cl.vigente_ate)
  group by 1, 2
)
select coalesce(fa.loja_id, fo.loja_id) as loja_id, l.numero as loja_numero, l.nome as loja_nome, l.rede, l.cidade,
       coalesce(fa.competencia, fo.competencia) as competencia,
       fa.faturamento, fa.pessoas, fa.dias_com_venda, fa.ultima_venda,
       fo.headcount_pago, fo.salario_pago, fo.fgts_estimado, fo.custo_folha, fo.coligadas
from dashboard.vw_fat_mensal_loja fa
full join folha_loja fo on fo.loja_id = fa.loja_id and fo.competencia = fa.competencia
join dashboard.vw_lojas l on l.loja_id = coalesce(fa.loja_id, fo.loja_id)
where coalesce(fa.faturamento, 0) <> 0 or fo.loja_id is not null;

create or replace view dashboard.vw_pendencias_ligacao with (security_invoker = true) as
with vig as (
  select * from dashboard.coligada_loja where vigente_de <= current_date and (vigente_ate is null or vigente_ate >= current_date)
),
venda as (
  select loja_id, sum(faturamento) as fat_60d, max(data) as ult_venda from dashboard.vw_fat_diario_loja
  where data >= current_date - 60 and faturamento > 0 and loja_id is not null group by 1
)
select 'LOJA_SEM_COLIGADA'::text as tipo, l.loja_id, l.numero as loja_numero, l.nome as loja_nome,
       null::int as codcoligada, null::text as coligada_nome, v.fat_60d, v.ult_venda, null::bigint as funcionarios_ativos
from venda v join dashboard.vw_lojas l on l.loja_id = v.loja_id
where not exists (select 1 from vig where vig.loja_id = v.loja_id)
union all
select 'COLIGADA_SEM_LOJA', null, null, null, a.codcoligada, c.nome, null, null, a.ativos
from dashboard.vw_ativos_coligada a left join dashboard.vw_coligadas c using (codcoligada)
where not exists (select 1 from vig where vig.codcoligada = a.codcoligada)
  and not exists (select 1 from dashboard.coligada_classificacao cc where cc.codcoligada = a.codcoligada);

create or replace view dashboard.vw_modo_venda_diario with (security_invoker = true) as
select r.inicio as data, k.loja_id, r.dados->>'nomeModoVenda' as modo_venda,
       (r.dados->>'faturamento')::numeric as faturamento, (r.dados->>'pessoas')::numeric as pessoas
from colibri_matuto.relatorio_linhas r left join dashboard.vw_loja_chaves k on k.chave = r.dados->>'lojaNome'
where r.relatorio = 'faturamento_modo_venda';

create or replace view dashboard.vw_meio_pagamento_diario with (security_invoker = true) as
select r.inicio as data, k.loja_id, trim(r.dados->>'nomeRecebimento') as meio,
       case
         when upper(r.dados->>'nomeRecebimento') like '%IFOOD%' then 'iFood'
         when upper(r.dados->>'nomeRecebimento') like '%PIX%' then 'PIX'
         when upper(r.dados->>'nomeRecebimento') like '%DINHEIRO%' then 'Dinheiro'
         when upper(r.dados->>'nomeRecebimento') ~ '(CREDITO|CRÉDITO|AMERICAN|AMEX)' then 'Crédito'
         when upper(r.dados->>'nomeRecebimento') ~ '(DEBITO|DÉBITO)' then 'Débito'
         when upper(r.dados->>'nomeRecebimento') ~ '(VOUCHER|SODEXO|ALELO|TICKET|VR|VALE|VERO|BEN )' then 'Voucher/benefício'
         else 'Outros'
       end as categoria,
       (r.dados->>'valorTotal')::numeric as valor
from colibri_matuto.relatorio_linhas r left join dashboard.vw_loja_chaves k on k.chave = r.dados->>'lojaNome'
where r.relatorio = 'faturamento_meio_pagamento';

create or replace view dashboard.vw_fat_hora with (security_invoker = true) as
select r.inicio as data, k.loja_id, (r.dados->>'hora')::int as hora,
       (r.dados->>'totalRecebido')::numeric as faturamento, (r.dados->>'numeroDePessoas')::numeric as pessoas
from colibri_matuto.relatorio_linhas r left join dashboard.vw_loja_chaves k on k.chave = r.dados->>'nome'
where r.relatorio = 'faturamento_hora_loja';

create or replace view dashboard.vw_entregas_diario with (security_invoker = true) as
select r.inicio as data, k.loja_id, r.dados->>'entregador' as entregador,
       (r.dados->>'qtdEntregas')::numeric as entregas, (r.dados->>'totalPedido')::numeric as total_pedido,
       (r.dados->>'totalTxEntrega')::numeric as taxa_entrega
from colibri_matuto.relatorio_linhas r left join dashboard.vw_loja_chaves k on k.chave = r.dados->>'lojaNome'
where r.relatorio = 'entregas';
