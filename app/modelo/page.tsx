import { fmtInt } from "@/lib/format";
import { modeloDados, type Tabela } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CHAVES: { tabela: string; chave: string; uso: string }[] = [
  { tabela: "colibri_matuto.lojas", chave: "id (loja_id)", uso: "Identificador da loja no Colibri. Usar sempre este campo; loja_numero se repete em cadastros antigos (\"Ant\")." },
  { tabela: "colibri_matuto.<relatórios>", chave: "loja_id + data", uso: "Tabelas de relatório (faturamento, vendas, turnos…) guardam a linha original em JSON (coluna linha) com loja_id e data de referência." },
  { tabela: "rh_matuto.coligadas_rm", chave: "codcoligada", uso: "Empresa/CNPJ no TOTVS RM. Toda a folha é por coligada (filial sempre 1)." },
  { tabela: "rh_matuto.funcionarios", chave: "codcoligada + chapa", uso: "Matrícula do funcionário. A chapa só é única dentro da coligada." },
  { tabela: "rh_matuto.folha_resumo / folha_eventos", chave: "codcoligada + chapa + anocomp + mescomp + nroperiodo", uso: "Folha por competência e período de pagamento." },
  { tabela: "colibri_matuto.coligada_loja", chave: "codcoligada + vigente_de", uso: "Ponte Colibri × RM: várias coligadas podem apontar para uma loja; cada coligada aponta para uma única loja por período." },
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
          Fluxo: venda (Colibri, por <code>loja_id</code>) → <code>coligada_loja</code> (vigência) → folha (RM, por{" "}
          <code>codcoligada</code> e competência).
        </p>
      </section>

      <Grupo titulo="Colibri (colibri_matuto)" itens={colibri} />
      <Grupo titulo="TOTVS RM (rh_matuto)" itens={rm} />
    </>
  );
}
