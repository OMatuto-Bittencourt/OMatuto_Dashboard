"use client";

import { useRouter } from "next/navigation";

export default function MonthSelect({ meses, atual, rotulos }: { meses: string[]; atual: string; rotulos: Record<string, string> }) {
  const router = useRouter();
  return (
    <label>
      <span className="muted">Mês </span>
      <select value={atual} onChange={(e) => router.push(`/?mes=${e.target.value}`)} aria-label="Mês de competência">
        {meses.map((m) => (
          <option key={m} value={m}>
            {rotulos[m]}
          </option>
        ))}
      </select>
    </label>
  );
}
