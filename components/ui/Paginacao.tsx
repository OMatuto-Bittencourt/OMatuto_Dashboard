"use client";

import { cn } from "@/lib/cn";
import { IconeChevronDireita, IconeChevronEsquerda, IconeChevronsDireita, IconeChevronsEsquerda, type Icone } from "./icones";

/** Até `max` números de página, centrados na atual. */
function janela(atual: number, total: number, max: number): number[] {
  const tam = Math.min(max, total);
  const ini = Math.min(Math.max(atual - Math.floor(max / 2), 1), total - tam + 1);
  return Array.from({ length: tam }, (_, i) => ini + i);
}

// Números de página visíveis: 5 a partir de md, 3 no mobile (para caber numa linha com as 4 setas).
const MAX_DESKTOP = 5;
const MAX_MOBILE = 3;

const base =
  "grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border px-2 text-sm font-semibold transition " +
  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-red-500/20 disabled:cursor-not-allowed disabled:opacity-40";
const normal = "border-border bg-surface text-foreground hover:bg-surface-muted";

export default function Paginacao({ pagina, total, aoMudar }: { pagina: number; total: number; aoMudar: (p: number) => void }) {
  if (total <= 1) return null;
  const Botao = ({ para, rotulo, I }: { para: number; rotulo: string; I: Icone }) => (
    <button type="button" className={cn(base, normal)} onClick={() => aoMudar(para)} disabled={para === pagina} aria-label={rotulo}>
      <I className="size-4" />
    </button>
  );
  const noMobile = new Set(janela(pagina, total, MAX_MOBILE));
  return (
    <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Paginação">
      <Botao para={1} rotulo="Primeira página" I={IconeChevronsEsquerda} />
      <Botao para={Math.max(pagina - 1, 1)} rotulo="Página anterior" I={IconeChevronEsquerda} />
      {janela(pagina, total, MAX_DESKTOP).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => aoMudar(p)}
          aria-current={p === pagina ? "page" : undefined}
          className={cn(
            base,
            p === pagina ? "border-brand-red-700 bg-brand-red-700 text-white shadow-sm shadow-brand-red-900/30" : normal,
            !noMobile.has(p) && "max-md:hidden",
          )}
        >
          {p}
        </button>
      ))}
      <Botao para={Math.min(pagina + 1, total)} rotulo="Próxima página" I={IconeChevronDireita} />
      <Botao para={total} rotulo="Última página" I={IconeChevronsDireita} />
    </nav>
  );
}
