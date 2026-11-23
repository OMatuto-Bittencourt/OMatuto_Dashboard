"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconeLinkQuebrado, IconeSino } from "@/components/ui/icones";

export type ItemPendencia = { id: string; titulo: string; detalhe: string };

/** Sino da barra superior: lista as pendências de ligação Colibri × RM. Ponto amarelo = há pendência. */
export default function Sino({ itens }: { itens: ItemPendencia[] }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => !caixa.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const n = itens.length;
  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-label={n ? `Pendências: ${n}` : "Sem pendências"}
        className="relative grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-white transition hover:bg-white/12"
      >
        <IconeSino className="size-5.5" />
        {n > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full bg-brand-earth-400 ring-2 ring-brand-red-800" aria-hidden />}
      </button>
      {aberto && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-surface text-sm text-foreground shadow-xl dark:shadow-black/50">
          <p className="m-0 border-b border-border px-4 py-3 font-semibold">Pendências de ligação Colibri × RM</p>
          {n === 0 ? (
            <p className="m-0 px-4 py-6 text-center text-muted-foreground">Nenhuma pendência. Tudo ligado.</p>
          ) : (
            <ul className="m-0 max-h-80 list-none overflow-y-auto p-1.5">
              {itens.slice(0, 8).map((p) => (
                <li key={p.id} className="flex gap-3 rounded-lg px-2.5 py-2">
                  <IconeLinkQuebrado className="mt-0.5 size-4.5 shrink-0 text-brand-red-700 dark:text-red-400" />
                  <div className="min-w-0">
                    <p className="m-0 truncate font-medium">{p.titulo}</p>
                    <p className="m-0 text-xs text-muted-foreground">{p.detalhe}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/ligacao"
            onClick={() => setAberto(false)}
            className="block border-t border-border px-4 py-2.5 text-center font-semibold text-brand-red-700 no-underline hover:bg-surface-muted hover:no-underline dark:text-red-300"
          >
            {n > 8 ? `Ver todas (${n})` : "Abrir Ligação Colibri + RM"}
          </Link>
        </div>
      )}
    </div>
  );
}
