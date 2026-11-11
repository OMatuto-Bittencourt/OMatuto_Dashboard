import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import { sair } from "@/app/acoes-auth";
import { exigirUsuario } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario();
  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Início">
          <Image src="/brand/mto.webp" alt="MTO Administração de Franquias" width={94} height={40} priority />
        </Link>
        <Nav />
        <details className="conta">
          <summary>{u.nome ?? u.email}</summary>
          <div className="conta-menu">
            <div className="muted small">{u.email}</div>
            <Link href="/trocar-senha">Trocar senha</Link>
            <form action={sair}>
              <button type="submit">Sair</button>
            </form>
          </div>
        </details>
      </header>
      <main>{children}</main>
    </>
  );
}
