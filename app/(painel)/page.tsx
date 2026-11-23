import BarChart from "@/components/BarChart";
import MonthSelect from "@/components/MonthSelect";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";
import { BotaoFiltros, FiltrosMobileProvider } from "@/components/ui/FiltrosMobile";
import KpiCard, { type Variacao } from "@/components/ui/KpiCard";
import PageHeader from "@/components/ui/PageHeader";
import Pill from "@/components/ui/Pill";
import {
  IconeBanco,
  IconeCalendario,
  IconeGraficoBarras,
  IconeLinkQuebrado,
  IconeLoja,
  IconePercentual,
  IconeSetaDireita,
  IconeSinal,
  IconeUsuario,
  IconeUsuarios,
} from "@/components/ui/icones";
import TabelaLojas, { type LinhaLoja, type StatusLoja } from "@/components/visao-geral/TabelaLojas";
import { div, fmtBRL2, fmtBRLCurto, fmtData, fmtInt, fmtMes, fmtPct } from "@/lib/format";
import { atualizacao, cobertura, diarioDoMes, lojasDoMes, meses, serieRede, type Cobertura, type LojaMes, type SerieMes } from "@/lib/queries";

export const dynamic = "force-dynamic";

const RE_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

function mesAnterior(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}

/** checarRecencia: só faz sentido no mês mais recente com vendas. */
function status(l: LojaMes, ultimaData: string | null, checarRecencia: boolean): StatusLoja {
  const temVenda = (l.faturamento ?? 0) > 0;
  const temFolha = (l.custo_folha ?? 0) > 0;
  if (!temVenda && temFolha) return { tipo: "folha_sem_venda", texto: "Folha sem venda" };
  if (temVenda && !l.coligadas) return { tipo: "sem_coligada", texto: "Sem coligada" };
  if (checarRecencia && l.ultima_venda && ultimaData && diasEntre(l.ultima_venda, ultimaData) > 3)
    return { tipo: "sem_venda_recente", texto: `Sem venda desde ${fmtData(l.ultima_venda)}` };
  return { tipo: "ok", texto: "OK" };
}

/** Folha × faturamento só é comparável com o mês fechado e todos os dias de venda sincronizados. */
const comparavel = (c?: Cobertura) => !!c && c.completo && c.mes_fechado;

function rotuloMes(m: string, c?: Cobertura): string {
  if (!c) return `${fmtMes(m)} (sem vendas)`;
  if (!c.mes_fechado) return `${fmtMes(m)} (em andamento)`;
  if (!c.completo) return `${fmtMes(m)} (${c.dias_sincronizados}/${c.dias_esperados} dias)`;
  return fmtMes(m);
}

/**
 * Variações contra o mês anterior, todas tiradas da mesma série (vw_loja_fat_folha_mensal).
 * Só existem quando os DOIS meses estão completos — comparar mês parcial distorce.
 */
