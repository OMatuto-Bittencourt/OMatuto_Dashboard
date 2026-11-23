import { cn } from "@/lib/cn";

/** Número com barrinha horizontal ao lado (células de tabela e cards). `fracao` vai de 0 a 1. */
export default function BarraPercentual({ texto, fracao, larga }: { texto: string; fracao: number | null; larga?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", larga ? "w-full" : "justify-end")}>
      <span className="tabular-nums">{texto}</span>
      <span className={cn("h-2 overflow-hidden rounded-full bg-stone-500/15", larga ? "flex-1" : "w-12 2xl:w-16")} aria-hidden>
        {fracao !== null && (
          <span
            className="block h-full rounded-full bg-linear-to-r from-brand-red-700 to-brand-red-500"
            style={{ width: `${Math.min(Math.max(fracao, 0), 1) * 100}%` }}
          />
        )}
      </span>
    </span>
  );
}
