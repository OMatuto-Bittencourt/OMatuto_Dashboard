"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { CHAVE_TEMA } from "@/lib/tema";
import { IconeLua, IconeSol } from "./icones";

type Tema = "light" | "dark";

/** Alterna claro/escuro. A escolha fica lembrada neste navegador; sem escolha, segue o sistema. */
export default function BotaoTema({ className }: { className?: string }) {
  const [tema, setTema] = useState<Tema | null>(null); // null até hidratar (o servidor não sabe o tema)

  useEffect(() => {
    setTema(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const alternar = () => {
    const novo: Tema = tema === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = novo;
    try {
      localStorage.setItem(CHAVE_TEMA, novo);
    } catch {
      /* sem storage: vale só nesta visita */
    }
    setTema(novo);
  };

  const escuro = tema === "dark";
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
      className={cn(
        "grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-white transition hover:bg-white/12",
        className,
      )}
    >
      {tema === null ? <span className="size-5" /> : escuro ? <IconeSol className="size-5" /> : <IconeLua className="size-5" />}
    </button>
  );
}
