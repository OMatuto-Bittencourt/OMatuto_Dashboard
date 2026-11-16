import { fmtInt } from "@/lib/format";
import { modeloDados, SCHEMA_PAINEL, type Tabela } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CHAVES: { tabela: string; chave: string; uso: string }[] = [
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

function Grupo({ titulo, itens }: { titulo: string; itens: Tabela[] }) {
  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <h2>{titulo}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Objeto</th>
              <th>Tipo</th>
              <th className="num">Linhas (estim.)</th>
              <th className="num">Colunas</th>
              <th>Chave primária</th>
              <th>Chaves estrangeiras</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((t) => (
              <tr key={`${t.schema}.${t.tabela}`}>
                <td>
                  <code>{t.tabela}</code>
                </td>
                <td className="muted">{t.tipo}</td>
                <td className="num">{t.tipo === "view" ? "–" : fmtInt(t.linhas)}</td>
                <td className="num">{t.colunas}</td>
                <td>{t.pk ? <code>{t.pk}</code> : <span className="muted">{t.tipo === "view" ? "–" : "sem PK"}</span>}</td>
                <td className="small">{t.fks ? <code>{t.fks}</code> : <span className="muted">–</span>}</td>
                <td className="muted small">{t.comentario ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function Page() {
  const tabelas = await modeloDados();
  const colibri = tabelas.filter((t) => t.schema === "colibri_matuto");
  const rm = tabelas.filter((t) => t.schema === "rh_matuto");
  const s3 = tabelas.filter((t) => t.schema === "3s_matuto");
  const dash = tabelas.filter((t) => t.schema === SCHEMA_PAINEL);

  return (
    <>
      <h1>Modelo de dados</h1>
      <p className="sub">
        Tabelas e views no Supabase, com as chaves primárias e estrangeiras lidas do catálogo do Postgres em tempo real.
      </p>

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>Chaves de relacionamento</h2>
        <p className="muted small">Chave lógica = combinação que identifica o registro no negócio; a PK física de cada tabela está nas seções abaixo.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tabela</th>
                <th>Chave lógica</th>
                <th>Como usar</th>
              </tr>
            </thead>
            <tbody>
              {CHAVES.map((c) => (
                <tr key={c.tabela}>
                  <td>
                    <code>{c.tabela}</code>
                  </td>
                  <td>
                    <code>{c.chave}</code>
                  </td>
                  <td>{c.uso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Fluxo: venda (Colibri, texto da loja → <code>vw_loja_chaves</code> → <code>loja_id</code>) → <code>coligada_loja</code> (vigência) → folha (RM, por{" "}
          <code>codcoligada</code> e competência).
        </p>
        <p className="muted small">
          Fluxo 3S: venda (3S, <code>store_code</code> → <code>store_id</code> → <code>loja_3s</code> → <code>loja_id</code>, a partir da data de migração) → mesma{" "}
          <code>coligada_loja</code> → folha. O CNPJ é usado para encontrar a correspondência; o <code>loja_id</code> é a chave de relacionamento.
        </p>
      </section>

      <Grupo titulo="Colibri (colibri_matuto)" itens={colibri} />
      <Grupo titulo="TOTVS RM (rh_matuto)" itens={rm} />
      <Grupo titulo="3S Checkout (3s_matuto)" itens={s3} />
      <Grupo titulo={`Dashboard (${SCHEMA_PAINEL}) – ligação e views de análise`} itens={dash} />
    </>
  );
}
