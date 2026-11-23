import TabelaClassificacoes from "@/components/ligacao/TabelaClassificacoes";
import TabelaLigacoes from "@/components/ligacao/TabelaLigacoes";
import TabelaPendencias from "@/components/ligacao/TabelaPendencias";
import KpiCard from "@/components/ui/KpiCard";
import PageHeader from "@/components/ui/PageHeader";
import { IconeBanco, IconeLink, IconeLinkQuebrado, IconeUsuarios } from "@/components/ui/icones";
import { fmtBRL, fmtInt } from "@/lib/format";
import { classificacoes, ligacoes, pendencias } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [lig, pend, cls] = await Promise.all([ligacoes(), pendencias(), classificacoes()]);
  const lojasSem = pend.filter((p) => p.tipo === "LOJA_SEM_COLIGADA");
  const colSem = pend.filter((p) => p.tipo === "COLIGADA_SEM_LOJA");
  const lojasLigadas = new Set(lig.map((l) => l.loja_id)).size;

  return (
    <div className="grid gap-5">
      {/*
        Detalhe técnico retirado da tela (expunha nomes de tabelas/colunas do banco). Fica aqui como referência:
        Chave de ligação: colibri_matuto.lojas.id (loja_id) ↔ CODCOLIGADA do RM, gravada em dashboard.coligada_loja
        com vigência. Nunca ligar por loja_numero (há números duplicados em cadastros antigos).
      */}
      <PageHeader
        titulo="Ligação Colibri + RM"
        descricao="Como cada loja do PDV Colibri se liga às empresas (coligadas) da folha no TOTVS RM."
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Indicadores de ligação">
        <KpiCard
          destaque
          className="col-span-2 xl:col-span-1"
          icone={IconeLink}
          rotulo="Lojas ligadas"
          valor={lojasLigadas}
          detalhe={`${lig.length} ligações coligada → loja`}
        />
        <KpiCard
          icone={IconeLinkQuebrado}
          rotulo="Lojas com venda sem coligada"
          valor={lojasSem.length}
          detalhe={`${fmtBRL(lojasSem.reduce((s, p) => s + (p.fat_60d ?? 0), 0))} em 60 dias`}
        />
        <KpiCard
          icone={IconeUsuarios}
          rotulo="Coligadas com ativos sem loja"
          valor={colSem.length}
          detalhe={`${fmtInt(colSem.reduce((s, p) => s + (p.funcionarios_ativos ?? 0), 0))} funcionários ativos`}
        />
        <KpiCard
          icone={IconeBanco}
          rotulo="Coligadas fora de loja"
          valor={cls.length}
          detalhe="corporativo / sem operação"
          className="col-span-2 xl:col-span-1"
        />
      </section>

      <TabelaPendencias linhas={pend} />
      <TabelaLigacoes linhas={lig} />
      <TabelaClassificacoes linhas={cls} />
    </div>
  );
}
