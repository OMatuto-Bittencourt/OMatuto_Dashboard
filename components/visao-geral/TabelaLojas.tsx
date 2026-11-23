"use client";

import Link from "next/link";
import BarraPercentual from "@/components/ui/BarraPercentual";
import Codigo from "@/components/ui/Codigo";
import DataTable, { type CartaoMobile, type Coluna, type Filtro } from "@/components/ui/DataTable";
import { IconeLink, IconeLoja, IconeSinal } from "@/components/ui/icones";
import type { Acao } from "@/components/ui/MenuAcoes";
import Pill, { type TomPill } from "@/components/ui/Pill";
import { fmtBRL, fmtBRL2, fmtInt, fmtMes, fmtPct } from "@/lib/format";

export type StatusLoja = { tipo: "ok" | "sem_coligada" | "folha_sem_venda" | "sem_venda_recente"; texto: string };

/** Uma linha já calculada no servidor (só dados serializáveis). */
export type LinhaLoja = {
  id: string;
  loja: string;
  rede: string | null;
  faturamento: number | null;
  clientes: number | null;
  ticket: number | null;
  dias: number | null;
  funcionarios: number | null;
  folha: number | null;
  folhaFat: number | null; // null quando o mês não permite comparar
  fatFunc: number | null;
  coligadas: number[] | null;
  status: StatusLoja;
};

const TOM_STATUS: Record<StatusLoja["tipo"], TomPill> = {
  ok: "sucesso",
  sem_coligada: "aviso",
  folha_sem_venda: "perigo",
  sem_venda_recente: "aviso",
};
const ROTULO_STATUS: Record<StatusLoja["tipo"], string> = {
  ok: "OK",
  sem_coligada: "Sem coligada",
  folha_sem_venda: "Folha sem venda",
  sem_venda_recente: "Sem venda recente",
};
const tomRede = (rede: string | null): TomPill => (rede && /express/i.test(rede) ? "marca" : "neutro");
const linkVendas = (l: LinhaLoja, mes: string) => `/vendas?mes=${mes}&loja=${encodeURIComponent(l.id)}`;

const PillRede = ({ rede }: { rede: string | null }) => (rede ? <Pill tom={tomRede(rede)}>{rede}</Pill> : <>–</>);
const PillStatus = ({ s }: { s: StatusLoja }) => (
  <Pill tom={TOM_STATUS[s.tipo]} ponto>
    {s.texto}
  </Pill>
);

function colunas(mes: string, maxFolhaFat: number): Coluna<LinhaLoja>[] {
  return [
    { id: "loja", titulo: "Loja", ordenar: (l) => l.loja, celula: (l) => <span className="font-semibold">{l.loja}</span>, classe: "whitespace-nowrap" },
    { id: "rede", titulo: "Rede", ordenar: (l) => l.rede, celula: (l) => <PillRede rede={l.rede} /> },
    {
      id: "faturamento",
      titulo: "Faturamento",
      alinhar: "direita",
      ordenar: (l) => l.faturamento,
      celula: (l) => <b className="font-bold">{fmtBRL(l.faturamento)}</b>,
      classe: "whitespace-nowrap",
    },
    { id: "clientes", titulo: "Clientes", alinhar: "direita", ordenar: (l) => l.clientes, celula: (l) => fmtInt(l.clientes) },
    { id: "ticket", titulo: "Ticket", alinhar: "direita", ordenar: (l) => l.ticket, celula: (l) => fmtBRL2(l.ticket), classe: "whitespace-nowrap" },
    {
      id: "dias",
      titulo: "Dias c/ venda",
      alinhar: "centro",
      ordenar: (l) => l.dias,
      classe: "min-w-20",
      celula: (l) =>
        l.dias ? (
          <Link
            href={linkVendas(l, mes)}
            title={`Ver vendas de ${l.loja} em ${fmtMes(mes)}`}
            className="font-bold text-(--series-1) no-underline hover:underline"
          >
            {fmtInt(l.dias)}
          </Link>
        ) : (
          "–"
        ),
    },
    { id: "funcionarios", titulo: "Func. pagos", alinhar: "centro", ordenar: (l) => l.funcionarios, celula: (l) => fmtInt(l.funcionarios) },
    { id: "folha", titulo: "Folha parcial", alinhar: "direita", ordenar: (l) => l.folha, celula: (l) => fmtBRL(l.folha), classe: "whitespace-nowrap" },
    {
      id: "folhaFat",
      titulo: "Folha / fat.",
      alinhar: "direita",
      ordenar: (l) => l.folhaFat,
      celula: (l) => <BarraPercentual texto={fmtPct(l.folhaFat)} fracao={l.folhaFat === null ? null : l.folhaFat / maxFolhaFat} />,
    },
    { id: "fatFunc", titulo: "Fat. / func.", alinhar: "direita", ordenar: (l) => l.fatFunc, celula: (l) => fmtBRL(l.fatFunc), classe: "whitespace-nowrap" },
    { id: "coligadas", titulo: "Coligadas RM", ordenar: (l) => l.coligadas?.[0], celula: (l) => l.coligadas?.join(", ") ?? "–" },
    { id: "status", titulo: "Status", ordenar: (l) => l.status.tipo, celula: (l) => <PillStatus s={l.status} /> },
  ];
}

