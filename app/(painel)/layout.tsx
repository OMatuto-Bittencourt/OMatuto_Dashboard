import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import { sair } from "@/app/acoes-auth";
import { ehAdmin, exigirUsuario } from "@/lib/auth";
import { SCHEMA_PAINEL } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario();
  return (
    <>
      {SCHEMA_PAINEL !== "dashboard" && (
        <div
          role="status"
          style={{ background: "#fff4d6", color: "#7a5200", borderBottom: "1px solid #f0d58a", padding: "6px 16px", fontSize: 13, textAlign: "center" }}
        >
          PREVIEW LOCAL · dados do schema <code>{SCHEMA_PAINEL}</code> (Colibri + 3S) · não é o painel oficial
        </div>
      )}
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Início">
          <Image src="/brand/mto.webp" alt="MTO Administração de Franquias" width={94} height={40} priority />
        </Link>
        <Nav admin={ehAdmin(u)} />
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
