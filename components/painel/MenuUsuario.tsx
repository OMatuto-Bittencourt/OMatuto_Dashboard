import Link from "next/link";
import { sair } from "@/app/acoes-auth";
import { IconeCadeado, IconeChevronBaixo, IconeSair, IconeUsuario } from "@/components/ui/icones";

export type UsuarioResumo = { nome: string | null; email: string };

/** Itens do menu da conta (usados no dropdown do desktop e na gaveta do mobile). */
export function ItensConta({ email }: { email: string }) {
  return (
    <>
      <p className="m-0 truncate px-3 py-2 text-xs text-muted-foreground">{email}</p>
      <Link href="/trocar-senha" className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground no-underline hover:bg-surface-muted hover:no-underline">
        <IconeCadeado className="size-4" /> Trocar senha
      </Link>
      <form action={sair}>
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-3 py-2 text-left text-sm text-brand-red-700 hover:bg-brand-red-500/8 dark:text-red-300"
        >
          <IconeSair className="size-4" /> Sair
        </button>
      </form>
    </>
  );
}

/** Pílula com o nome do usuário e menu suspenso (desktop). Funciona sem JavaScript (<details>). */
export default function MenuUsuario({ usuario }: { usuario: UsuarioResumo }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/50 px-3.5 py-1.5 text-[15px] font-medium text-white hover:bg-white/10 [&::-webkit-details-marker]:hidden">
        <IconeUsuario className="size-5" />
        <span className="max-w-44 truncate">{usuario.nome ?? usuario.email}</span>
        <IconeChevronBaixo className="size-4 transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-[calc(100%+8px)] z-40 grid min-w-60 gap-1 rounded-xl border border-border bg-surface p-2 text-sm shadow-xl dark:shadow-black/50">
        <ItensConta email={usuario.email} />
      </div>
    </details>
  );
}
