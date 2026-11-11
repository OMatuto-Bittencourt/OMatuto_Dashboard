import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FormLogin from "@/components/FormLogin";
import { usuarioAtual } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar · MTO" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ destino?: string }> }) {
  if (await usuarioAtual()) redirect("/");
  const { destino } = await searchParams;
  const seguro = destino && destino.startsWith("/") && !destino.startsWith("//") ? destino : "/";

  return (
    <div className="acesso-caixa">
      <h1>Entrar</h1>
      <p className="sub">Use o e-mail cadastrado pela administração.</p>
      <FormLogin destino={seguro} />
      <p className="acesso-rodape">Esqueceu a senha? Fale com o administrador do painel.</p>
    </div>
  );
}
