import { fmtBRL, fmtCnpj, fmtData, fmtInt } from "@/lib/format";
import { classificacoes, ligacoes, pendencias } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [lig, pend, cls] = await Promise.all([ligacoes(), pendencias(), classificacoes()]);
  const lojasSem = pend.filter((p) => p.tipo === "LOJA_SEM_COLIGADA");
  const colSem = pend.filter((p) => p.tipo === "COLIGADA_SEM_LOJA");
  const lojasLigadas = new Set(lig.map((l) => l.loja_id)).size;

  return (
    <>
      <h1>Ligação Colibri × RM</h1>
      <p className="sub">
        Chave de ligação: <code>colibri_matuto.lojas.id</code> (loja_id) ↔ <code>rh_matuto.coligadas_rm.codcoligada</code>,
        gravada em <code>colibri_matuto.coligada_loja</code> com vigência. Nunca ligar por <code>loja_numero</code> (há
        números duplicados em cadastros antigos).
      </p>

      <section className="grid kpis">
        <div className="card kpi">
          <div className="label">Lojas ligadas</div>
          <div className="value">{lojasLigadas}</div>
          <div className="hint">{lig.length} ligações coligada → loja</div>
        </div>
        <div className="card kpi">
          <div className="label">Lojas com venda sem coligada</div>
          <div className="value">{lojasSem.length}</div>
          <div className="hint">{fmtBRL(lojasSem.reduce((s, p) => s + (p.fat_60d ?? 0), 0))} em 60 dias</div>
        </div>
        <div className="card kpi">
          <div className="label">Coligadas com ativos sem loja</div>
          <div className="value">{colSem.length}</div>
          <div className="hint">{fmtInt(colSem.reduce((s, p) => s + (p.funcionarios_ativos ?? 0), 0))} funcionários ativos</div>
        </div>
        <div className="card kpi">
          <div className="label">Coligadas fora de loja</div>
          <div className="value">{cls.length}</div>
          <div className="hint">corporativo / sem operação</div>
        </div>
      </section>

      {pend.length > 0 && (
        <section className="card" style={{ marginBottom: 16 }}>
          <h2>Pendências</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Loja (Colibri)</th>
                  <th>Coligada (RM)</th>
                  <th className="num">Faturamento 60 dias</th>
                  <th>Última venda</th>
                  <th className="num">Func. ativos</th>
                </tr>
              </thead>
              <tbody>
                {pend.map((p) => (
                  <tr key={`${p.tipo}-${p.loja_id ?? p.codcoligada}`}>
                    <td>
                      <span className="badge warn">{p.tipo === "LOJA_SEM_COLIGADA" ? "Loja sem coligada" : "Coligada sem loja"}</span>
                    </td>
                    <td>
                      {p.loja_nome ?? "–"}
                      {p.loja_id && <div className="muted small">loja_id {p.loja_id}</div>}
                    </td>
                    <td>{p.codcoligada ? `${p.codcoligada} · ${p.coligada_nome ?? ""}` : "–"}</td>
                    <td className="num">{fmtBRL(p.fat_60d)}</td>
                    <td>{fmtData(p.ult_venda)}</td>
                    <td className="num">{fmtInt(p.funcionarios_ativos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card" style={{ marginBottom: 16 }}>
        <h2>Ligações vigentes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loja</th>
                <th>loja_id</th>
                <th className="num">Coligada</th>
                <th>Razão social (RM)</th>
                <th>CNPJ</th>
                <th>Vigência</th>
                <th className="num">Func. ativos</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {lig.map((l) => (
                <tr key={`${l.codcoligada}-${l.vigente_de}`}>
                  <td>{l.loja_nome}</td>
                  <td>
                    <code>{l.loja_id}</code>
                  </td>
                  <td className="num">{l.codcoligada}</td>
                  <td>{l.coligada_nome ?? "–"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtCnpj(l.cnpj)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {fmtData(l.vigente_de)} → {l.vigente_ate ? fmtData(l.vigente_ate) : "atual"}
                  </td>
                  <td className="num">{fmtInt(l.ativos)}</td>
                  <td className="muted small">{l.observacao ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Coligadas classificadas fora de loja</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="num">Coligada</th>
                <th>Razão social</th>
                <th>Tipo</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {cls.map((c) => (
                <tr key={c.codcoligada}>
                  <td className="num">{c.codcoligada}</td>
                  <td>{c.nome ?? "–"}</td>
                  <td>
                    <span className="badge">{c.tipo}</span>
                  </td>
                  <td className="muted small">{c.observacao ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Tabela <code>rh_matuto.coligada_classificacao</code>: coligadas aqui não aparecem como pendência.
        </p>
      </section>
    </>
  );
}
