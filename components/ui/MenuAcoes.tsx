"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconeMaisVertical, type Icone } from "./icones";

export type Acao = { rotulo: string; href: string; icone?: Icone };

/**
 * Botão "⋮" com menu de ações. O menu é desenhado em <body> com posição fixa, para não ser
 * cortado por containers com rolagem (ex.: a tabela com scroll horizontal).
 */
export default function MenuAcoes({ acoes, rotulo = "Ações" }: { acoes: Acao[]; rotulo?: string }) {
  const botao = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const abrir = () => {
    const r = botao.current!.getBoundingClientRect();
    setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
  };
  const fechar = () => setPos(null);

  useEffect(() => {
    if (!pos) return;
    const fora = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node) && !botao.current?.contains(e.target as Node)) fechar();
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        fechar();
        botao.current?.focus();
      }
    };
    menu.current?.querySelector<HTMLElement>("a")?.focus();
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    window.addEventListener("scroll", fechar, true);
    window.addEventListener("resize", fechar);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("scroll", fechar, true);
      window.removeEventListener("resize", fechar);
    };
  }, [pos]);

  return (
    <>
      <button
        ref={botao}
        type="button"
        onClick={() => (pos ? fechar() : abrir())}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        aria-label={rotulo}
        className="grid size-8 cursor-pointer place-items-center rounded-lg border-0 bg-transparent p-0 text-foreground-suave hover:bg-surface-muted hover:text-foreground"
      >
        <IconeMaisVertical className="size-4.5" />
      </button>
      {pos &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-50 grid min-w-52 gap-0.5 rounded-xl border border-border bg-surface p-1.5 text-sm shadow-lg dark:shadow-black/50"
          >
            {acoes.map(({ rotulo: r, href, icone: I }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={fechar}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground no-underline hover:bg-surface-muted hover:no-underline focus:bg-surface-muted focus:outline-none"
              >
                {I && <I className="size-4 text-foreground-suave" />}
                {r}
              </Link>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
