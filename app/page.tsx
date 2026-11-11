import BarChart from "@/components/BarChart";
import MonthSelect from "@/components/MonthSelect";
import { div, fmtBRL, fmtBRL2, fmtBRLCurto, fmtData, fmtInt, fmtMes, fmtPct } from "@/lib/format";
import { atualizacao, cobertura, diarioDoMes, lojasDoMes, meses, serieRede, type Cobertura, type LojaMes } from "@/lib/queries";

export const dynamic = "force-dynamic";

const RE_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** checarRecencia: so faz sentido no mes mais recente com vendas. */
function status(l: LojaMes, ultimaData: string | null, checarRecencia: boolean) {
  const temVenda = (l.faturamento ?? 0) > 0;
  const temFolha = (l.custo_folha ?? 0) > 0;
  if (!temVenda && temFolha) return <span className="badge crit">Folha sem venda</span>;
  if (temVenda && !l.coligadas) return <span className="badge warn">Sem coligada</span>;
  if (checarRecencia && l.ultima_venda && ultimaData && diasEntre(l.ultima_venda, ultimaData) > 3)
    return <span className="badge warn">Sem venda desde {fmtData(l.ultima_venda)}</span>;
  return <span className="badge ok">OK</span>;
}

/** Folha x faturamento so e comparavel com o mes fechado e todos os dias de venda sincronizados. */
const comparavel = (c?: Cobertura) => !!c && c.completo && c.mes_fechado;

