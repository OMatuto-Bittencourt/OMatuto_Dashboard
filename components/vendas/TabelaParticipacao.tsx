"use client";

import BarraPercentual from "@/components/ui/BarraPercentual";
import DataTable, { type CartaoMobile, type Coluna } from "@/components/ui/DataTable";
import Pill from "@/components/ui/Pill";
import { div, fmtBRL, fmtBRL2, fmtInt, fmtPct } from "@/lib/format";
import type { Fatia } from "@/lib/queries";

type Props = {
  itens: Fatia[];
  /** Título da 1ª coluna, ex.: "Modo" ou "Meio". */
  rotulo: string;
  /** Mostra as colunas Clientes e Ticket (quando a fatia tem pessoas). */
  comClientes?: boolean;
  nota?: React.ReactNode;
};

/**
 * Tabela de participação (quanto cada fatia representa do total), com barra e linha de total.
 * Reutilizável para qualquer lista {rotulo, valor, pessoas}: modo de venda, meio de pagamento etc.
 * Vai sem card próprio: a página o envolve num <Card> com título e ícone.
 */
export default function TabelaParticipacao({ itens, rotulo, comClientes, nota }: Props) {
  const total = itens.reduce((s, i) => s + i.valor, 0);
  const totalPessoas = itens.reduce((s, i) => s + (i.pessoas ?? 0), 0);
  const max = Math.max(1, ...itens.map((i) => i.valor));
  const pct = (i: Fatia) => div(i.valor, total);

  const colunas: Coluna<Fatia>[] = [
    { id: "rotulo", titulo: rotulo, ordenar: (i) => i.rotulo, celula: (i) => <span className="font-medium">{i.rotulo}</span>, classe: "whitespace-nowrap" },
    { id: "valor", titulo: "Valor", alinhar: "direita", ordenar: (i) => i.valor, celula: (i) => fmtBRL(i.valor), classe: "whitespace-nowrap" },
    {
      id: "participacao",
      titulo: "Participação",
      alinhar: "direita",
      ordenar: (i) => i.valor,
      celula: (i) => <BarraPercentual texto={fmtPct(pct(i))} fracao={i.valor / max} />,
    },
    ...(comClientes
      ? ([
          { id: "clientes", titulo: "Clientes", alinhar: "direita", ordenar: (i) => i.pessoas, celula: (i) => fmtInt(i.pessoas) },
          {
            id: "ticket",
            titulo: "Ticket",
            alinhar: "direita",
            ordenar: (i) => div(i.valor, i.pessoas),
            celula: (i) => fmtBRL2(div(i.valor, i.pessoas)),
            classe: "whitespace-nowrap",
          },
        ] satisfies Coluna<Fatia>[])
      : []),
  ];

  const metrica = (r: string, v: string, forte?: boolean) => (
    <div className="min-w-0">
      <p className="m-0 text-xs text-foreground-suave">{r}</p>
      <p className={forte ? "m-0 whitespace-nowrap font-bold tabular-nums" : "m-0 whitespace-nowrap tabular-nums"}>{v}</p>
    </div>
  );

  const cartao = (i: Fatia): CartaoMobile => ({
    cabecalho: (
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-semibold">{i.rotulo}</span>
        <Pill tom="primaria">{fmtPct(pct(i))}</Pill>
      </div>
    ),
    corpo: comClientes ? (
      <div className="grid gap-2.5">
        <div className="flex justify-between gap-3 text-sm">
          {metrica("Valor", fmtBRL(i.valor), true)}
          {metrica("Clientes", fmtInt(i.pessoas))}
          {metrica("Ticket", fmtBRL2(div(i.valor, i.pessoas)))}
        </div>
        <BarraPercentual larga texto="" fracao={i.valor / max} />
      </div>
    ) : (
      // Só o valor: cabe numa linha com a barra (card compacto)
      <div className="flex items-center gap-3 text-sm">
        <b className="shrink-0 font-bold tabular-nums">{fmtBRL(i.valor)}</b>
        <BarraPercentual larga texto="" fracao={i.valor / max} />
      </div>
    ),
  });

  return (
    <DataTable
      semCard
      paginacao={false}
      linhas={itens}
      colunas={colunas}
      chave={(i) => i.rotulo}
      ordemInicial={{ coluna: "valor", direcao: "desc" }}
      cartaoMobile={cartao}
      vazio="Sem dados no período."
      rodape={nota}
      linhaTotal={{
        celulas: { valor: fmtBRL(total), ...(comClientes ? { clientes: fmtInt(totalPessoas) } : {}) },
        mobile: {
          cabecalho: (
            <div className="flex justify-between gap-3 text-sm">
              <span>Total</span>
              <span className="tabular-nums">{fmtBRL(total)}</span>
              {comClientes && <span className="tabular-nums">{fmtInt(totalPessoas)} clientes</span>}
            </div>
          ),
        },
      }}
    />
  );
}
