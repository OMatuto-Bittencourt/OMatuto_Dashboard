import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Icone } from "./icones";

export type TomPill = "neutro" | "marca" | "primaria" | "sucesso" | "aviso" | "perigo";
export type VariantePill = "suave" | "solida" | "contorno";

// suave = fundo translúcido (funciona no claro e no escuro); solida = fundo cheio (para usar sobre
// superfícies coloridas, ex.: o card vermelho de destaque); contorno = borda + fundo leve (botões).
const ESTILOS: Record<VariantePill, Record<TomPill, string>> = {
  suave: {
    neutro: "bg-stone-500/10 text-stone-700 ring-stone-500/20 dark:text-stone-200",
    marca: "bg-brand-earth-400/20 text-brand-earth-800 ring-brand-earth-400/45 dark:text-brand-earth-400",
    primaria: "bg-brand-red-500/10 text-brand-red-700 ring-brand-red-500/25 dark:text-red-300",
    sucesso: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400",
    aviso: "bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:text-amber-300",
    perigo: "bg-brand-red-500/12 text-brand-red-700 ring-brand-red-500/30 dark:text-red-300",
  },
  solida: {
    neutro: "bg-white/90 text-stone-800 ring-transparent",
    marca: "bg-brand-earth-400 text-stone-900 ring-transparent",
    primaria: "bg-brand-red-700 text-white ring-transparent",
    sucesso: "bg-emerald-100 text-emerald-800 ring-transparent",
    aviso: "bg-amber-100 text-amber-900 ring-transparent",
    perigo: "bg-red-100 text-red-800 ring-transparent",
  },
  contorno: {
    neutro: "bg-surface text-foreground ring-border",
    marca: "bg-brand-earth-400/10 text-brand-earth-800 ring-brand-earth-500/60 dark:text-brand-earth-400",
    primaria: "bg-brand-red-500/6 text-brand-red-700 ring-brand-red-500/45 dark:bg-brand-red-500/10 dark:text-red-300",
    sucesso: "bg-emerald-500/6 text-emerald-700 ring-emerald-500/45 dark:text-emerald-400",
    aviso: "bg-amber-500/6 text-amber-800 ring-amber-500/45 dark:text-amber-300",
    perigo: "bg-brand-red-500/6 text-brand-red-700 ring-brand-red-500/45 dark:text-red-300",
  },
};

const TAMANHOS = {
  sm: "gap-1.5 px-2 py-0.5 text-[13px]",
  md: "gap-2 px-3.5 py-1.5 text-sm",
  lg: "gap-2 px-4 h-10 text-sm",
} as const;

type Props = {
  tom?: TomPill;
  variante?: VariantePill;
  tamanho?: keyof typeof TAMANHOS;
  /** Bolinha de status antes do texto. */
  ponto?: boolean;
  icone?: Icone;
  /** Com href, a pílula vira link (com foco e hover). */
  href?: string;
  title?: string;
  className?: string;
  children: ReactNode;
};

/** Pílula: etiqueta arredondada para status, categorias, variações e botões curtos. */
export default function Pill({ tom = "neutro", variante = "suave", tamanho = "sm", ponto, icone: I, href, title, className, children }: Props) {
  const classes = cn(
    "inline-flex items-center whitespace-nowrap rounded-full font-semibold ring-1 ring-inset tabular-nums",
    TAMANHOS[tamanho],
    ESTILOS[variante][tom],
    href && "no-underline transition hover:brightness-95 hover:no-underline focus-visible:outline-none focus-visible:ring-2 dark:hover:brightness-125",
    className,
  );
  const conteudo = (
    <>
      {ponto && <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />}
      {I && <I className={tamanho === "sm" ? "size-3.5" : "size-4.5"} />}
      {children}
    </>
  );
  return href ? (
    <Link href={href} title={title} className={classes}>
      {conteudo}
    </Link>
  ) : (
    <span title={title} className={classes}>
      {conteudo}
    </span>
  );
}