function rotuloMes(m: string, c?: Cobertura): string {
  if (!c) return `${fmtMes(m)} (sem vendas)`;
  if (!c.mes_fechado) return `${fmtMes(m)} (em andamento)`;
  if (!c.completo) return `${fmtMes(m)} (${c.dias_sincronizados}/${c.dias_esperados} dias)`;
  return fmtMes(m);
}

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams;
  const [lista, serie, upd, cob] = await Promise.all([meses(), serieRede(), atualizacao(), cobertura()]);
  if (lista.length === 0) return <p>Nenhum dado encontrado.</p>;

  const cobMes = Object.fromEntries(cob.map((c) => [c.mes, c]));
  const padrao = lista.find((m) => comparavel(cobMes[m])) ?? lista.find((m) => cobMes[m]) ?? lista[0];
  const mes = sp.mes && RE_MES.test(sp.mes) && lista.includes(sp.mes) ? sp.mes : padrao;
  const c = cobMes[mes];
  const ok = comparavel(c);

  const [lojas, diario] = await Promise.all([lojasDoMes(mes), diarioDoMes(mes)]);
  const rotulos = Object.fromEntries(lista.map((m) => [m, rotuloMes(m, cobMes[m])]));

  const comVenda = lojas.filter((l) => (l.faturamento ?? 0) > 0);
  const fat = comVenda.reduce((s, l) => s + (l.faturamento ?? 0), 0);
  const pessoas = comVenda.reduce((s, l) => s + (l.pessoas ?? 0), 0);
  const ligadas = comVenda.filter((l) => l.custo_folha !== null);
  const fatLig = ligadas.reduce((s, l) => s + (l.faturamento ?? 0), 0);
  const folha = lojas.reduce((s, l) => s + (l.custo_folha ?? 0), 0);
  const hc = lojas.reduce((s, l) => s + (l.headcount_pago ?? 0), 0);
  const folhaLig = ligadas.reduce((s, l) => s + (l.custo_folha ?? 0), 0);
  const hcLig = ligadas.reduce((s, l) => s + (l.headcount_pago ?? 0), 0);
  const semLigacao = comVenda.length - ligadas.length;
  const pctLoja = (l: LojaMes) => (ok ? div(l.custo_folha, l.faturamento) : null);
  const maxPct = Math.max(0.0001, ...lojas.map((l) => pctLoja(l) ?? 0));

  return (
    <>
      <h1>Visão geral da rede</h1>
      <p className="sub">
        Faturamento do PDV Colibri cruzado com a folha do TOTVS RM por loja. Vendas sincronizadas até{" "}
        {fmtData(upd.colibri_ultima_data)} (sync {upd.colibri_sync ?? "–"}) · folha até{" "}
        {upd.rm_ultima_competencia ? fmtMes(upd.rm_ultima_competencia) : "–"} (sync {upd.rm_sync ?? "–"}).
      </p>

      <div className="toolbar">
        <MonthSelect meses={lista} atual={mes} rotulos={rotulos} />
        <a href={`/vendas?mes=${mes}`}>Ver vendas do mês →</a>
      </div>

      {!ok && (
        <div className="note crit">
          <b>Mês sem comparação folha × faturamento.</b>{" "}
          {!c
            ? "Não há vendas do Colibri sincronizadas neste mês."
            : !c.mes_fechado
              ? `Mês em andamento (${c.dias_sincronizados} dias de venda); a folha ainda não fechou.`
              : `O Colibri tem só ${c.dias_sincronizados} de ${c.dias_esperados} dias de venda deste mês (carga histórica em andamento).`}{" "}
          Os indicadores de folha/faturamento ficam ocultos até o mês estar completo.
        </div>
      )}
      <div className="note">
        <b>Folha parcial:</b> custo = salário pago + FGTS estimado (8%). Não inclui INSS patronal, RAT/FAP, terceiros,
        benefícios e provisões (encargos do RM ainda vazios). Use o % folha/faturamento para comparar lojas entre si, não
        como número oficial.
      </div>

      <section className="grid kpis">
        <div className="card kpi">
          <div className="label">Faturamento</div>
          <div className="value">{fmtBRLCurto(fat)}</div>
          <div className="hint">
            {comVenda.length} lojas com venda{c && !c.completo ? ` · ${c.dias_sincronizados}/${c.dias_esperados} dias` : ""}
          </div>
        </div>
        <div className="card kpi">
          <div className="label">Clientes</div>
          <div className="value">{fmtInt(pessoas)}</div>
          <div className="hint">ticket médio {fmtBRL2(div(fat, pessoas))}</div>
        </div>
        <div className="card kpi">
          <div className="label">Folha parcial (lojas ligadas)</div>
          <div className="value">{fmtBRLCurto(folha)}</div>
          <div className="hint">{fmtInt(hc)} funcionários pagos</div>
        </div>
        <div className="card kpi">
          <div className="label">Folha / faturamento</div>
          <div className="value">{ok ? fmtPct(div(folhaLig, fatLig)) : "–"}</div>
          <div className="hint">{ok ? `sobre ${fmtBRLCurto(fatLig)} das lojas ligadas` : "mês incompleto"}</div>
        </div>
        <div className="card kpi">
          <div className="label">Faturamento por funcionário</div>
          <div className="value">{ok ? fmtBRLCurto(div(fatLig, hcLig)) : "–"}</div>
          <div className="hint">{ok ? "lojas ligadas" : "mês incompleto"}</div>
        </div>
        <div className="card kpi">
          <div className="label">Lojas com venda sem coligada</div>
          <div className="value">{semLigacao}</div>
          <div className="hint">
            <a href="/ligacao">ver pendências</a>
          </div>
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <h2>Faturamento mensal da rede</h2>
          <BarChart
            titulo="Faturamento mensal da rede"
            dados={serie.map((s) => {
              const cm = cobMes[s.mes];
              return {
                rotulo: fmtMes(s.mes),
                valor: s.faturamento,
                destaque: comparavel(cm),
                detalhe: [
                  `${fmtInt(s.pessoas)} clientes`,
                  cm ? `${cm.dias_sincronizados}/${cm.dias_esperados} dias sincronizados` : "",
                  comparavel(cm) ? `folha/fat. ${fmtPct(div(s.custo_folha, s.fat_com_folha))}` : "mês incompleto",
                ].filter(Boolean),
              };
            })}
            formato="brl"
          />
          <p className="muted small">Barras claras = mês em andamento ou com dias faltando no Colibri.</p>
        </div>
        <div className="card">
          <h2>Faturamento diário · {fmtMes(mes)}</h2>
          {diario.length ? (
            <BarChart
              titulo={`Faturamento diário da rede em ${fmtMes(mes)}`}
              dados={diario.map((d) => ({
                rotulo: d.data.slice(8, 10),
                valor: d.faturamento,
                detalhe: [fmtData(d.data), `${fmtInt(d.pessoas)} clientes`],
              }))}
              formato="brl"
              rotuloCada={diario.length > 16 ? 3 : 1}
            />
          ) : (
            <p className="muted">Sem vendas sincronizadas neste mês.</p>
          )}
        </div>
      </section>

      <section className="card">
        <h2>Lojas · {fmtMes(mes)}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loja</th>
                <th>Rede</th>
                <th className="num">Faturamento</th>
                <th className="num">Clientes</th>
                <th className="num">Ticket</th>
                <th className="num">Dias c/ venda</th>
                <th className="num">Func. pagos</th>
                <th className="num">Folha parcial</th>
                <th className="num">Folha / fat.</th>
                <th className="num">Fat. / func.</th>
                <th>Coligadas RM</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lojas.map((l) => {
                const pct = pctLoja(l);
                return (
                  <tr key={l.loja_id}>
                    <td style={{ whiteSpace: "nowrap" }}>{l.loja_nome}</td>
                    <td className="muted">{l.rede ?? "–"}</td>
                    <td className="num">{fmtBRL(l.faturamento)}</td>
                    <td className="num">{fmtInt(l.pessoas)}</td>
                    <td className="num">{fmtBRL2(div(l.faturamento, l.pessoas))}</td>
                    <td className="num">{fmtInt(l.dias_com_venda)}</td>
                    <td className="num">{fmtInt(l.headcount_pago)}</td>
                    <td className="num">{fmtBRL(l.custo_folha)}</td>
                    <td className="num">
                      <div className="bar-cell">
                        <span>{fmtPct(pct)}</span>
                        {pct !== null && (
                          <span className="bar-track" aria-hidden>
                            <span className="bar-fill" style={{ display: "block", width: `${(pct / maxPct) * 100}%` }} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="num">{ok ? fmtBRL(div(l.faturamento, l.headcount_pago)) : "–"}</td>
                    <td>{l.coligadas?.join(", ") ?? "–"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{status(l, upd.colibri_ultima_data, mes === upd.colibri_ultima_data?.slice(0, 7))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          Folha atribuída à loja pelas ligações vigentes em <code>dashboard.coligada_loja</code> (várias coligadas podem
          somar na mesma loja). Funcionários pagos = matrículas com salário pago na competência.
        </p>
      </section>
    </>
  );
}
