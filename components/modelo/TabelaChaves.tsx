"use client";

import type { ReactNode } from "react";
import Codigo from "@/components/ui/Codigo";
import DataTable, { type CartaoMobile, type Coluna } from "@/components/ui/DataTable";
import { IconeLink } from "@/components/ui/icones";

export type Chave = { tabela: string; chave: string; uso: string };

const colunas: Coluna<Chave>[] = [
  { id: "tabela", titulo: "Tabela", ordenar: (c) => c.tabela, celula: (c) => <Codigo quebrar>{c.tabela}</Codigo>, classe: "min-w-60 max-w-72" },
  { id: "chave", titulo: "Chave lógica", celula: (c) => <Codigo quebrar>{c.chave}</Codigo>, classe: "min-w-40 max-w-60" },
  { id: "uso", titulo: "Como usar", celula: (c) => <span className="text-foreground-suave">{c.uso}</span>, classe: "min-w-80" },
];

const cartao = (c: Chave): CartaoMobile => ({
  cabecalho: (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap">
        <Codigo quebrar>{c.tabela}</Codigo>
      </div>
      <p className="m-0 text-xs text-foreground-suave">
        Chave: <Codigo quebrar>{c.chave}</Codigo>
      </p>
    </div>
  ),
  corpo: <p className="m-0 border-t border-border pt-2 text-sm text-foreground-suave">{c.uso}</p>,
});

/** Chaves lógicas de cada tabela de origem e como usá-las nos relacionamentos. */
export default function TabelaChaves({ linhas, nota }: { linhas: Chave[]; nota?: ReactNode }) {
  return (
    <DataTable
      titulo="Chaves de relacionamento"
      icone={IconeLink}
      linhas={linhas}
      colunas={colunas}
      chave={(c) => c.tabela}
      busca={{ placeholder: "Buscar tabela ou chave...", texto: (c) => `${c.tabela} ${c.chave} ${c.uso}` }}
      paginacao={false}
      cartaoMobile={cartao}
      rodape={nota}
    />
  );
}
