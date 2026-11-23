import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { IconeChevronBaixo, type Icone } from "./icones";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { icone?: Icone; classeCaixa?: string };

/** <select> nativo (acessível, funciona no celular) com o visual do painel e ícone opcional à esquerda. */
export default function Select({ icone: I, classeCaixa, className, children, ...props }: Props) {
  return (
    <div className={cn("relative inline-flex", classeCaixa)}>
      {I && <I className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />}
      <select
        {...props}
        className={cn(
          "h-10 w-full cursor-pointer appearance-none rounded-full border border-border bg-surface pr-9 text-sm font-semibold text-foreground shadow-xs",
          "transition hover:border-stone-400 focus:border-brand-red-700 focus:outline-none focus:ring-3 focus:ring-brand-red-500/15 dark:hover:border-stone-500",
          I ? "pl-10" : "pl-4",
          className,
        )}
      >
        {children}
      </select>
      <IconeChevronBaixo className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground-suave" />
    </div>
  );
}
