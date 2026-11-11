"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Visão geral" },
  { href: "/vendas", label: "Vendas" },
  { href: "/ligacao", label: "Ligação Colibri × RM" },
  { href: "/modelo", label: "Modelo de dados" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
