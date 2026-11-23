"use client";

import BarraPercentual from "@/components/ui/BarraPercentual";
import DataTable, { type CartaoMobile, type Coluna, type Filtro } from "@/components/ui/DataTable";
import { IconeLoja } from "@/components/ui/icones";
import Pill, { type TomPill } from "@/components/ui/Pill";
import { div, fmtBRL, fmtBRL2, fmtInt, fmtPct } from "@/lib/format";
import type { DeliveryLoja } from "@/lib/queries";

// Sistema de origem do delivery: cor por sistema para bater o olho na tabela.
const tomSistema = (origem: string): TomPill => (/\+/.test(origem) ? "marca" : /3s/i.test(origem) ? "primaria" : "neutro");
const PillSistema = ({ origem }: { origem: string }) => <Pill tom={tomSistema(origem)}>{origem}</Pill>;

const participacao = (l: DeliveryLoja) => div(l.delivery, l.total);
const ticket = (l: DeliveryLoja) => div(l.delivery, l.pedidos);

function colunas(maxPart: number): Coluna<DeliveryLoja>[] {
  return [
    { id: "loja", titulo: "Loja", ordenar: (l) => l.loja_nome, celula: (l) => <span className="font-semibold">{l.loja_nome}</span>, classe: "whitespace-nowrap" },
    { id: "sistema", titulo: "Sistema", ordenar: (l) => l.origem, celula: (l) => <PillSistema origem={l.origem} /> },
    { id: "total", titulo: "Faturamento da loja", alinhar: "direita", ordenar: (l) => l.total, celula: (l) => fmtBRL(l.total), classe: "whitespace-nowrap" },
    {
      id: "delivery",
      titulo: "Delivery",
      alinhar: "direita",
      ordenar: (l) => l.delivery,
      celula: (l) => <b className="font-bold">{fmtBRL(l.delivery)}</b>,
      classe: "whitespace-nowrap",
    },
    {
      id: "participacao",
      titulo: "Participação",
      alinhar: "direita",
      ordenar: participacao,
      celula: (l) => <BarraPercentual texto={fmtPct(participacao(l))} fracao={(participacao(l) ?? 0) / maxPart} />,
    },
    { id: "pedidos", titulo: "Pedidos", alinhar: "direita", ordenar: (l) => l.pedidos, celula: (l) => fmtInt(l.pedidos) },
    { id: "ticket", titulo: "Ticket", alinhar: "direita", ordenar: ticket, celula: (l) => fmtBRL2(ticket(l)), classe: "whitespace-nowrap" },
    {
      id: "taxa",
      titulo: "Taxa de entrega",
      alinhar: "direita",
      ordenar: (l) => l.taxa_entrega,
      celula: (l) => (l.taxa_entrega === null ? <span title="Não informada pelo 3S">–</span> : fmtBRL(l.taxa_entrega)),
      classe: "whitespace-nowrap",
    },
  ];
}

function filtros(linhas: DeliveryLoja[]): Filtro<DeliveryLoja>[] {
  const sistemas = [...new Set(linhas.map((l) => l.origem))].sort();
  return [{ id: "sistema", rotulo: "Sistema", opcoes: sistemas.map((s) => ({ valor: s, rotulo: s })), aplicar: (l, v) => l.origem === v }];
}

const metrica = (r: string, v: string, forte?: boolean) => (
  <div className="min-w-0">
    <p className="m-0 text-xs text-foreground-suave">{r}</p>
    <p className={forte ? "m-0 whitespace-nowrap font-bold tabular-nums" : "m-0 whitespace-nowrap tabular-nums"}>{v}</p>
  </div>
);

/** Delivery do período por loja: busca, filtro por sistema, ordenação, total e cards no mobile. */
export default function TabelaDeliveryLoja({ linhas, nota }: { linhas: DeliveryLoja[]; nota?: React.ReactNode }) {
  const maxPart = Math.max(0.0001, ...linhas.map((l) => participacao(l) ?? 0));
  const total = linhas.reduce((s, l) => s + l.total, 0);
  const delivery = linhas.reduce((s, l) => s + l.delivery, 0);
  const pedidos = linhas.reduce((s, l) => s + l.pedidos, 0);

  const cartao = (l: DeliveryLoja): CartaoMobile => ({
    cabecalho: (
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 truncate text-base font-semibold">{l.loja_nome}</p>
          <div className="mt-1">
            <PillSistema origem={l.origem} />
          </div>
        </div>
        <Pill tom="primaria">{fmtPct(participacao(l))}</Pill>
      </div>
    ),
    corpo: (
      <div className="grid gap-2.5 border-t border-border pt-3">
        <div className="flex justify-between gap-3 text-sm">
          {metrica("Delivery", fmtBRL(l.delivery), true)}
          {metrica("Pedidos", fmtInt(l.pedidos))}
          {metrica("Ticket", fmtBRL2(ticket(l)))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="shrink-0 text-foreground-suave">Fat. loja {fmtBRL(l.total)}</span>
          <BarraPercentual larga texto="" fracao={(participacao(l) ?? 0) / maxPart} />
        </div>
      </div>
    ),
  });

  return (
    <DataTable
      titulo="Delivery por loja"
      icone={IconeLoja}
      linhas={linhas}
      colunas={colunas(maxPart)}
      chave={(l) => l.loja_id}
      busca={{ placeholder: "Buscar loja...", texto: (l) => `${l.loja_nome} ${l.origem}` }}
      filtros={filtros(linhas)}
      ordemInicial={{ coluna: "delivery", direcao: "desc" }}
      porPagina={10}
      nomeItens={["loja", "lojas"]}
      cartaoMobile={cartao}
      vazio="Sem delivery no período."
      rodape={nota}
      linhaTotal={{
        celulas: {
          loja: "Total das lojas com delivery",
          total: fmtBRL(total),
          delivery: fmtBRL(delivery),
          participacao: fmtPct(div(delivery, total)),
          pedidos: fmtInt(pedidos),
          ticket: fmtBRL2(div(delivery, pedidos)),
        },
        mobile: {
          cabecalho: (
            <div className="grid gap-1 text-sm">
              <span>Total das lojas com delivery</span>
              <div className="flex justify-between gap-3 font-normal tabular-nums">
                <span>
                  <b>{fmtBRL(delivery)}</b> de {fmtBRL(total)}
                </span>
                <span>{fmtPct(div(delivery, total))}</span>
                <span>{fmtInt(pedidos)} pedidos</span>
              </div>
            </div>
          ),
        },
      }}
    />
  );
}
