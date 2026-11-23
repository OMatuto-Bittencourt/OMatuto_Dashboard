import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconeSetaBaixo, IconeSetaCima, IconeSetaDireita, type Icone } from "./icones";
import Pill from "./Pill";

export type Variacao = {
  /** Variação relativa (0,037 = +3,7%) ou diferença absoluta de uma razão (−0,003 = −0,3 p.p.). */
  valor: number;
  tipo: "percentual" | "pontos";
  /** Define a cor: subir é bom ("alta"), cair é bom ("baixa") ou nenhum dos dois ("neutro", cinza). */
  melhor: "alta" | "baixa" | "neutro";
  /** Texto após o número, ex.: "vs. mês anterior". */
  rotulo?: string;
  /** Tooltip, ex.: "Comparado a set/2026". */
  titulo?: string;
};

const num = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" });

/** Pílula de variação (seta + número), colorida conforme `melhor`. */
export function PilulaVariacao({ valor, tipo, melhor, rotulo, titulo, sobreCor }: Variacao & { sobreCor?: boolean }) {
  const pct = valor * 100;
  const zero = Math.abs(pct) < 0.05;
  const tom = zero || melhor === "neutro" ? "neutro" : (pct > 0) === (melhor === "alta") ? "sucesso" : "perigo";
  const Seta = zero ? undefined : pct > 0 ? IconeSetaCima : IconeSetaBaixo;
  return (
    <Pill tom={tom} variante={sobreCor ? "solida" : "suave"} icone={Seta} title={titulo}>
      {num.format(pct)}
      {tipo === "percentual" ? "%" : " p.p."}
      {rotulo && <span className="font-medium">{rotulo}</span>}
    </Pill>
  );
}

type Props = {
  icone: Icone;
  rotulo: ReactNode;
  valor: ReactNode;
  detalhe?: ReactNode;
  variacao?: Variacao | null;
  acao?: { href: string; texto: string };
  /** Card vermelho da marca, para o indicador principal. */
  destaque?: boolean;
  /** Abaixo de xl, valor à esquerda e ação à direita (card de largura total no mobile). */
  horizontalMobile?: boolean;
  className?: string;
};

/** Card de indicador: ícone + rótulo no topo; valor, detalhe e variação/ação abaixo. */
export default function KpiCard({ icone: I, rotulo, valor, detalhe, variacao, acao, destaque, horizontalMobile, className }: Props) {
  const linkAcao = acao && (
    <Link
      href={acao.href}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-3 hover:no-underline",
        destaque ? "text-white" : "text-brand-red-700 dark:text-red-400",
      )}
    >
      {acao.texto} <IconeSetaDireita className="size-4" />
    </Link>
  );

  return (
    <article
      className={cn(
        "relative flex min-w-0 flex-col overflow-hidden rounded-2xl border p-4 shadow-sm",
        destaque
          ? "border-brand-red-800 bg-linear-to-br from-brand-red-700 via-brand-red-800 to-brand-red-950 text-white shadow-brand-red-900/30"
          : "border-border bg-surface text-foreground dark:shadow-black/30",
        className,
      )}
    >
      {destaque && (
        // Barrinhas decorativas no canto (como no desenho)
        <svg className="pointer-events-none absolute right-3 top-3 h-7 w-9 opacity-90" viewBox="0 0 48 36" aria-hidden>
          <rect x="2" y="22" width="10" height="14" rx="2" fill="var(--color-brand-red-500)" />
          <rect x="18" y="12" width="10" height="24" rx="2" fill="var(--color-brand-earth-500)" />
          <rect x="34" y="2" width="10" height="34" rx="2" fill="var(--color-brand-red-500)" />
        </svg>
      )}

      <div className={cn("flex items-center gap-2.5", destaque && "pr-10")}>
        <span
          className={cn(
            "grid shrink-0 place-items-center",
            destaque ? "size-8 text-brand-earth-400" : "size-10 rounded-xl bg-brand-red-500/10 text-brand-red-700 dark:bg-brand-red-500/15 dark:text-brand-red-500",
          )}
        >
          <I className={destaque ? "size-7" : "size-5"} />
        </span>
        <h3 className={cn("m-0 text-[13px] font-semibold leading-tight", destaque ? "text-white" : "text-foreground")}>{rotulo}</h3>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col pt-2",
          horizontalMobile
            ? "flex-row flex-wrap items-end justify-between gap-2 xl:flex-col xl:items-center xl:text-center"
            : "items-center text-center",
        )}
      >
        <div className={cn("flex flex-col", horizontalMobile ? "items-start xl:items-center" : "items-center")}>
          <p className="m-0 font-heading text-[1.75rem] leading-tight tabular-nums sm:text-3xl">{valor}</p>
          {detalhe && <p className={cn("m-0 text-[13px] leading-snug", destaque ? "text-white/85" : "text-foreground-suave")}>{detalhe}</p>}
        </div>
        {(variacao || acao) && (
          <div className={cn(horizontalMobile ? "xl:mt-auto xl:pt-3" : "mt-auto pt-3")}>
            {variacao && <PilulaVariacao {...variacao} sobreCor={destaque} />}
            {linkAcao}
          </div>
        )}
      </div>
    </article>
  );
}
