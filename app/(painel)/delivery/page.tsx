import BarChart from "@/components/BarChart";
import MonthSelect from "@/components/MonthSelect";
import { div, fmtBRL, fmtBRL2, fmtBRLCurto, fmtData, fmtInt, fmtMes, fmtPct } from "@/lib/format";
import { cobertura, deliveryDiario, deliveryPorLoja, lojasComVenda } from "@/lib/queries";

export const dynamic = "force-dynamic";

const RE_MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const RE_ID = /^(\d{1,20}|3s-\d{1,10})$/;
const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string; loja?: string }> }) {
  const sp = await searchParams;
  const [cob, lojas] = await Promise.all([cobertura(), lojasComVenda()]);
  const lista = cob.map((c) => c.mes).reverse();
  if (lista.length === 0) return <p>Nenhuma venda sincronizada.</p>;

  const mes = sp.mes && RE_MES.test(sp.mes) && lista.includes(sp.mes) ? sp.mes : lista[0];
  const loja = sp.loja && RE_ID.test(sp.loja) && lojas.some((l) => l.loja_id === sp.loja) ? sp.loja : undefined;
  const nomeLoja = loja ? lojas.find((l) => l.loja_id === loja)?.nome : "Todas as lojas";
  const rotulos = Object.fromEntries(
    cob.map((x) => [x.mes, `${fmtMes(x.mes)}${x.completo ? "" : ` (${x.dias_sincronizados}/${x.dias_esperados} dias)`}`]),
  );

  const [diario, porLoja] = await Promise.all([deliveryDiario(mes, loja), deliveryPorLoja(mes, loja)]);

  const delivery = diario.reduce((s, d) => s + d.delivery, 0);
  const pedidos = diario.reduce((s, d) => s + d.pedidos, 0);
  const total = diario.reduce((s, d) => s + d.total, 0);
  const diasDelivery = diario.filter((d) => d.delivery > 0).length;

  // média de delivery por dia da semana (só dias com delivery)
  const semana = DIAS_SEMANA.map((rotulo, dow) => {
    const dias = diario.filter((d) => d.delivery > 0 && new Date(`${d.data}T12:00:00Z`).getUTCDay() === dow);
    const soma = dias.reduce((s, d) => s + d.delivery, 0);
    const ped = dias.reduce((s, d) => s + d.pedidos, 0);
    return { rotulo, valor: div(soma, dias.length) ?? 0, dias: dias.length, pedidos: div(ped, dias.length) ?? 0 };
  });

  return (
    <>
      <h1>Delivery</h1>
      <p className="sub">
        {nomeLoja} · {fmtMes(mes)} · vendas no modo Entrega (Colibri) e no canal delivery (3S).
      </p>

      <div className="toolbar">
        <MonthSelect meses={lista} atual={mes} rotulos={rotulos} base="/delivery" lojas={lojas} lojaAtual={loja} />
      </div>

      <section className="grid kpis">
        <div className="card kpi">
          <div className="label">Faturamento delivery</div>
          <div className="value">{fmtBRLCurto(delivery)}</div>
          <div className="hint">média {fmtBRLCurto(div(delivery, diasDelivery))} por dia</div>
        </div>
        <div className="card kpi">
          <div className="label">Participação no faturamento</div>
          <div className="value">{fmtPct(div(delivery, total))}</div>
          <div className="hint">de {fmtBRLCurto(total)} no período</div>
        </div>
        <div className="card kpi">
          <div className="label">Pedidos delivery</div>
          <div className="value">{fmtInt(pedidos)}</div>
          <div className="hint">{fmtInt(div(pedidos, diasDelivery))} por dia</div>
        </div>
        <div className="card kpi">
          <div className="label">Ticket médio delivery</div>
          <div className="value">{fmtBRL2(div(delivery, pedidos))}</div>
          <div className="hint">faturamento delivery ÷ pedidos</div>
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <h2>Faturamento delivery diário</h2>
          {diasDelivery ? (
            <BarChart
              titulo="Faturamento delivery diário"
              dados={diario.map((d) => ({
                rotulo: d.data.slice(8, 10),
                valor: d.delivery,
                detalhe: [fmtData(d.data), `${fmtInt(d.pedidos)} pedidos`, `${fmtPct(div(d.delivery, d.total))} do faturamento do dia`],
              }))}
              formato="brl"
              rotuloCada={diario.length > 16 ? 3 : 1}
            />
          ) : (
            <p className="muted">Sem delivery no período.</p>
          )}
        </div>
        <div className="card">
          <h2>Delivery médio por dia da semana</h2>
          {diasDelivery ? (
            <BarChart
              titulo="Delivery médio por dia da semana"
              dados={semana.map((s) => ({
                rotulo: s.rotulo,
                valor: s.valor,
                detalhe: [`${fmtInt(s.pedidos)} pedidos/dia`, `${s.dias} dia(s) no período`],
              }))}
              formato="brl"
            />
          ) : (
            <p className="muted">Sem delivery no período.</p>
          )}
          <p className="muted small">Média dos dias com delivery no mês selecionado.</p>
        </div>
      </section>

      <section className="card">
        <h2>Delivery por loja</h2>
        {porLoja.length === 0 ? (
          <p className="muted">Sem delivery no período.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Loja</th>
                  <th>Sistema</th>
                  <th className="num">Faturamento da loja</th>
                  <th className="num">Delivery</th>
                  <th className="num">Participação</th>
                  <th className="num">Pedidos</th>
                  <th className="num">Ticket</th>
                  <th className="num">Taxa de entrega</th>
                </tr>
              </thead>
              <tbody>
                {porLoja.map((l) => (
                  <tr key={l.loja_id}>
                    <td style={{ whiteSpace: "nowrap" }}>{l.loja_nome}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{l.origem}</td>
                    <td className="num">{fmtBRL(l.total)}</td>
                    <td className="num">{fmtBRL(l.delivery)}</td>
                    <td className="num">{fmtPct(div(l.delivery, l.total))}</td>
                    <td className="num">{fmtInt(l.pedidos)}</td>
                    <td className="num">{fmtBRL2(div(l.delivery, l.pedidos))}</td>
                    <td className="num">{fmtBRL(l.taxa_entrega)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <b>Total das lojas com delivery</b>
                  </td>
                  <td></td>
                  <td className="num">
                    <b>{fmtBRL(porLoja.reduce((s, l) => s + l.total, 0))}</b>
                  </td>
                  <td className="num">
                    <b>{fmtBRL(porLoja.reduce((s, l) => s + l.delivery, 0))}</b>
                  </td>
                  <td className="num">
                    <b>{fmtPct(div(porLoja.reduce((s, l) => s + l.delivery, 0), porLoja.reduce((s, l) => s + l.total, 0)))}</b>
                  </td>
                  <td className="num">
                    <b>{fmtInt(porLoja.reduce((s, l) => s + l.pedidos, 0))}</b>
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small">
          A participação do total considera só as lojas com delivery no período; a do topo da página considera todas as lojas.
          Taxa de entrega: informada só pelo Colibri; no 3S aparece “–” (o relatório de delivery consolidado do BOH não retorna dados).
          Cancelamentos e meio de pagamento por parceiro ainda não estão disponíveis para as lojas do 3S.
        </p>
      </section>
    </>
  );
}
