import type { Metadata } from "next";
import Link from "next/link";
import FormTrocaSenha from "@/components/FormTrocaSenha";
import { exigirUsuario } from "@/lib/auth";

export const metadata: Metadata = { title: "Trocar senha · MTO" };
export const dynamic = "force-dynamic";

export default async function TrocarSenhaPage() {
  const u = await exigirUsuario({ permitirTrocaPendente: true });
  return (
    <div className="acesso-caixa">
      <h1>{u.trocar_senha ? "Crie sua senha" : "Trocar senha"}</h1>
      <p className="sub">
        {u.trocar_senha
          ? "Este é o seu primeiro acesso. Defina uma senha pessoal para continuar."
          : `Conectado como ${u.email}.`}
      </p>
      <FormTrocaSenha />
      {!u.trocar_senha && (
        <p className="acesso-rodape">
          <Link href="/">Voltar ao painel</Link>
        </p>
      )}
    </div>
  );
}
