"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Select from "@/components/ui/Select";
import { IconeCalendario, IconeLoja, type Icone } from "@/components/ui/icones";

type Props = {
  meses: string[];
  atual: string;
  rotulos: Record<string, string>;
  base?: string;
  lojas?: { loja_id: string; nome: string }[];
  lojaAtual?: string;
};

/** Pílula com ícone + rótulo e um select dentro (o rótulo some no mobile para caber). */
function Campo({ icone: I, rotulo, children }: { icone: Icone; rotulo: string; children: ReactNode }) {
  return (
    <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-surface pl-3.5 pr-1 shadow-xs sm:flex-none">
      <I className="size-5 shrink-0 text-foreground-suave" />
      <span className="text-sm text-foreground-suave max-sm:sr-only">{rotulo}</span>
      {children}
    </label>
  );
}

/** Seletores de mês (e loja, opcional) que navegam trocando ?mes= e ?loja= na URL. */
export default function MonthSelect({ meses, atual, rotulos, base = "/", lojas, lojaAtual }: Props) {
  const router = useRouter();
  const ir = (mes: string, loja?: string) => {
    const q = new URLSearchParams({ mes });
    if (loja) q.set("loja", loja);
    router.push(`${base}?${q.toString()}`);
  };
  return (
    <>
      <Campo icone={IconeCalendario} rotulo="Mês">
        <Select value={atual} onChange={(e) => ir(e.target.value, lojaAtual)} classeCaixa="min-w-0 flex-1 sm:w-44" className="h-9 shadow-none">
          {meses.map((m) => (
            <option key={m} value={m}>
              {rotulos[m]}
            </option>
          ))}
        </Select>
      </Campo>
      {lojas && (
        <Campo icone={IconeLoja} rotulo="Loja">
          <Select
            value={lojaAtual ?? ""}
            onChange={(e) => ir(atual, e.target.value || undefined)}
            classeCaixa="min-w-0 flex-1 sm:w-52"
            className="h-9 shadow-none"
          >
            <option value="">Todas as lojas</option>
            {lojas.map((l) => (
              <option key={l.loja_id} value={l.loja_id}>
                {l.nome}
              </option>
            ))}
          </Select>
        </Campo>
      )}
    </>
  );
}
