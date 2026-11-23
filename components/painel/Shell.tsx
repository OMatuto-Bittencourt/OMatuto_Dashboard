"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import BotaoTema from "@/components/ui/BotaoTema";
import { IconeFechar, IconeMenu } from "@/components/ui/icones";
import { cn } from "@/lib/cn";
import MenuUsuario, { ItensConta, type UsuarioResumo } from "./MenuUsuario";
import Nav from "./Nav";
import Sino, { type ItemPendencia } from "./Sino";

const LOGO = "/brand/logo-topo.png"; // 2172×724

type Props = {
  usuario: UsuarioResumo;
  pendencias: ItemPendencia[];
  /** Ilustração do personagem no pé da barra lateral (null = arquivo ainda não enviado). */
  personagem: string | null;
  aviso?: ReactNode;
  children: ReactNode;
};

const Logo = ({ className }: { className?: string }) => (
  <Link href="/" aria-label="Início" className={cn("block", className)}>
    <Image src={LOGO} alt="O Matuto Churrascaria Expressa" width={2172} height={724} priority className="h-auto w-full" />
  </Link>
);

/** Conteúdo da barra lateral (fixa no desktop, gaveta no mobile). */
function Lateral({ personagem, aoNavegar, children }: { personagem: string | null; aoNavegar?: () => void; children?: ReactNode }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-linear-to-b from-brand-red-700 via-brand-red-800 to-brand-red-900 px-4 pb-4 pt-6 text-white">
      <Logo className="mx-auto w-44" />
      <div className="mt-8">
        <Nav aoNavegar={aoNavegar} />
      </div>
      {children}
      <div className="relative mt-auto h-72 shrink-0" aria-hidden>
        {/* Faixa amarela curva sob o personagem */}
        <svg className="absolute inset-x-[-1rem] bottom-[-1rem] h-40 w-[calc(100%+2rem)]" viewBox="0 0 232 160" preserveAspectRatio="none">
          <path d="M0 96C58 150 150 160 232 96V122C150 182 54 176 0 128Z" fill="var(--color-brand-earth-400)" />
        </svg>
        {personagem && (
          <Image src={personagem} alt="" fill sizes="232px" className="object-contain object-[left_bottom]" />
        )}
      </div>
    </div>
  );
}

export default function Shell({ usuario, pendencias, personagem, aviso, children }: Props) {
  const [gaveta, setGaveta] = useState(false);
  const path = usePathname();

  // Fecha a gaveta ao trocar de página e trava a rolagem do fundo enquanto ela está aberta.
  useEffect(() => setGaveta(false), [path]);
  useEffect(() => {
    document.body.style.overflow = gaveta ? "hidden" : "";
    if (!gaveta) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setGaveta(false);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [gaveta]);

  return (
    <div className="min-h-dvh bg-background font-interface text-foreground lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      {/* ---------- Barra lateral (desktop) ---------- */}
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <Lateral personagem={personagem} />
      </aside>

      {/* ---------- Gaveta (mobile) ---------- */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", !gaveta && "pointer-events-none")} inert={!gaveta}>
        <div className={cn("absolute inset-0 bg-black/50 transition-opacity", gaveta ? "opacity-100" : "opacity-0")} onClick={() => setGaveta(false)} />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn("absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl transition-transform", gaveta ? "translate-x-0" : "-translate-x-full")}
        >
          <Lateral personagem={personagem} aoNavegar={() => setGaveta(false)}>
            <div className="mt-6 grid gap-1 rounded-xl bg-surface p-2 text-sm text-foreground">
              <div className="flex items-center justify-between gap-2 px-3 pt-1">
                <span className="truncate font-semibold">{usuario.nome ?? usuario.email}</span>
                <BotaoTema className="text-foreground hover:bg-surface-muted" />
              </div>
              <ItensConta email={usuario.email} />
            </div>
          </Lateral>
          <button
            type="button"
            onClick={() => setGaveta(false)}
            aria-label="Fechar menu"
            className="absolute right-2 top-2 grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-black/20 p-0 text-white"
          >
            <IconeFechar className="size-5" />
          </button>
        </div>
      </div>

      <div className="min-w-0">
        {aviso}

        {/* ---------- Barra superior (desktop) ---------- */}
        <header className="relative hidden h-14 items-center justify-end gap-2 bg-linear-to-r from-brand-red-900 via-brand-red-800 to-brand-red-900 px-6 lg:flex">
          <svg className="pointer-events-none absolute left-0 top-0 h-full w-48" viewBox="0 0 192 56" preserveAspectRatio="none" aria-hidden>
            <path d="M0 56C18 22 70 4 150 0H192C104 6 40 26 22 56Z" fill="var(--color-brand-earth-400)" />
          </svg>
          <Sino itens={pendencias} />
          <BotaoTema />
          <div className="ml-2">
            <MenuUsuario usuario={usuario} />
          </div>
        </header>

        {/* ---------- Cabeçalho (mobile) ---------- */}
        <header className="relative bg-linear-to-b from-brand-red-800 to-brand-red-900 pb-5 text-white lg:hidden">
          <div className="flex h-16 items-center justify-between px-3">
            <button
              type="button"
              onClick={() => setGaveta(true)}
              aria-label="Abrir menu"
              aria-expanded={gaveta}
              className="grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-white hover:bg-white/12"
            >
              <IconeMenu className="size-6" />
            </button>
            <Logo className="w-36" />
            <Sino itens={pendencias} />
          </div>
          {/* Borda curva com a faixa amarela */}
          <svg className="absolute inset-x-0 -bottom-px h-6 w-full" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden>
            <path d="M0 8C140 22 280 20 400 0V12C280 30 140 30 0 18Z" fill="var(--color-brand-earth-400)" />
            <path d="M0 18C140 30 280 30 400 12V24H0Z" fill="var(--bg)" />
          </svg>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-5 lg:px-6 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
