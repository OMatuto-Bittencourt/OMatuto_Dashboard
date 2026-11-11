# OMatuto_Dashboard

Dashboard interno que cruza o **faturamento do PDV Colibri** com a **folha do TOTVS RM** por loja, a partir do Supabase
(schemas `colibri_matuto` e `rh_matuto`).

## Telas

| Rota | Conteúdo |
|---|---|
| `/` | Visão geral: KPIs do mês, faturamento mensal e diário da rede, tabela por loja (faturamento, ticket, folha parcial, folha/faturamento, status) |
| `/ligacao` | Ligação Colibri × RM: pendências, ligações vigentes (`coligada_loja`) e coligadas classificadas fora de loja |
| `/modelo` | Modelo de dados: tabelas, views, PKs e FKs lidas do catálogo do Postgres |

## Chave de relacionamento

```
colibri_matuto.lojas.id (loja_id)
        └── colibri_matuto.coligada_loja (codcoligada, vigente_de, vigente_ate)
                └── rh_matuto.coligadas_rm.codcoligada → folha_resumo / funcionarios
```

Nunca ligar por `loja_numero`: há números duplicados em cadastros antigos ("Ant").

As views usadas pelo app (`vw_fat_mensal_loja`, `vw_loja_fat_folha_mensal`, `vw_pendencias_ligacao`,
`rh_matuto.vw_folha_mensal_coligada`) estão no Supabase.

**Limitação atual:** o custo de folha é parcial (salário pago + FGTS estimado de 8%). Não inclui INSS patronal,
RAT/FAP, terceiros, benefícios e provisões, porque a tabela `rh_matuto.encargos` ainda não é carregada.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | Connection string do Supabase (Transaction pooler, porta 6543) |
| `DASHBOARD_USER` / `DASHBOARD_PASSWORD` | sim | Login do dashboard (HTTP Basic Auth). Sem elas o app responde 503 para tudo |
| `DATABASE_CA_CERT` | não | Certificado CA do Supabase (PEM) para validar o TLS do banco |
| `DATABASE_SSL=disable` | não | Só para desenvolvimento com Postgres local |

Todas as consultas rodam em transação `read only`. Mesmo assim, recomenda-se um usuário só de leitura
(rodar no SQL Editor do Supabase, trocando a senha):

```sql
create role dashboard_ro login password 'TROQUE_ESTA_SENHA';
grant usage on schema colibri_matuto, rh_matuto to dashboard_ro;
grant select on all tables in schema colibri_matuto, rh_matuto to dashboard_ro;
alter default privileges in schema colibri_matuto grant select on tables to dashboard_ro;
alter default privileges in schema rh_matuto grant select on tables to dashboard_ro;
alter role dashboard_ro bypassrls;  -- as tabelas têm RLS ligado sem políticas
```

No pooler, o usuário fica `dashboard_ro.<project-ref>`. Se o `bypassrls` for recusado, crie políticas
`for select to dashboard_ro using (true)` nas tabelas lidas, ou use temporariamente a connection string padrão.

## Deploy (Easypanel)

O app é implantado a cada merge na `main`. Build pelo `Dockerfile` (Next.js standalone, porta **3000**).
Configure as variáveis acima no serviço do Easypanel.

## Desenvolvimento

```bash
npm ci
cp .env.example .env.local   # preencher
npm run dev
```
