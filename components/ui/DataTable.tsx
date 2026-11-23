"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import Card from "./Card";
import { useFiltrosMobile } from "./FiltrosMobile";
import { IconeBusca, IconeChevronDireita, IconeEstrela, IconeLimpar, IconeOrdenar, IconeSetaBaixo, IconeSetaCima, type Icone } from "./icones";
import MenuAcoes, { type Acao } from "./MenuAcoes";
import Paginacao from "./Paginacao";
import Select from "./Select";

/**
 * Tabela genérica do painel: busca, filtros, ordenação, paginação, favoritos e ações por linha.
 * No mobile (< md), se `cartaoMobile` for informado, cada linha vira um card.
 * Tudo roda no navegador sobre `linhas` — serve para listas de até alguns milhares de itens.
 *
 * Como funções não atravessam de Server para Client Component, as colunas são definidas
 * num componente cliente da própria tela (ver components/visao-geral/TabelaLojas.tsx).
 */

export type Coluna<T> = {
  id: string;
  titulo: string;
  alinhar?: "esquerda" | "direita" | "centro";
  /** Valor usado na ordenação. Sem ele, a coluna não é ordenável. Vazios vão sempre para o fim. */
  ordenar?: (l: T) => number | string | null | undefined;
  celula: (l: T) => ReactNode;
  /** Classes extras para th/td (largura mínima, nowrap etc.). */
  classe?: string;
};

export type Filtro<T> = {
  id: string;
  rotulo: string; // aparece como primeira opção ("Rede") e como nome acessível
  opcoes: { valor: string; rotulo: string }[];
  aplicar: (l: T, valor: string) => boolean;
};

type Ordem = { coluna: string; direcao: "asc" | "desc" };

/** Card do mobile: `cabecalho` fica entre a estrela e a seta; `corpo` usa a largura total do card. */
export type CartaoMobile = { cabecalho: ReactNode; corpo?: ReactNode };

type Props<T> = {
  linhas: T[];
  colunas: Coluna<T>[];
  chave: (l: T) => string;
  titulo?: ReactNode;
  icone?: Icone;
  busca?: { placeholder: string; texto: (l: T) => string };
  filtros?: Filtro<T>[];
  ordemInicial?: Ordem;
  porPagina?: number;
  opcoesPorPagina?: number[];
  /** Nome dos itens no rodapé: ["loja", "lojas"]. */
  nomeItens?: [string, string];
  /** Liga a estrela; favoritos ficam no topo e são lembrados neste navegador sob esta chave. */
  favoritos?: string;
  /** Menu "⋮" no fim de cada linha (desktop). */
  acoes?: (l: T) => Acao[];
  /** Destino da seta ">" de cada card no mobile. */
  linkLinha?: (l: T) => string;
  /** Conteúdo do card de cada linha no mobile. Sem ele, o mobile mostra a tabela com rolagem. */
  cartaoMobile?: (l: T) => CartaoMobile;
  vazio?: string;
  rodape?: ReactNode;
  /** Só a tabela, sem o card em volta (para usar dentro de um Card montado pela página). */
  semCard?: boolean;
  /** false = mostra todas as linhas e esconde o rodapé de contagem/paginação (tabelas curtas). */
  paginacao?: boolean;
  /** Linha de total ao fim. `celulas` por id de coluna; a 1ª coluna recebe "Total" se vazia. */
  linhaTotal?: { celulas: Partial<Record<string, ReactNode>>; mobile?: CartaoMobile };
};

const ALINHAR = { esquerda: "text-left", direita: "text-right", centro: "text-center" } as const;
const colator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });
const normalizar = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const vazio = (v: unknown) => v === null || v === undefined || v === "";

function comparar(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return colator.compare(String(a), String(b));
}

function lerFavoritos(chave: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(chave) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function Estrela({ ativa, aoClicar }: { ativa: boolean; aoClicar: () => void }) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={ativa}
      aria-label={ativa ? "Remover dos favoritos" : "Marcar como favorito"}
      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent p-0 text-foreground-suave hover:bg-surface-muted hover:text-brand-earth-500"
    >
      <IconeEstrela className={cn("size-5", ativa && "fill-brand-earth-400 text-brand-earth-400")} />
    </button>
  );
}

