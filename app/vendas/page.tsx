import BarChart from "@/components/BarChart";
import MonthSelect from "@/components/MonthSelect";
import { div, fmtBRL, fmtBRL2, fmtBRLCurto, fmtData, fmtInt, fmtMes, fmtPct } from "@/lib/format";
import {
  cobertura,
  diarioDoMes,
  entregasPorLoja,
  faturamentoPorHora,
  lojasComVenda,
  meioPagamento,
  modoVenda,
  type Fatia,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const RE_MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const RE_ID = /^\d{1,20}$/;

function Participacao({ titulo, itens, rotuloPessoas }: { titulo: string; itens: Fatia[]; rotuloPessoas?: string }) {
  const total = itens.reduce((s, i) => s + i.valor, 0);
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div className="card">
      <h2>{titulo}</h2>
      {itens.length === 0 ? (
        <p className="muted">Sem dados no período.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th className="num">Valor</th>
                <th className="num">Participação</th>
                {rotuloPessoas && <th className="num">{rotuloPessoas}</th>}
                {rotuloPessoas && <th className="num">Ticket</th>}
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.rotulo}>
                  <td style={{ whiteSpace: "nowrap" }}>{i.rotulo}</td>
                  <td className="num">{fmtBRL(i.valor)}</td>
                  <td className="num">
                    <div className="bar-cell">
                      <span>{fmtPct(div(i.valor, total))}</span>
                      <span className="bar-track" aria-hidden>
                        <span className="bar-fill" style={{ display: "block", width: `${(i.valor / max) * 100}%` }} />
                      </span>
                    </div>
                  </td>
                  {rotuloPessoas && <td className="num">{fmtInt(i.pessoas)}</td>}
                  {rotuloPessoas && <td className="num">{fmtBRL2(div(i.valor, i.pessoas))}</td>}
                </tr>
              ))}
              <tr>
                <td>
                  <b>Total</b>
                </td>
                <td className="num">
                  <b>{fmtBRL(total)}</b>
                </td>
                <td></td>
                {rotuloPessoas && <td className="num">{fmtInt(itens.reduce((s, i) => s + (i.pessoas ?? 0), 0))}</td>}
                {rotuloPessoas && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string; loja?: string }> }) {
  const sp = await searchParams;
  const [cob, lojas] = await Promise.all([cobertura(), lojasComVenda()]);
  const lista = cob.map((c) => c.mes).reverse();
  if (lista.length === 0) return <p>Nenhuma venda sincronizada do Colibri.</p>;

  const mes = sp.mes && RE_MES.test(sp.mes) && lista.includes(sp.mes) ? sp.mes : lista[0];
  const loja = sp.loja && RE_ID.test(sp.loja) && lojas.some((l) => l.loja_id === sp.loja) ? sp.loja : undefined;
  const c = cob.find((x) => x.mes === mes)!;
  const nomeLoja = loja ? lojas.find((l) => l.loja_id === loja)?.nome : "Todas as lojas";

  const [diario, modos, meios, horas, entregas] = await Promise.all([
    diarioDoMes(mes, loja),
    modoVenda(mes, loja),
    meioPagamento(mes, loja),
    faturamentoPorHora(mes, loja),
    entregasPorLoja(mes, loja),
  ]);

  const fat = diario.reduce((s, d) => s + d.faturamento, 0);
  const pessoas = diario.reduce((s, d) => s + d.pessoas, 0);
  const diasVenda = diario.filter((d) => d.faturamento > 0).length;
  const delivery = modos.find((m) => m.rotulo.toLowerCase() === "entrega")?.valor ?? 0;
  const rotulos = Object.fromEntries(
    cob.map((x) => [x.mes, `${fmtMes(x.mes)}${x.completo ? "" : ` (${x.dias_sincronizados}/${x.dias_esperados} dias)`}`]),
  );
  const horasVenda = horas.filter((h) => h.faturamento > 0);

  return (
    <>
      <h1>Vendas</h1>
      <p className="sub">
        {nomeLoja} · {fmtMes(mes)} · {c.dias_sincronizados} de {c.dias_esperados} dias sincronizados do Colibri.
      </p>

      <div className="toolbar">
        <MonthSelect meses={lista} atual={mes} rotulos={rotulos} base="/vendas" lojas={lojas} lojaAtual={loja} />
      </div>

      <section className="grid kpis">
        <div className="card kpi">
          <div className="label">Faturamento</div>
          <div className="value">{fmtBRLCurto(fat)}</div>
          <div className="hint">média {fmtBRLCurto(div(fat, diasVenda))} por dia com venda</div>
        </div>
        <div className="card kpi">
          <div className="label">Clientes</div>
          <div className="value">{fmtInt(pessoas)}</div>
          <div className="hint">{fmtInt(div(pessoas, diasVenda))} por dia</div>
        </div>
        <div className="card kpi">
          <div className="label">Ticket médio</div>
          <div className="value">{fmtBRL2(div(fat, pessoas))}</div>
          <div className="hint">faturamento ÷ clientes</div>
        </div>
        <div className="card kpi">
          <div className="label">Participação delivery</div>
          <div className="value">{fmtPct(div(delivery, fat))}</div>
          <div className="hint">{fmtBRLCurto(delivery)} em entregas</div>
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <h2>Faturamento diário</h2>
          {diario.length ? (
            <BarChart
              titulo="Faturamento diário"
              dados={diario.map((d) => ({
                rotulo: d.data.slice(8, 10),
                valor: d.faturamento,
                detalhe: [fmtData(d.data), `${fmtInt(d.pessoas)} clientes`],
              }))}
              formato="brl"
              rotuloCada={diario.length > 16 ? 3 : 1}
            />
          ) : (
            <p className="muted">Sem vendas no período.</p>
          )}
        </div>
        <div className="card">
          <h2>Faturamento médio por hora do dia</h2>
          {horasVenda.length ? (
            <BarChart
              titulo="Faturamento médio por hora"
              dados={horasVenda.map((h) => ({
                rotulo: `${String(h.hora).padStart(2, "0")}h`,
                valor: h.faturamento / Math.max(h.dias, 1),
                detalhe: [`total ${fmtBRL(h.faturamento)}`, `${fmtInt(div(h.pessoas, h.dias))} clientes/dia`],
              }))}
              formato="brl"
              rotuloCada={horasVenda.length > 14 ? 2 : 1}
            />
          ) : (
            <p className="muted">Sem dados no período.</p>
          )}
          <p className="muted small">Média por dia sincronizado. Inclui taxa de serviço.</p>
        </div>
      </section>

      <section className="grid two">
        <Participacao titulo="Modo de venda" itens={modos} rotuloPessoas="Clientes" />
        <Participacao titulo="Meio de pagamento" itens={meios} />
      </section>

      <section className="card">
        <h2>Entregas por loja</h2>
        {entregas.length === 0 ? (
          <p className="muted">Sem entregas no período.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Loja</th>
                  <th className="num">Entregas</th>
                  <th className="num">Total pedidos</th>
                  <th className="num">Pedido médio</th>
                  <th className="num">Taxa de entrega</th>
                </tr>
              </thead>
              <tbody>
                {entregas.map((e) => (
                  <tr key={e.loja_nome}>
                    <td style={{ whiteSpace: "nowrap" }}>{e.loja_nome}</td>
                    <td className="num">{fmtInt(e.entregas)}</td>
                    <td className="num">{fmtBRL(e.total_pedido)}</td>
                    <td className="num">{fmtBRL2(div(e.total_pedido, e.entregas))}</td>
                    <td className="num">{fmtBRL(e.taxa_entrega)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small">Meios de pagamento agrupados por categoria a partir do nome cadastrado no PDV.</p>
      </section>
    </>
  );
}
