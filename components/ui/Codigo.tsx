import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Nome técnico em linha (tabela, coluna, id): fonte monoespaçada com fundo discreto.
 * `quebrar` permite quebrar linha em valores longos (ex.: listas de tabelas ou chaves compostas).
 */
export default function Codigo({ children, quebrar }: { children: ReactNode; quebrar?: boolean }) {
  return (
    <code
      className={cn(
        "rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground ring-1 ring-inset ring-border",
        quebrar ? "box-decoration-clone wrap-anywhere" : "whitespace-nowrap",
      )}
    >
      {children}
    </code>
  );
}