export default function DataTable<T>({
  linhas,
  colunas,
  chave,
  titulo,
  icone,
  busca,
  filtros = [],
  ordemInicial,
  porPagina: porPaginaInicial = 10,
  opcoesPorPagina = [5, 10, 25, 50],
  nomeItens = ["item", "itens"],
  favoritos: chaveFav,
  acoes,
  linkLinha,
  cartaoMobile,
  vazio: textoVazio = "Nenhum resultado com esses filtros.",
  rodape,
  semCard,
  paginacao = true,
  linhaTotal,
}: Props<T>) {
  const [termo, setTermo] = useState("");
  const [valoresFiltro, setValoresFiltro] = useState<Record<string, string>>({});
  const [ordem, setOrdem] = useState<Ordem | undefined>(ordemInicial);
  const [porPagina, setPorPagina] = useState(porPaginaInicial);
  const [pagina, setPagina] = useState(1);
  const [fav, setFav] = useState<Set<string>>(new Set());
  const mobile = useFiltrosMobile();

  // Favoritos só existem no navegador: carregados depois da hidratação.
  useEffect(() => {
    if (chaveFav) setFav(lerFavoritos(chaveFav));
  }, [chaveFav]);

  const qtdAtivos = (termo.trim() ? 1 : 0) + Object.values(valoresFiltro).filter(Boolean).length;
  const setAtivos = mobile?.setAtivos;
  useEffect(() => setAtivos?.(qtdAtivos), [qtdAtivos, setAtivos]);

  const alternarFav = (id: string) => {
    setFav((atual) => {
      const novo = new Set(atual);
      if (!novo.delete(id)) novo.add(id);
      try {
        localStorage.setItem(chaveFav!, JSON.stringify([...novo]));
      } catch {
        /* sem storage (aba anônima etc.): favorito vale só nesta visita */
      }
      return novo;
    });
  };

  const filtradas = useMemo(() => {
    const t = normalizar(termo.trim());
    let r = linhas.filter(
      (l) =>
        (!t || !busca || normalizar(busca.texto(l)).includes(t)) &&
        filtros.every((f) => !valoresFiltro[f.id] || f.aplicar(l, valoresFiltro[f.id])),
    );
    const col = ordem && colunas.find((c) => c.id === ordem.coluna);
    if (col?.ordenar) {
      const sinal = ordem!.direcao === "asc" ? 1 : -1;
      r = [...r].sort((a, b) => {
        const va = col.ordenar!(a);
        const vb = col.ordenar!(b);
        if (vazio(va) || vazio(vb)) return vazio(va) === vazio(vb) ? 0 : vazio(va) ? 1 : -1; // vazios no fim, nos dois sentidos
        return sinal * comparar(va, vb);
      });
    }
    if (chaveFav && fav.size) r = [...r.filter((l) => fav.has(chave(l))), ...r.filter((l) => !fav.has(chave(l)))];
    return r;
  }, [linhas, termo, valoresFiltro, ordem, colunas, filtros, busca, fav, chaveFav, chave]);

  const totalPaginas = paginacao ? Math.max(1, Math.ceil(filtradas.length / porPagina)) : 1;
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = paginacao ? filtradas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina) : filtradas;
  const mudouOrdem = ordem?.coluna !== ordemInicial?.coluna || ordem?.direcao !== ordemInicial?.direcao;
  const temFiltro = qtdAtivos > 0 || mudouOrdem;

  const ordenarPor = (id: string) => {
    setOrdem((o) => (o?.coluna === id ? { coluna: id, direcao: o.direcao === "asc" ? "desc" : "asc" } : { coluna: id, direcao: "desc" }));
    setPagina(1);
  };
  const limpar = () => {
    setTermo("");
    setValoresFiltro({});
    setOrdem(ordemInicial);
    setPagina(1);
  };

  const temControles = !!busca || filtros.length > 0;
  const controles = temControles && (
    <div
      id={mobile?.idPainel}
      className={cn("flex w-full scroll-mt-4 flex-wrap items-center gap-2 md:w-auto", mobile && !mobile.aberto && "max-md:hidden")}
    >
      {busca && (
        <label className="relative block w-full md:w-64 xl:w-72">
          <span className="sr-only">Buscar</span>
          <IconeBusca className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value);
              setPagina(1);
            }}
            placeholder={busca.placeholder}
            className="h-10 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm text-foreground shadow-xs placeholder:text-muted-foreground focus:border-brand-red-700 focus:outline-none focus:ring-3 focus:ring-brand-red-500/15"
          />
        </label>
      )}
      {filtros.map((f) => (
        <Select
          key={f.id}
          aria-label={f.rotulo}
          value={valoresFiltro[f.id] ?? ""}
          onChange={(e) => {
            setValoresFiltro((v) => ({ ...v, [f.id]: e.target.value }));
            setPagina(1);
          }}
          classeCaixa="min-w-28 flex-1 md:flex-none"
        >
          <option value="">{f.rotulo}</option>
          {f.opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </Select>
      ))}
      <button
        type="button"
        onClick={limpar}
        disabled={!temFiltro}
        className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-brand-red-500/50 bg-brand-red-500/6 px-4 text-sm font-semibold text-brand-red-700 transition hover:bg-brand-red-500/12 disabled:cursor-default disabled:border-border disabled:bg-transparent disabled:text-muted-foreground dark:text-red-300 dark:disabled:text-muted-foreground"
      >
        <IconeLimpar className="size-4" />
        Limpar filtros
      </button>
    </div>
  );

  const [um, varios] = nomeItens;
  const ini = filtradas.length ? (paginaAtual - 1) * porPagina + 1 : 0;
  const fim = Math.min(paginaAtual * porPagina, filtradas.length);
  const nColunas = colunas.length + (chaveFav ? 1 : 0) + (acoes ? 1 : 0);

  const conteudo = (
    <>
      {/* ---------- Cards (mobile) ---------- */}
      {cartaoMobile && (
        <ul className="m-0 grid list-none gap-3 p-0 md:hidden">
          {visiveis.map((l) => {
            const id = chave(l);
            const { cabecalho, corpo } = cartaoMobile(l);
            return (
              <li key={id} className="rounded-xl border border-border bg-surface p-3 shadow-xs">
                {/* Cabeçalho entre a estrela e a seta */}
                <div className="flex items-start gap-1.5">
                  {chaveFav && <Estrela ativa={fav.has(id)} aoClicar={() => alternarFav(id)} />}
                  <div className="min-w-0 flex-1 pt-1">{cabecalho}</div>
                  {linkLinha && (
                    <Link
                      href={linkLinha(l)}
                      aria-label="Abrir detalhes"
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-brand-red-700 hover:bg-surface-muted dark:text-red-400"
                    >
                      <IconeChevronDireita className="size-5" />
                    </Link>
                  )}
                </div>
                {/* Corpo na largura total do card */}
                {corpo && <div className="mt-3">{corpo}</div>}
              </li>
            );
          })}
          {visiveis.length === 0 && <li className="py-10 text-center text-muted-foreground">{textoVazio}</li>}
          {linhaTotal?.mobile && visiveis.length > 0 && (
            <li className="rounded-xl border border-border bg-surface-muted p-3 font-semibold">
              {linhaTotal.mobile.cabecalho}
              {linhaTotal.mobile.corpo && <div className="mt-3">{linhaTotal.mobile.corpo}</div>}
            </li>
          )}
        </ul>
      )}

      {/* ---------- Tabela ---------- */}
      <div className={cn("-mx-4 overflow-x-auto sm:mx-0", cartaoMobile && "max-md:hidden")}>
        <table className="w-full border-collapse tabular-nums">
          <thead>
            <tr>
              {chaveFav && <th className="static w-10 rounded-l-lg border-0 bg-surface-muted p-0" aria-label="Favorito" />}
              {colunas.map((c, i) => {
                const ativa = ordem?.coluna === c.id;
                const Seta = !ativa ? IconeOrdenar : ordem!.direcao === "asc" ? IconeSetaCima : IconeSetaBaixo;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={ativa ? (ordem!.direcao === "asc" ? "ascending" : "descending") : undefined}
                    className={cn(
                      "static border-0 px-1.5 py-2 text-xs font-semibold leading-tight text-foreground",
                      ALINHAR[c.alinhar ?? "esquerda"],
                      ativa ? "bg-brand-red-500/12" : "bg-surface-muted",
                      !chaveFav && i === 0 && "rounded-l-lg",
                      !acoes && i === colunas.length - 1 && "rounded-r-lg",
                      c.classe,
                    )}
                  >
                    {c.ordenar ? (
                      <button
                        type="button"
                        onClick={() => ordenarPor(c.id)}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-left font-semibold leading-tight",
                          ativa ? "text-brand-red-700 underline underline-offset-4 dark:text-red-300" : "text-foreground hover:text-brand-red-700",
                        )}
                      >
                        {c.titulo}
                        <Seta className={cn("size-3.5 shrink-0", !ativa && "text-muted-foreground")} />
                      </button>
                    ) : (
                      c.titulo
                    )}
                  </th>
                );
              })}
              {acoes && <th className="static w-10 rounded-r-lg border-0 bg-surface-muted p-0" aria-label="Ações" />}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((l) => {
              const id = chave(l);
              return (
                <tr key={id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                  {chaveFav && (
                    <td className="border-0 bg-transparent py-1.5 pl-1 pr-0">
                      <Estrela ativa={fav.has(id)} aoClicar={() => alternarFav(id)} />
                    </td>
                  )}
                  {colunas.map((c) => (
                    <td key={c.id} className={cn("border-0 bg-transparent px-1.5 py-2 align-middle text-[13px] text-foreground", ALINHAR[c.alinhar ?? "esquerda"], c.classe)}>
                      {c.celula(l)}
                    </td>
                  ))}
                  {acoes && (
                    <td className="border-0 bg-transparent py-1.5 pl-0 pr-1 text-right">
                      <MenuAcoes acoes={acoes(l)} />
                    </td>
                  )}
                </tr>
              );
            })}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={nColunas} className="border-0 bg-transparent px-3 py-10 text-center text-muted-foreground">
                  {textoVazio}
                </td>
              </tr>
            )}
          </tbody>
          {linhaTotal && visiveis.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-border">
                {chaveFav && <td className="border-0 bg-transparent" />}
                {colunas.map((c, i) => (
                  <td key={c.id} className={cn("border-0 bg-transparent px-1.5 py-2.5 text-[13px] font-bold text-foreground", ALINHAR[c.alinhar ?? "esquerda"], c.classe)}>
                    {linhaTotal.celulas[c.id] ?? (i === 0 ? "Total" : null)}
                  </td>
                ))}
                {acoes && <td className="border-0 bg-transparent" />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ---------- Rodapé: contagem e paginação ---------- */}
      {paginacao && (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-foreground-suave">
        <span>
          Mostrando {ini}–{fim} de {filtradas.length} {filtradas.length === 1 ? um : varios}
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 max-md:hidden">
            Itens por página:
            <Select
              value={porPagina}
              onChange={(e) => {
                setPorPagina(Number(e.target.value));
                setPagina(1);
              }}
              classeCaixa="w-20"
              className="rounded-lg"
            >
              {opcoesPorPagina.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </label>
          <Paginacao pagina={paginaAtual} total={totalPaginas} aoMudar={setPagina} />
        </div>
      </div>
      )}
    </>
  );

  if (semCard)
    return (
      <div className="min-w-0">
        {controles && <div className="mb-4">{controles}</div>}
        {conteudo}
        {rodape && <div className="mt-3 text-[13px] italic text-muted-foreground">{rodape}</div>}
      </div>
    );
  return (
    <Card titulo={titulo} icone={icone} acoes={controles || undefined} rodape={rodape}>
      {conteudo}
    </Card>
  );
}
