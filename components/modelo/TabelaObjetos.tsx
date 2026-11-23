"use client";

import Codigo from "@/components/ui/Codigo";
import DataTable, { type CartaoMobile, type Coluna, type Filtro } from "@/components/ui/DataTable";
import { IconeCartao, IconeGraficoBarras, IconeLoja, IconeUsuarios, type Icone } from "@/components/ui/icones";
import Pill from "@/components/ui/Pill";
import { fmtInt } from "@/lib/format";
import type { Tabela } from "@/lib/queries";

/** Sistema de origem do schema (define o ícone do card). */
export type Sistema = "colibri" | "rm" | "3s" | "painel";
const ICONES: Record<Sistema, Icone> = { colibri: IconeLoja, rm: IconeUsuarios, "3s": IconeCartao, painel: IconeGraficoBarras };

const PillTipo = ({ t }: { t: Tabela }) => <Pill tom={t.tipo === "view" ? "marca" : "neutro"}>{t.tipo}</Pill>;
const linhas = (t: Tabela) => (t.tipo === "view" ? "–" : fmtInt(t.linhas));
const Pk = ({ t }: { t: Tabela }) =>
  t.pk ? <Codigo>{t.pk}</Codigo> : t.tipo === "view" ? <>–</> : <Pill tom="aviso">sem PK</Pill>;
// FKs chegam como "col -> schema.tabela; col2 -> ..." — uma por linha.
const Fks = ({ t }: { t: Tabela }) =>
  t.fks ? (
    <div className="grid justify-items-start gap-1">
      {t.fks.split(/;\s*/).map((fk) => (
        <Codigo key={fk}>{fk}</Codigo>
      ))}
    </div>
  ) : (
    <span className="text-muted-foreground">–</span>
  );

const colunas: Coluna<Tabela>[] = [
  { id: "objeto", titulo: "Objeto", ordenar: (t) => t.tabela, celula: (t) => <Codigo>{t.tabela}</Codigo> },
  { id: "tipo", titulo: "Tipo", ordenar: (t) => t.tipo, celula: (t) => <PillTipo t={t} /> },
  { id: "linhas", titulo: "Linhas (estim.)", alinhar: "direita", ordenar: (t) => (t.tipo === "view" ? null : t.linhas), celula: linhas },
  { id: "colunas", titulo: "Colunas", alinhar: "direita", ordenar: (t) => t.colunas, celula: (t) => fmtInt(t.colunas) },
  { id: "pk", titulo: "Chave primária", ordenar: (t) => t.pk, celula: (t) => <Pk t={t} /> },
  { id: "fks", titulo: "Chaves estrangeiras", celula: (t) => <Fks t={t} /> },
  { id: "desc", titulo: "Descrição", celula: (t) => <span className="text-xs text-foreground-suave">{t.comentario ?? ""}</span>, classe: "min-w-64" },
];

const filtros: Filtro<Tabela>[] = [
  {
    id: "tipo",
    rotulo: "Tipo",
    opcoes: [
      { valor: "tabela", rotulo: "Tabelas" },
      { valor: "view", rotulo: "Views" },
    ],
    aplicar: (t, v) => t.tipo === v,
  },
];

const cartao = (t: Tabela): CartaoMobile => ({
  cabecalho: (
    <div className="flex items-start justify-between gap-2">
      <Codigo>{t.tabela}</Codigo>
      <PillTipo t={t} />
    </div>
  ),
  corpo: (
    <div className="grid gap-2 border-t border-border pt-3 text-sm">
      <div className="flex justify-between gap-3">
        {[
          ["Linhas (estim.)", linhas(t)],
          ["Colunas", fmtInt(t.colunas)],
        ].map(([r, v]) => (
          <div key={r}>
            <p className="m-0 text-xs text-foreground-suave">{r}</p>
            <p className="m-0 tabular-nums">{v}</p>
          </div>
        ))}
        <div className="min-w-0 text-right">
          <p className="m-0 text-xs text-foreground-suave">Chave primária</p>
          <Pk t={t} />
        </div>
      </div>
      {t.fks && <Fks t={t} />}
      {t.comentario && <p className="m-0 text-xs text-foreground-suave">{t.comentario}</p>}
    </div>
  ),
});

/** Tabelas e views de um schema, lidas do catálogo do Postgres. */
export default function TabelaObjetos({ titulo, sistema, objetos }: { titulo: string; sistema: Sistema; objetos: Tabela[] }) {
  return (
    <DataTable
      titulo={titulo}
      icone={ICONES[sistema]}
      linhas={objetos}
      colunas={colunas}
      chave={(t) => `${t.schema}.${t.tabela}`}
      busca={{ placeholder: "Buscar objeto...", texto: (t) => `${t.tabela} ${t.pk ?? ""} ${t.fks ?? ""} ${t.comentario ?? ""}` }}
      filtros={filtros}
      ordemInicial={{ coluna: "objeto", direcao: "asc" }}
      porPagina={10}
      opcoesPorPagina={[10, 25, 50]}
      nomeItens={["objeto", "objetos"]}
      cartaoMobile={cartao}
      vazio="Nenhum objeto com esses filtros."
    />
  );
}
