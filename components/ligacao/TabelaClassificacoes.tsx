"use client";

import Codigo from "@/components/ui/Codigo";
import DataTable, { type CartaoMobile, type Coluna, type Filtro } from "@/components/ui/DataTable";
import { IconeBanco } from "@/components/ui/icones";
import Pill, { type TomPill } from "@/components/ui/Pill";
import type { Classificacao } from "@/lib/queries";

// Tipos gravados no banco em MAIÚSCULAS_COM_SUBLINHADO; na tela, texto legível.
const ROTULOS: Record<string, string> = { CORPORATIVO: "Corporativo", SEM_OPERACAO: "Sem operação" };
const rotuloTipo = (t: string) => ROTULOS[t] ?? t.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
const tomTipo = (t: string): TomPill => (t === "SEM_OPERACAO" ? "aviso" : "neutro");
const PillTipo = ({ tipo }: { tipo: string }) => (
  <Pill tom={tomTipo(tipo)} title={tipo}>
    {rotuloTipo(tipo)}
  </Pill>
);

const colunas: Coluna<Classificacao>[] = [
  { id: "coligada", titulo: "Coligada", alinhar: "centro", ordenar: (c) => c.codcoligada, celula: (c) => <Pill tom="neutro">{c.codcoligada}</Pill> },
  { id: "razao", titulo: "Razão social", ordenar: (c) => c.nome, celula: (c) => <span className="font-medium">{c.nome ?? "–"}</span>, classe: "min-w-56" },
  { id: "tipo", titulo: "Tipo", ordenar: (c) => c.tipo, celula: (c) => <PillTipo tipo={c.tipo} /> },
  { id: "obs", titulo: "Observação", celula: (c) => <span className="text-xs text-foreground-suave">{c.observacao ?? ""}</span>, classe: "min-w-56" },
];

function filtros(linhas: Classificacao[]): Filtro<Classificacao>[] {
  const tipos = [...new Set(linhas.map((c) => c.tipo))].sort();
  return [{ id: "tipo", rotulo: "Tipo", opcoes: tipos.map((t) => ({ valor: t, rotulo: rotuloTipo(t) })), aplicar: (c, v) => c.tipo === v }];
}

const cartao = (c: Classificacao): CartaoMobile => ({
  cabecalho: (
    <div className="flex items-start justify-between gap-2">
      <p className="m-0 font-semibold">
        <span className="text-foreground-suave">{c.codcoligada} · </span>
        {c.nome ?? "–"}
      </p>
      <PillTipo tipo={c.tipo} />
    </div>
  ),
  corpo: c.observacao ? <p className="m-0 border-t border-border pt-2 text-xs text-foreground-suave">{c.observacao}</p> : undefined,
});

/** Coligadas que não são loja (corporativo, sem operação): ficam fora das pendências. */
export default function TabelaClassificacoes({ linhas }: { linhas: Classificacao[] }) {
  return (
    <DataTable
      titulo="Coligadas classificadas fora de loja"
      icone={IconeBanco}
      linhas={linhas}
      colunas={colunas}
      chave={(c) => String(c.codcoligada)}
      filtros={filtros(linhas)}
      ordemInicial={{ coluna: "coligada", direcao: "asc" }}
      paginacao={false}
      cartaoMobile={cartao}
      vazio="Nenhuma coligada classificada fora de loja."
      rodape={
        <>
          Tabela <Codigo>dashboard.coligada_classificacao</Codigo>: coligadas aqui não aparecem como pendência.
        </>
      }
    />
  );
}
