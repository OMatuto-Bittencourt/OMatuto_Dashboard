import TabelaChaves, { type Chave } from "@/components/modelo/TabelaChaves";
import TabelaObjetos from "@/components/modelo/TabelaObjetos";
import Codigo from "@/components/ui/Codigo";
import PageHeader from "@/components/ui/PageHeader";
import { modeloDados, SCHEMA_PAINEL } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CHAVES: Chave[] = [
  { tabela: "colibri_matuto.lojas", chave: "id (loja_id)", uso: "Identificador da loja no Colibri. O número da loja se repete em cadastros antigos (\"Ant\"): nunca ligar só pelo número." },
  { tabela: "colibri_matuto.relatorio_linhas", chave: "relatorio + inicio + fim + linha", uso: "Todos os relatórios do Colibri em JSON (coluna dados). A loja vem como texto (\"N - nome\", \"N-nome\" ou \"nome\") e é traduzida para loja_id por dashboard.vw_loja_chaves; a data é o início do período (inicio)." },
  { tabela: "rh_matuto.filiais", chave: "CODCOLIGADA + CODFILIAL (no JSON)", uso: "Empresas/CNPJ do RM. A folha é toda na filial 1; a ligação com a loja é por CODCOLIGADA." },
  { tabela: "rh_matuto.funcionarios", chave: "CODCOLIGADA + CHAPA (no JSON)", uso: "Matrícula. A chapa só é única dentro da coligada. A PK física (linha) é posicional, não usar para relacionar." },
  { tabela: "rh_matuto.folha_resumo / folha", chave: "ano + mes + CODCOLIGADA + CHAPA + NROPERIODO", uso: "Folha por competência e período de pagamento (ano/mes em colunas, demais campos no JSON)." },
  { tabela: "dashboard.coligada_loja", chave: "codcoligada + vigente_de", uso: "Ponte Colibri × RM: várias coligadas podem apontar para uma loja; cada coligada aponta para uma única loja por período." },
  { tabela: "3s_matuto.lojas", chave: "store_id", uso: "Identificador da loja no 3S (BOH e-Deploy). Os relatórios do 3S trazem o store_code (ex.: \"0007\"), traduzido para store_id na carga. O CNPJ da loja serve só para conferir a correspondência com a loja do Colibri e a coligada do RM; nunca ligar pelo código nem pelo número." },
  { tabela: "3s_matuto.vendas_diarias / vendas_hora / dre_mensal / delivery_diario", chave: "periodo_inicio + periodo_fim + loja_codigo (+ data / hora no JSON)", uso: "Respostas das APIs do 3S em JSON (coluna linha), substituídas por período a cada sincronização do n8n; loja_id = store_id da loja. Histórico e erros em 3s_matuto.sync_log." },
  { tabela: `${SCHEMA_PAINEL}.loja_3s`, chave: "store_id", uso: "Ponte 3S × painel: liga a loja do 3S ao loja_id do Colibri a partir da data de migração (vigente_de), para a loja ter histórico contínuo. Loja que só existe no 3S recebe loja_id próprio (\"3s-<store_id>\"). Correspondência encontrada pelo CNPJ e gravada com vigência." },
];

export default async function Page() {
  const tabelas = await modeloDados();
  const doSchema = (schema: string) => tabelas.filter((t) => t.schema === schema);

  return (
    <div className="grid gap-5">
      <PageHeader
        titulo="Modelo de dados"
        descricao="Tabelas e views no Supabase, com as chaves primárias e estrangeiras lidas do catálogo do Postgres em tempo real."
      />

      <TabelaChaves
        linhas={CHAVES}
        nota={
          <div className="grid gap-1.5 not-italic">
            <p className="m-0">Chave lógica = combinação que identifica o registro no negócio; a PK física de cada tabela está nas seções abaixo.</p>
            <p className="m-0">
              <b className="font-semibold">Fluxo Colibri:</b> venda (texto da loja → <Codigo>vw_loja_chaves</Codigo> → <Codigo>loja_id</Codigo>) →{" "}
              <Codigo>coligada_loja</Codigo> (vigência) → folha (RM, por <Codigo>codcoligada</Codigo> e competência).
            </p>
            <p className="m-0">
              <b className="font-semibold">Fluxo 3S:</b> venda (<Codigo>store_code</Codigo> → <Codigo>store_id</Codigo> → <Codigo>loja_3s</Codigo> →{" "}
              <Codigo>loja_id</Codigo>, a partir da data de migração) → mesma <Codigo>coligada_loja</Codigo> → folha. O CNPJ é usado para encontrar a
              correspondência; o <Codigo>loja_id</Codigo> é a chave de relacionamento.
            </p>
          </div>
        }
      />

      <TabelaObjetos titulo="Colibri (colibri_matuto)" sistema="colibri" objetos={doSchema("colibri_matuto")} />
      <TabelaObjetos titulo="TOTVS RM (rh_matuto)" sistema="rm" objetos={doSchema("rh_matuto")} />
      <TabelaObjetos titulo="3S Checkout (3s_matuto)" sistema="3s" objetos={doSchema("3s_matuto")} />
      <TabelaObjetos titulo={`Dashboard (${SCHEMA_PAINEL}) – ligação e views de análise`} sistema="painel" objetos={doSchema(SCHEMA_PAINEL)} />
    </div>
  );
}
