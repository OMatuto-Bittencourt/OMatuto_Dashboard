"use client";

import { useRouter } from "next/navigation";

type Props = {
  meses: string[];
  atual: string;
  rotulos: Record<string, string>;
  base?: string;
  lojas?: { loja_id: string; nome: string }[];
  lojaAtual?: string;
};

export default function MonthSelect({ meses, atual, rotulos, base = "/", lojas, lojaAtual }: Props) {
  const router = useRouter();
  const ir = (mes: string, loja?: string) => {
    const q = new URLSearchParams({ mes });
    if (loja) q.set("loja", loja);
    router.push(`${base}?${q.toString()}`);
  };
  return (
    <>
      <label>
        <span className="muted">Mês </span>
        <select value={atual} onChange={(e) => ir(e.target.value, lojaAtual)} aria-label="Mês">
          {meses.map((m) => (
            <option key={m} value={m}>
              {rotulos[m]}
            </option>
          ))}
        </select>
      </label>
      {lojas && (
        <label>
          <span className="muted">Loja </span>
          <select value={lojaAtual ?? ""} onChange={(e) => ir(atual, e.target.value || undefined)} aria-label="Loja">
            <option value="">Todas as lojas</option>
            {lojas.map((l) => (
              <option key={l.loja_id} value={l.loja_id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
}
