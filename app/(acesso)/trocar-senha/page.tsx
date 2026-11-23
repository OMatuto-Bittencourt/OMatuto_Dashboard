import type { Metadata } from "next";
import Link from "next/link";
import FormTrocaSenha from "@/components/FormTrocaSenha";
import { IconeCadeado } from "@/components/acesso/ui";
import { exigirUsuario } from "@/lib/auth";

export const metadata: Metadata = { title: "Trocar senha · MTO" };
export const dynamic = "force-dynamic";

export default async function TrocarSenhaPage() {
  const u = await exigirUsuario({ permitirTrocaPendente: true });
  return (
    <>
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-xl bg-brand-red-500/10 lg:size-18">
          <IconeCadeado className="size-7 text-brand-red-700 lg:size-9" />
        </span>
        <h1 className="m-0 font-heading text-[1.75rem] leading-tight text-brand-red-950 lg:text-4xl">
          {u.trocar_senha ? "Crie sua senha" : "Trocar senha"}
        </h1>
        <p className="mt-2 text-sm text-stone-600 lg:text-base">
          {u.trocar_senha ? "Este é o seu primeiro acesso. Defina uma senha pessoal para continuar." : `Conectado como ${u.email}.`}
        </p>
      </div>
      <FormTrocaSenha />
      {!u.trocar_senha && (
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="font-semibold text-brand-red-700 hover:text-brand-red-900">
            Voltar ao painel
          </Link>
        </p>
      )}
    </>
  );
}
