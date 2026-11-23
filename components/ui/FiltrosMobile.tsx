"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconeFunil } from "./icones";

/**
 * No mobile, busca e filtros da tabela ficam recolhidos e um botão de funil (que pode ficar em
 * outro lugar da página, ex.: ao lado do seletor de mês) abre/fecha o painel.
 * Sem o Provider, a DataTable mostra os filtros sempre (comportamento padrão).
 */
type Ctx = {
  aberto: boolean;
  alternar: () => void;
  ativos: number;
  setAtivos: (n: number) => void;
  idPainel: string;
};

const FiltrosCtx = createContext<Ctx | null>(null);

export function FiltrosMobileProvider({ children, idPainel = "filtros-tabela" }: { children: ReactNode; idPainel?: string }) {
  const [aberto, setAberto] = useState(false);
  const [ativos, setAtivos] = useState(0);
  const alternar = () =>
    setAberto((a) => {
      if (!a) {
        // abre e leva até o painel, que costuma estar mais abaixo na página
        requestAnimationFrame(() => document.getElementById(idPainel)?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
      return !a;
    });
  return <FiltrosCtx.Provider value={{ aberto, alternar, ativos, setAtivos, idPainel }}>{children}</FiltrosCtx.Provider>;
}

export const useFiltrosMobile = () => useContext(FiltrosCtx);

/** Botão de funil (só aparece no mobile). Mostra quantos filtros estão ativos. */
export function BotaoFiltros({ className }: { className?: string }) {
  const ctx = useFiltrosMobile();
  if (!ctx) return null;
  return (
    <button
      type="button"
      onClick={ctx.alternar}
      aria-expanded={ctx.aberto}
      aria-controls={ctx.idPainel}
      aria-label={ctx.aberto ? "Esconder filtros da tabela" : "Mostrar filtros da tabela"}
      className={cn(
        "relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border p-0 transition md:hidden",
        ctx.aberto || ctx.ativos
          ? "border-brand-red-700 bg-brand-red-700 text-white"
          : "border-brand-red-500/40 bg-brand-red-500/8 text-brand-red-700 dark:text-red-400",
        className,
      )}
    >
      <IconeFunil className="size-5" />
      {ctx.ativos > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brand-earth-400 text-[11px] font-bold text-stone-900">
          {ctx.ativos}
        </span>
      )}
    </button>
  );
}
