import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconeAlerta, IconeInfo, IconeSucesso, type Icone } from "./icones";

export type VarianteAlerta = "aviso" | "perigo" | "sucesso" | "info";

const VARIANTES: Record<VarianteAlerta, { caixa: string; icone: string; Icone: Icone }> = {
  aviso: {
    caixa: "border-brand-earth-400/55 bg-brand-earth-400/12 dark:border-brand-earth-400/45 dark:bg-brand-earth-400/8",
    icone: "text-brand-earth-600 dark:text-brand-earth-400",
    Icone: IconeInfo,
  },
  perigo: {
    caixa: "border-brand-red-500/30 bg-brand-red-500/8 dark:bg-brand-red-500/12",
    icone: "text-brand-red-700 dark:text-red-400",
    Icone: IconeAlerta,
  },
  sucesso: { caixa: "border-emerald-500/35 bg-emerald-500/8", icone: "text-emerald-600 dark:text-emerald-400", Icone: IconeSucesso },
  info: { caixa: "border-border bg-surface", icone: "text-muted-foreground", Icone: IconeInfo },
};

/** Faixa de aviso. `titulo` sai em negrito antes do texto. */
export default function Alert({
  variante = "aviso",
  titulo,
  children,
  className,
}: {
  variante?: VarianteAlerta;
  titulo?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const v = VARIANTES[variante];
  return (
    <div
      role={variante === "perigo" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border px-4 py-3 text-[13px] leading-snug text-foreground", v.caixa, className)}
    >
      <v.Icone className={cn("mt-px size-5 shrink-0", v.icone)} />
      <p className="m-0">
        {titulo && <b className="font-semibold">{titulo} </b>}
        {children}
      </p>
    </div>
  );
}
