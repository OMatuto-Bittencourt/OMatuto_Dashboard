"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconeBanco, IconeBicicleta, IconeCasa, IconeLink, IconeSinal } from "@/components/ui/icones";

export const LINKS = [
  { href: "/", rotulo: "Visão geral", Icone: IconeCasa },
  { href: "/vendas", rotulo: "Vendas", Icone: IconeSinal },
  { href: "/delivery", rotulo: "Delivery", Icone: IconeBicicleta },
  { href: "/ligacao", rotulo: "Ligação Colibri + RM", Icone: IconeLink },
  { href: "/modelo", rotulo: "Modelo de dados", Icone: IconeBanco },
];

/** Menu principal vertical (barra lateral e gaveta do mobile). */
export default function Nav({ aoNavegar }: { aoNavegar?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Principal" className="grid gap-1.5">
      {LINKS.map(({ href, rotulo, Icone }) => {
        const ativo = path === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={aoNavegar}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium no-underline transition hover:no-underline",
              ativo
                ? "bg-linear-to-r from-brand-red-600 to-brand-red-700 font-semibold text-white shadow-md shadow-black/20 ring-1 ring-brand-earth-400/80"
                : "text-white/90 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icone className="size-5.5 shrink-0" />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