function variacoes(atual?: SerieMes, anterior?: SerieMes) {
  if (!atual || !anterior) return null;
  const rel = (a: number | null, b: number | null) => (a !== null && b !== null && b !== 0 ? a / b - 1 : null);
  const titulo = `Comparado a ${fmtMes(anterior.mes)}`;
  const v = (valor: number | null, tipo: Variacao["tipo"], melhor: Variacao["melhor"], rotulo?: string): Variacao | null =>
    valor === null ? null : { valor, tipo, melhor, rotulo, titulo };
  const folhaFat = (s: SerieMes) => div(s.custo_folha, s.fat_com_folha);
  const fatFunc = (s: SerieMes) => div(s.fat_com_folha, s.headcount);
  const pa = folhaFat(atual);
  const pb = folhaFat(anterior);
  return {
    faturamento: v(rel(atual.faturamento, anterior.faturamento), "percentual", "alta", "vs. mês anterior"),
    clientes: v(rel(atual.pessoas, anterior.pessoas), "percentual", "alta"),
    // Folha subir não é bom nem ruim sozinho (acompanha a receita); o juízo fica no % folha/fat.
    folha: v(rel(atual.custo_folha, anterior.custo_folha), "percentual", "neutro"),
    folhaFat: v(pa !== null && pb !== null ? pa - pb : null, "pontos", "baixa"),
    fatFunc: v(rel(fatFunc(atual), fatFunc(anterior)), "percentual", "alta"),
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ mes?: string; senha?: string }> }) {
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

  const ant = mesAnterior(mes);
  const delta = ok && comparavel(cobMes[ant]) ? variacoes(serie.find((s) => s.mes === mes), serie.find((s) => s.mes === ant)) : null;

  const recente = mes === upd.colibri_ultima_data?.slice(0, 7);
  const linhas: LinhaLoja[] = lojas.map((l) => ({
    id: l.loja_id,
    loja: l.loja_nome,
    rede: l.rede,
    faturamento: l.faturamento,
    clientes: l.pessoas,
    ticket: div(l.faturamento, l.pessoas),
    dias: l.dias_com_venda,
    funcionarios: l.headcount_pago,
    folha: l.custo_folha,
    folhaFat: ok ? div(l.custo_folha, l.faturamento) : null,
    fatFunc: ok ? div(l.faturamento, l.headcount_pago) : null,
    coligadas: l.coligadas,
    status: status(l, upd.colibri_ultima_data, recente),
  }));

  return (
    <FiltrosMobileProvider>
    <div className="grid gap-5">
      <PageHeader
        titulo="Visão geral da rede"
        descricao={
          <>
            Faturamento do PDV Colibri cruzado com a folha do TOTVS RM por loja. Vendas sincronizadas até{" "}
            {fmtData(upd.colibri_ultima_data)} (sync {upd.colibri_sync ?? "–"}) · folha até{" "}
            {upd.rm_ultima_competencia ? fmtMes(upd.rm_ultima_competencia) : "–"} (sync {upd.rm_sync ?? "–"}).
          </>
        }
      />

      <div className="flex items-center gap-3">
        <MonthSelect meses={lista} atual={mes} rotulos={rotulos} />
        <BotaoFiltros />
        <Pill href={`/vendas?mes=${mes}`} tom="primaria" variante="contorno" tamanho="lg" icone={IconeSinal} className="max-md:hidden">
          Ver vendas do mês <IconeSetaDireita className="size-4" />
        </Pill>
      </div>

      {sp.senha === "alterada" && <Alert variante="sucesso">Senha alterada com sucesso.</Alert>}

      {!ok && (
        <Alert variante="perigo" titulo="Mês sem comparação folha × faturamento.">
          {!c
            ? "Não há vendas do Colibri sincronizadas neste mês."
            : !c.mes_fechado
              ? `Mês em andamento (${c.dias_sincronizados} dias de venda); a folha ainda não fechou.`
              : `O Colibri tem só ${c.dias_sincronizados} de ${c.dias_esperados} dias de venda deste mês (carga histórica em andamento).`}{" "}
          Os indicadores de folha/faturamento ficam ocultos até o mês estar completo.
        </Alert>
      )}
      <Alert variante="aviso" titulo="Folha parcial:">
        custo = salário pago + FGTS estimado (8%). Não inclui INSS patronal, RAT/FAP, terceiros, benefícios e provisões (encargos
        do RM ainda vazios). Use o % folha/faturamento para comparar lojas entre si, não como número oficial.
      </Alert>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores do mês">
        <KpiCard
          destaque
          className="col-span-2 md:col-span-1"
          icone={IconeBanco}
          rotulo="Faturamento"
          valor={fmtBRLCurto(fat)}
          detalhe={`${comVenda.length} lojas com venda${c && !c.completo ? ` · ${c.dias_sincronizados}/${c.dias_esperados} dias` : ""}`}
          variacao={delta?.faturamento}
        />
        <KpiCard
          icone={IconeUsuarios}
          rotulo="Clientes"
          valor={fmtInt(pessoas)}
          detalhe={`Ticket médio ${fmtBRL2(div(fat, pessoas))}`}
          variacao={delta?.clientes}
        />
        <KpiCard
          icone={IconeLoja}
          rotulo="Folha parcial (lojas ligadas)"
          valor={fmtBRLCurto(folha)}
          detalhe={`${fmtInt(hc)} funcionários pagos`}
          variacao={delta?.folha}
        />
        <KpiCard
          icone={IconePercentual}
          rotulo="Folha / faturamento"
          valor={ok ? fmtPct(div(folhaLig, fatLig)) : "–"}
          detalhe={ok ? `sobre ${fmtBRLCurto(fatLig)} das lojas ligadas` : "mês incompleto"}
          variacao={delta?.folhaFat}
        />
        <KpiCard
          icone={IconeUsuario}
          rotulo="Faturamento por funcionário"
          valor={ok ? fmtBRLCurto(div(fatLig, hcLig)) : "–"}
          detalhe={ok ? "lojas ligadas" : "mês incompleto"}
          variacao={delta?.fatFunc}
        />
        <KpiCard
          icone={IconeLinkQuebrado}
          rotulo="Lojas com venda sem coligada"
          horizontalMobile
          className="col-span-2 md:col-span-1"
          valor={semLigacao}
          acao={{ href: "/ligacao", texto: "ver pendências" }}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card cantoDestaque titulo="Faturamento mensal da rede" icone={IconeGraficoBarras} rodape="Barras claras = mês em andamento ou com dias faltando no Colibri.">
          <BarChart
            titulo="Faturamento mensal da rede"
            dados={serie.map((s) => {
              const cm = cobMes[s.mes];
              return {
                rotulo: fmtMes(s.mes),
                rotuloCurto: fmtMes(s.mes).slice(0, 3),
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
        </Card>
        <Card cantoDestaque titulo={`Faturamento diário · ${fmtMes(mes)}`} icone={IconeCalendario}>
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
            <p className="m-0 py-10 text-center text-stone-500">Sem vendas sincronizadas neste mês.</p>
          )}
        </Card>
      </section>

      <TabelaLojas linhas={linhas} mes={mes} />
    </div>
    </FiltrosMobileProvider>
  );
}
