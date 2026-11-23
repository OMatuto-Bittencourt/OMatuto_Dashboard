import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Icone } from "./icones";

type Props = {
  titulo?: ReactNode;
  icone?: Icone;
  /** Controles à direita do título (filtros, botões). Quebram para baixo em telas estreitas. */
  acoes?: ReactNode;
  rodape?: ReactNode;
  /** Detalhe amarelo curvo no canto superior direito (usado nos cards de gráfico). */
  cantoDestaque?: boolean;
  className?: string;
  children: ReactNode;
};

/** Caixa padrão do painel, com título opcional (ícone + texto) e área de ações. */
export default function Card({ titulo, icone: I, acoes, rodape, cantoDestaque, className, children }: Props) {
  return (
    <section
      className={cn(
        "relative min-w-0 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5 dark:shadow-black/30",
        className,
      )}
    >
      {cantoDestaque && (
        <svg className="pointer-events-none absolute right-0 top-0 h-14 w-28 sm:h-16 sm:w-36" viewBox="0 0 144 64" preserveAspectRatio="none" aria-hidden>
          <path d="M44 0H144V64C128 30 96 8 44 0Z" fill="var(--color-brand-earth-400)" />
        </svg>
      )}
      {(titulo || acoes) && (
        <header className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
          {titulo && (
            <h2 className="m-0 flex items-center gap-2.5 font-heading text-xl leading-tight text-brand-red-900 sm:text-[1.375rem] dark:text-white">
              {I && <I className="size-6 shrink-0 text-brand-red-700 dark:text-brand-red-500" />}
              {titulo}
            </h2>
          )}
          {acoes && <div className="flex flex-wrap items-center gap-2 max-md:w-full">{acoes}</div>}
        </header>
      )}
      {children}
      {rodape && <div className="mt-3 text-[13px] italic text-muted-foreground">{rodape}</div>}
    </section>
  );
}
