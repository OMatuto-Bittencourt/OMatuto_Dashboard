import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FormLogin from "@/components/FormLogin";
import { IconeUsuario } from "@/components/acesso/ui";
import { usuarioAtual } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar · MTO" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ destino?: string }> }) {
  if (await usuarioAtual()) redirect("/");
  const { destino } = await searchParams;
  const seguro = destino && destino.startsWith("/") && !destino.startsWith("//") ? destino : "/";

  return (
    <>
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-xl bg-brand-red-500/10 lg:size-18">
          <IconeUsuario className="size-7 text-brand-red-700 lg:size-9" />
        </span>
        <h1 className="m-0 font-heading text-[1.75rem] leading-tight text-brand-red-950 lg:text-4xl">Entrar no sistema</h1>
        <p className="mt-2 text-sm text-stone-600 lg:text-base">Use o e-mail cadastrado pela administração.</p>
      </div>
      <FormLogin destino={seguro} />
    </>
  );
}