function filtros(linhas: LinhaLoja[]): Filtro<LinhaLoja>[] {
  const redes = [...new Set(linhas.map((l) => l.rede).filter((r): r is string => !!r))].sort();
  const status = [...new Set(linhas.map((l) => l.status.tipo))];
  return [
    { id: "rede", rotulo: "Rede", opcoes: redes.map((r) => ({ valor: r, rotulo: r })), aplicar: (l, v) => l.rede === v },
    { id: "status", rotulo: "Status", opcoes: status.map((s) => ({ valor: s, rotulo: ROTULO_STATUS[s] })), aplicar: (l, v) => l.status.tipo === v },
    {
      id: "coligadas",
      rotulo: "Coligadas RM",
      opcoes: [
        { valor: "com", rotulo: "Com coligada" },
        { valor: "sem", rotulo: "Sem coligada" },
      ],
      aplicar: (l, v) => (v === "com") === !!l.coligadas?.length,
    },
  ];
}

/** Card de uma loja no mobile. */
function cartaoLoja(l: LinhaLoja, maxFolhaFat: number): CartaoMobile {
  const metrica = (rotulo: string, valor: string, forte?: boolean) => (
    <div className="min-w-0">
      <p className="m-0 text-xs text-foreground-suave">{rotulo}</p>
      <p className={forte ? "m-0 whitespace-nowrap font-bold tabular-nums" : "m-0 whitespace-nowrap tabular-nums"}>{valor}</p>
    </div>
  );
  return {
    cabecalho: (
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 truncate text-base font-semibold">{l.loja}</p>
          <div className="mt-1">
            <PillRede rede={l.rede} />
          </div>
        </div>
        <PillStatus s={l.status} />
      </div>
    ),
    corpo: (
      <div className="grid gap-2.5 border-t border-border pt-3">
        {/* Cada valor com a largura que precisa; a sobra vai para os espaços (nunca se sobrepõem) */}
        <div className="flex justify-between gap-3 text-sm">
          {metrica("Faturamento", fmtBRL(l.faturamento), true)}
          {metrica("Clientes", fmtInt(l.clientes))}
          {metrica("Ticket", fmtBRL2(l.ticket))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="shrink-0 text-foreground-suave">Folha / fat.</span>
          <BarraPercentual larga texto={fmtPct(l.folhaFat)} fracao={l.folhaFat === null ? null : l.folhaFat / maxFolhaFat} />
        </div>
      </div>
    ),
  };
}

export default function TabelaLojas({ linhas, mes }: { linhas: LinhaLoja[]; mes: string }) {
  const maxFolhaFat = Math.max(0.0001, ...linhas.map((l) => l.folhaFat ?? 0));
  const acoes = (l: LinhaLoja): Acao[] => [
    { rotulo: "Ver vendas da loja", href: linkVendas(l, mes), icone: IconeSinal },
    { rotulo: "Ver ligação no RM", href: "/ligacao", icone: IconeLink },
  ];
  return (
    <DataTable
      titulo={`Lojas · ${fmtMes(mes)}`}
      icone={IconeLoja}
      linhas={linhas}
      colunas={colunas(mes, maxFolhaFat)}
      chave={(l) => l.id}
      busca={{ placeholder: "Buscar loja, rede...", texto: (l) => `${l.loja} ${l.rede ?? ""}` }}
      filtros={filtros(linhas)}
      ordemInicial={{ coluna: "faturamento", direcao: "desc" }}
      porPagina={5}
      nomeItens={["loja", "lojas"]}
      favoritos="mto:lojas-favoritas"
      acoes={acoes}
      linkLinha={(l) => linkVendas(l, mes)}
      cartaoMobile={(l) => cartaoLoja(l, maxFolhaFat)}
      rodape={
        <>
          Folha atribuída à loja pelas ligações vigentes em <Codigo>dashboard.coligada_loja</Codigo> (várias coligadas podem somar na
          mesma loja). Funcionários pagos = matrículas com salário pago na competência.
        </>
      }
    />
  );
}
