import BarChart from "@/components/BarChart";
import TabelaDeliveryLoja from "@/components/delivery/TabelaDeliveryLoja";
import MonthSelect from "@/components/MonthSelect";
import Card from "@/components/ui/Card";
import { BotaoFiltros, FiltrosMobileProvider } from "@/components/ui/FiltrosMobile";
import KpiCard from "@/components/ui/KpiCard";
import PageHeader from "@/components/ui/PageHeader";
import { IconeBicicleta, IconeCalendario, IconeGraficoBarras, IconePercentual, IconeRecibo, IconeSacola } from "@/components/ui/icones";
import { div, fmtBRL2, fmtBRLCurto, fmtData, fmtInt, fmtMes, fmtPct } from "@/lib/format";
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
    <FiltrosMobileProvider>
      <div className="grid gap-5">
        <PageHeader
          titulo="Delivery"
          descricao={`${nomeLoja} · ${fmtMes(mes)} · vendas no modo Entrega (Colibri) e no canal delivery (3S).`}
        />

        <div className="flex flex-wrap items-center gap-3">
          <MonthSelect meses={lista} atual={mes} rotulos={rotulos} base="/delivery" lojas={lojas} lojaAtual={loja} />
          {porLoja.length > 0 && <BotaoFiltros />}
        </div>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Indicadores do período">
          <KpiCard
            destaque
            className="col-span-2 xl:col-span-1"
            icone={IconeBicicleta}
            rotulo="Faturamento delivery"
            valor={fmtBRLCurto(delivery)}
            detalhe={`média ${fmtBRLCurto(div(delivery, diasDelivery))} por dia`}
          />
          <KpiCard icone={IconePercentual} rotulo="Participação no faturamento" valor={fmtPct(div(delivery, total))} detalhe={`de ${fmtBRLCurto(total)} no período`} />
          <KpiCard icone={IconeSacola} rotulo="Pedidos delivery" valor={fmtInt(pedidos)} detalhe={`${fmtInt(div(pedidos, diasDelivery))} por dia`} />
          <KpiCard
            icone={IconeRecibo}
            rotulo="Ticket médio delivery"
            valor={fmtBRL2(div(delivery, pedidos))}
            detalhe="faturamento delivery ÷ pedidos"
            className="col-span-2 xl:col-span-1"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card cantoDestaque titulo="Faturamento delivery diário" icone={IconeCalendario}>
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
              <p className="m-0 py-10 text-center text-muted-foreground">Sem delivery no período.</p>
            )}
          </Card>
          <Card cantoDestaque titulo="Delivery médio por dia da semana" icone={IconeGraficoBarras} rodape="Média dos dias com delivery no mês selecionado.">
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
              <p className="m-0 py-10 text-center text-muted-foreground">Sem delivery no período.</p>
            )}
          </Card>
        </section>

        <TabelaDeliveryLoja
          linhas={porLoja}
          nota={
            <>
              A participação do total considera só as lojas com delivery no período; a do topo da página considera todas as lojas. Taxa
              de entrega: informada só pelo Colibri; no 3S aparece “–” (o relatório de delivery consolidado do BOH não retorna dados).
              Cancelamentos e meio de pagamento por parceiro ainda não estão disponíveis para as lojas do 3S.
            </>
          }
        />
      </div>
    </FiltrosMobileProvider>
  );
}
