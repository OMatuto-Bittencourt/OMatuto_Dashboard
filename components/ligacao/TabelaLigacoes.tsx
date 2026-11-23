"use client";

import Codigo from "@/components/ui/Codigo";
import DataTable, { type CartaoMobile, type Coluna, type Filtro } from "@/components/ui/DataTable";
import { IconeLink } from "@/components/ui/icones";
import Pill from "@/components/ui/Pill";
import { fmtCnpj, fmtData, fmtInt } from "@/lib/format";
import type { Ligacao } from "@/lib/queries";

const PillVigencia = ({ l }: { l: Ligacao }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    {fmtData(l.vigente_de)} →{" "}
    {l.vigente_ate ? (
      fmtData(l.vigente_ate)
    ) : (
      <Pill tom="sucesso" ponto>
        atual
      </Pill>
    )}
  </span>
);

const colunas: Coluna<Ligacao>[] = [
  { id: "loja", titulo: "Loja", ordenar: (l) => l.loja_nome, celula: (l) => <span className="font-semibold">{l.loja_nome}</span>, classe: "min-w-28" },
  { id: "loja_id", titulo: "loja_id", ordenar: (l) => l.loja_id, celula: (l) => <Codigo>{l.loja_id}</Codigo> },
  {
    id: "coligada",
    titulo: "Coligada",
    alinhar: "centro",
    ordenar: (l) => l.codcoligada,
    celula: (l) => <Pill tom="neutro">{l.codcoligada}</Pill>,
  },
  { id: "razao", titulo: "Razão social (RM)", ordenar: (l) => l.coligada_nome, celula: (l) => l.coligada_nome ?? "–", classe: "min-w-48" },
  {
    id: "cnpj",
    titulo: "CNPJ",
    ordenar: (l) => l.cnpj,
    celula: (l) => (
      <div className="whitespace-nowrap">
        {fmtCnpj(l.cnpj)}
        {l.cidade_filial1 && <div className="text-xs text-muted-foreground">{l.cidade_filial1}</div>}
      </div>
    ),
  },
  { id: "vigencia", titulo: "Vigência", ordenar: (l) => l.vigente_de, celula: (l) => <PillVigencia l={l} />, classe: "whitespace-nowrap" },
  { id: "ativos", titulo: "Func. ativos", alinhar: "direita", ordenar: (l) => l.ativos, celula: (l) => fmtInt(l.ativos) },
  {
    id: "obs",
    titulo: "Observação",
    celula: (l) => <span className="text-xs text-foreground-suave">{l.observacao ?? ""}</span>,
    classe: "min-w-56",
  },
];

function filtros(linhas: Ligacao[]): Filtro<Ligacao>[] {
  const redes = [...new Set(linhas.map((l) => l.rede).filter((r): r is string => !!r))].sort();
  return [
    { id: "rede", rotulo: "Rede", opcoes: redes.map((r) => ({ valor: r, rotulo: r })), aplicar: (l, v) => l.rede === v },
    {
      id: "vigencia",
      rotulo: "Vigência",
      opcoes: [
        { valor: "atual", rotulo: "Atual" },
        { valor: "encerrada", rotulo: "Encerrada" },
      ],
      aplicar: (l, v) => (v === "atual") === !l.vigente_ate,
    },
  ];
}

const cartao = (l: Ligacao): CartaoMobile => ({
  cabecalho: (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="m-0 font-semibold">{l.loja_nome}</p>
        <div className="mt-1">
          <Codigo>{l.loja_id}</Codigo>
        </div>
      </div>
      <Pill tom="neutro">Coligada {l.codcoligada}</Pill>
    </div>
  ),
  corpo: (
    <div className="grid gap-2 border-t border-border pt-3 text-sm">
      <p className="m-0">{l.coligada_nome ?? "–"}</p>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-foreground-suave">
        <span>
          {fmtCnpj(l.cnpj)}
          {l.cidade_filial1 && ` · ${l.cidade_filial1}`}
        </span>
        <span>{fmtInt(l.ativos)} func. ativos</span>
      </div>
      <PillVigencia l={l} />
      {l.observacao && <p className="m-0 text-xs text-foreground-suave">{l.observacao}</p>}
    </div>
  ),
});

/** Ligações coligada (RM) → loja (Colibri) gravadas em dashboard.coligada_loja. */
export default function TabelaLigacoes({ linhas }: { linhas: Ligacao[] }) {
  return (
    <DataTable
      titulo="Ligações vigentes"
      icone={IconeLink}
      linhas={linhas}
      colunas={colunas}
      chave={(l) => `${l.codcoligada}-${l.vigente_de}`}
      busca={{
        placeholder: "Buscar loja, coligada, CNPJ...",
        texto: (l) => `${l.loja_nome} ${l.loja_id} ${l.codcoligada} ${l.coligada_nome ?? ""} ${l.cnpj ?? ""} ${fmtCnpj(l.cnpj)} ${l.observacao ?? ""}`,
      }}
      filtros={filtros(linhas)}
      ordemInicial={{ coluna: "loja", direcao: "asc" }}
      porPagina={10}
      nomeItens={["ligação", "ligações"]}
      cartaoMobile={cartao}
      vazio="Nenhuma ligação com esses filtros."
    />
  );
}
