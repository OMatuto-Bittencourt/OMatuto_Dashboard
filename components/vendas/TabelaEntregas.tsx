"use client";

import DataTable, { type CartaoMobile, type Coluna } from "@/components/ui/DataTable";
import { IconeBicicleta } from "@/components/ui/icones";
import Pill from "@/components/ui/Pill";
import { div, fmtBRL, fmtBRL2, fmtInt } from "@/lib/format";
import type { EntregaLoja } from "@/lib/queries";

const colunas: Coluna<EntregaLoja>[] = [
  { id: "loja", titulo: "Loja", ordenar: (e) => e.loja_nome, celula: (e) => <span className="font-semibold">{e.loja_nome}</span>, classe: "whitespace-nowrap" },
  { id: "entregas", titulo: "Entregas", alinhar: "direita", ordenar: (e) => e.entregas, celula: (e) => fmtInt(e.entregas) },
  {
    id: "total",
    titulo: "Total pedidos",
    alinhar: "direita",
    ordenar: (e) => e.total_pedido,
    celula: (e) => <b className="font-bold">{fmtBRL(e.total_pedido)}</b>,
    classe: "whitespace-nowrap",
  },
  {
    id: "medio",
    titulo: "Pedido médio",
    alinhar: "direita",
    ordenar: (e) => div(e.total_pedido, e.entregas),
    celula: (e) => fmtBRL2(div(e.total_pedido, e.entregas)),
    classe: "whitespace-nowrap",
  },
  { id: "taxa", titulo: "Taxa de entrega", alinhar: "direita", ordenar: (e) => e.taxa_entrega, celula: (e) => fmtBRL(e.taxa_entrega), classe: "whitespace-nowrap" },
];

const metrica = (r: string, v: string, forte?: boolean) => (
  <div className="min-w-0">
    <p className="m-0 text-xs text-foreground-suave">{r}</p>
    <p className={forte ? "m-0 whitespace-nowrap font-bold tabular-nums" : "m-0 whitespace-nowrap tabular-nums"}>{v}</p>
  </div>
);

const cartao = (e: EntregaLoja): CartaoMobile => ({
  cabecalho: (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate font-semibold">{e.loja_nome}</span>
      <Pill tom="marca" icone={IconeBicicleta}>
        {fmtInt(e.entregas)}
      </Pill>
    </div>
  ),
  corpo: (
    <div className="flex justify-between gap-3 text-sm">
      {metrica("Total pedidos", fmtBRL(e.total_pedido), true)}
      {metrica("Pedido médio", fmtBRL2(div(e.total_pedido, e.entregas)))}
      {metrica("Taxa", fmtBRL(e.taxa_entrega))}
    </div>
  ),
});

/** Entregas do período por loja: busca, ordenação, paginação, total e cards no mobile. */
export default function TabelaEntregas({ linhas }: { linhas: EntregaLoja[] }) {
  const entregas = linhas.reduce((s, e) => s + e.entregas, 0);
  const total = linhas.reduce((s, e) => s + e.total_pedido, 0);
  const taxa = linhas.reduce((s, e) => s + e.taxa_entrega, 0);
  return (
    <DataTable
      titulo="Entregas por loja"
      icone={IconeBicicleta}
      linhas={linhas}
      colunas={colunas}
      chave={(e) => e.loja_nome}
      busca={{ placeholder: "Buscar loja...", texto: (e) => e.loja_nome }}
      ordemInicial={{ coluna: "total", direcao: "desc" }}
      porPagina={10}
      nomeItens={["loja", "lojas"]}
      cartaoMobile={cartao}
      vazio="Sem entregas no período."
      linhaTotal={{
        celulas: { entregas: fmtInt(entregas), total: fmtBRL(total), medio: fmtBRL2(div(total, entregas)), taxa: fmtBRL(taxa) },
        mobile: {
          cabecalho: (
            <div className="flex justify-between gap-3 text-sm">
              <span>Total</span>
              <span className="tabular-nums">{fmtInt(entregas)} entregas</span>
              <span className="tabular-nums">{fmtBRL(total)}</span>
            </div>
          ),
        },
      }}
    />
  );
}
