"use client";

import Codigo from "@/components/ui/Codigo";
import DataTable, { type CartaoMobile, type Coluna } from "@/components/ui/DataTable";
import { IconeAlerta } from "@/components/ui/icones";
import Pill from "@/components/ui/Pill";
import { fmtBRL, fmtData, fmtInt } from "@/lib/format";
import type { Pendencia } from "@/lib/queries";

const ROTULO = { LOJA_SEM_COLIGADA: "Loja sem coligada", COLIGADA_SEM_LOJA: "Coligada sem loja" } as const;
const coligada = (p: Pendencia) => (p.codcoligada ? `${p.codcoligada} · ${p.coligada_nome ?? ""}` : "–");
const PillTipo = ({ p }: { p: Pendencia }) => (
  <Pill tom="aviso" icone={IconeAlerta}>
    {ROTULO[p.tipo]}
  </Pill>
);

const colunas: Coluna<Pendencia>[] = [
  { id: "tipo", titulo: "Tipo", ordenar: (p) => p.tipo, celula: (p) => <PillTipo p={p} /> },
  {
    id: "loja",
    titulo: "Loja (Colibri)",
    ordenar: (p) => p.loja_nome,
    celula: (p) => (
      <div>
        <span className="font-semibold">{p.loja_nome ?? "–"}</span>
        {p.loja_id && (
          <div className="mt-0.5">
            <Codigo>{p.loja_id}</Codigo>
          </div>
        )}
      </div>
    ),
  },
  { id: "coligada", titulo: "Coligada (RM)", ordenar: (p) => p.codcoligada, celula: coligada },
  { id: "fat", titulo: "Faturamento 60 dias", alinhar: "direita", ordenar: (p) => p.fat_60d, celula: (p) => fmtBRL(p.fat_60d), classe: "whitespace-nowrap" },
  { id: "ultima", titulo: "Última venda", ordenar: (p) => p.ult_venda, celula: (p) => fmtData(p.ult_venda), classe: "whitespace-nowrap" },
  { id: "func", titulo: "Func. ativos", alinhar: "direita", ordenar: (p) => p.funcionarios_ativos, celula: (p) => fmtInt(p.funcionarios_ativos) },
];

const cartao = (p: Pendencia): CartaoMobile => ({
  cabecalho: (
    <div className="grid gap-1.5">
      <div>
        <PillTipo p={p} />
      </div>
      <p className="m-0 font-semibold">{p.tipo === "LOJA_SEM_COLIGADA" ? p.loja_nome : coligada(p)}</p>
    </div>
  ),
  corpo: (
    <div className="flex justify-between gap-3 border-t border-border pt-3 text-sm">
      {[
        ["Fat. 60 dias", fmtBRL(p.fat_60d)],
        ["Última venda", fmtData(p.ult_venda)],
        ["Func. ativos", fmtInt(p.funcionarios_ativos)],
      ].map(([r, v]) => (
        <div key={r} className="min-w-0">
          <p className="m-0 text-xs text-foreground-suave">{r}</p>
          <p className="m-0 whitespace-nowrap tabular-nums">{v}</p>
        </div>
      ))}
    </div>
  ),
});

/** Lojas com venda sem coligada e coligadas com funcionários ativos sem loja. */
export default function TabelaPendencias({ linhas }: { linhas: Pendencia[] }) {
  return (
    <DataTable
      titulo="Pendências"
      icone={IconeAlerta}
      linhas={linhas}
      colunas={colunas}
      chave={(p) => `${p.tipo}-${p.loja_id ?? p.codcoligada}`}
      paginacao={false}
      cartaoMobile={cartao}
      vazio="Nenhuma pendência: todas as lojas com venda e coligadas com funcionários estão ligadas."
    />
  );
}
