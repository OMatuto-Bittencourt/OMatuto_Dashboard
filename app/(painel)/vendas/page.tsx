import BarChart from "@/components/BarChart";
import MonthSelect from "@/components/MonthSelect";
import Card from "@/components/ui/Card";
import { BotaoFiltros, FiltrosMobileProvider } from "@/components/ui/FiltrosMobile";
import KpiCard from "@/components/ui/KpiCard";
import PageHeader from "@/components/ui/PageHeader";
import { IconeBanco, IconeBicicleta, IconeCalendario, IconeCartao, IconeRecibo, IconeRelogio, IconeSacola, IconeUsuarios } from "@/components/ui/icones";
import TabelaEntregas from "@/components/vendas/TabelaEntregas";
import TabelaParticipacao from "@/components/vendas/TabelaParticipacao";
import { div, fmtBRL, fmtBRL2, fmtBRLCurto, fmtData, fmtInt, fmtMes, fmtPct } from "@/lib/format";
import {
  apuracaoPagamento3s,
  cobertura,
  diarioDoMes,
  entregasPorLoja,
  faturamentoPorHora,
  lojasComVenda,
  meioPagamento,
  modoVenda,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const RE_MES = /^d{4}-(0[1-9]|1[0-2])$/;
const RE_ID = /^d{1,20}$/;

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string; loja?: string }> }) {
  const sp = await searchParams;
  const [cob, lojas] = await Promise.all([cobertura(), lojasComVenda()]);
  const lista = cob.map((c) => c.mes).reverse();
  if (lista.length === 0) return <p>Nenhuma venda sincronizada do Colibri.</p>;

  const mes = sp.mes && RE_MES.test(sp.mes) && lista.includes(sp.mes) ? sp.mes : lista[0];
  const loja = sp.loja && RE_ID.test(sp.loja) && lojas.some((l) => l.loja_id === sp.loja) ? sp.loja : undefined;
  const c = cob.find((x) => x.mes === mes)!;
  const nomeLoja = loja ? lojas.find((l) => l.loja_id === loja)?.nome : "Todas as lojas";

  const [diario, modos, meios, horas, entregas, apurado3s] = await Promise.all([
    diarioDoMes(mes, loja),
    modoVenda(mes, loja),
    meioPagamento(mes, loja),
    faturamentoPorHora(mes, loja),
    entregasPorLoja(mes, loja),
    apuracaoPagamento3s(),
  ]);
  const notaMeios = apurado3s
    ? `Lojas 3S: formas de pagamento apuradas até ${fmtData(apurado3s)}; vendas posteriores entram após a apuração. Por isso o total pode ficar abaixo do faturamento do período.`
    : undefined;

  const fat = diario.reduce((s, d) => s + d.faturamento, 0);
  const pessoas = diario.reduce((s, d) => s + d.pessoas, 0);
  const diasVenda = diario.filter((d) => d.faturamento > 0).length;
  const delivery = modos.find((m) => m.rotulo.toLowerCase() === "entrega")?.valor ?? 0;
  const rotulos = Object.fromEntries(
    cob.map((x) => [x.mes, `${fmtMes(x.mes)}${x.completo ? "" : ` (${x.dias_sincronizados}/${x.dias_esperados} dias)`}`]),
  );
  const horasVenda = horas.filter((h) => h.faturamento > 0);

  return (
    <FiltrosMobileProvider>
      <div className="grid gap-5">
        <PageHeader
          titulo="Vendas"
          descricao={`${nomeLoja} · ${fmtMes(mes)} · ${c.dias_sincronizados} de ${c.dias_esperados} dias sincronizados do Colibri.`}
        />

        <div className="flex flex-wrap items-center gap-3">
          <MonthSelect meses={lista} atual={mes} rotulos={rotulos} base="/vendas" lojas={lojas} lojaAtual={loja} />
          {entregas.length > 0 && <BotaoFiltros />}
        </div>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Indicadores do período">
          <KpiCard
            destaque
            className="col-span-2 xl:col-span-1"
            icone={IconeBanco}
            rotulo="Faturamento"
            valor={fmtBRLCurto(fat)}
            detalhe={`média ${fmtBRLCurto(div(fat, diasVenda))} por dia com venda`}
          />
          <KpiCard icone={IconeUsuarios} rotulo="Clientes" valor={fmtInt(pessoas)} detalhe={`${fmtInt(div(pessoas, diasVenda))} por dia`} />
          <KpiCard icone={IconeRecibo} rotulo="Ticket médio" valor={fmtBRL2(div(fat, pessoas))} detalhe="faturamento ÷ clientes" />
          <KpiCard
            icone={IconeBicicleta}
            rotulo="Participação delivery"
            valor={fmtPct(div(delivery, fat))}
            detalhe={`${fmtBRLCurto(delivery)} em entregas`}
            className="col-span-2 xl:col-span-1"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card cantoDestaque titulo="Faturamento diário" icone={IconeCalendario}>
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
              <p className="m-0 py-10 text-center text-muted-foreground">Sem vendas no período.</p>
            )}
          </Card>
          <Card cantoDestaque titulo="Faturamento médio por hora do dia" icone={IconeRelogio} rodape="Média por dia sincronizado. Inclui taxa de serviço.">
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
              <p className="m-0 py-10 text-center text-muted-foreground">Sem dados no período.</p>
            )}
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card titulo="Modo de venda" icone={IconeSacola}>
            <TabelaParticipacao itens={modos} rotulo="Modo" comClientes />
          </Card>
          <Card titulo="Meio de pagamento" icone={IconeCartao}>
            <TabelaParticipacao
              itens={meios}
              rotulo="Meio"
              nota={
                <>
                  Meios de pagamento agrupados por categoria a partir do nome cadastrado no PDV.
                  {notaMeios && <> {notaMeios}</>}
                </>
              }
            />
          </Card>
        </section>

        <TabelaEntregas linhas={entregas} />
      </div>
    </FiltrosMobileProvider>
  );
}
