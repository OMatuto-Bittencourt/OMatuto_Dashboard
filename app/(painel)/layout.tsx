import { existsSync } from "node:fs";
import path from "node:path";
import Shell from "@/components/painel/Shell";
import type { ItemPendencia } from "@/components/painel/Sino";
import { exigirUsuario } from "@/lib/auth";
import { fmtBRLCurto, fmtInt } from "@/lib/format";
import { pendencias, SCHEMA_PAINEL, type Pendencia } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Ilustração do personagem no pé da barra lateral: PNG com fundo transparente.
// Enquanto o arquivo não existir, a barra lateral mostra só a faixa amarela.
const PERSONAGEM = "/brand/sidebar-personagem.png";

function itemPendencia(p: Pendencia, i: number): ItemPendencia {
  return p.tipo === "LOJA_SEM_COLIGADA"
    ? {
        id: `l${p.loja_id ?? i}`,
        titulo: `Loja sem coligada: ${p.loja_nome ?? "–"}`,
        detalhe: p.fat_60d ? `${fmtBRLCurto(p.fat_60d)} vendidos em 60 dias` : "Sem vendas em 60 dias",
      }
    : {
        id: `c${p.codcoligada ?? i}`,
        titulo: `Coligada sem loja: ${p.codcoligada ?? ""} ${p.coligada_nome ?? ""}`.trim(),
        detalhe: `${fmtInt(p.funcionarios_ativos)} funcionários ativos`,
      };
}

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario();
  // O sino não pode derrubar a página: sem a consulta, mostra "sem pendências".
  const pend = await pendencias().catch(() => [] as Pendencia[]);
  const personagem = existsSync(path.join(process.cwd(), "public", PERSONAGEM)) ? PERSONAGEM : null;

  return (
    <Shell
      usuario={{ nome: u.nome, email: u.email }}
      pendencias={pend.map(itemPendencia)}
      personagem={personagem}
      aviso={
        SCHEMA_PAINEL !== "dashboard" && (
          <div role="status" className="border-b border-amber-300 bg-amber-100 px-4 py-1.5 text-center text-[13px] text-amber-900">
            PREVIEW LOCAL · dados do schema <code>{SCHEMA_PAINEL}</code> (Colibri + 3S) · não é o painel oficial
          </div>
        )
      }
    >
      {children}
    </Shell>
  );
}
