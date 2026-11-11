"use client";

import { useState } from "react";
import { fmtBRL, fmtBRLCurto, fmtInt } from "@/lib/format";

const FORMATOS = {
  brl: { valor: fmtBRL, eixo: fmtBRLCurto },
  int: { valor: fmtInt, eixo: fmtInt },
} as const;

export type Ponto = {
  rotulo: string; // eixo X
  valor: number;
  detalhe?: string[]; // linhas extras do tooltip
  destaque?: boolean; // false = barra atenuada (ex.: mes parcial)
};

type Props = {
  dados: Ponto[];
  formato: keyof typeof FORMATOS;
  altura?: number;
  titulo: string; // descricao acessivel
  rotuloCada?: number; // mostra 1 rotulo do eixo X a cada N barras
};

function escala(max: number): number[] {
  if (max <= 0) return [0];
  const bruto = max / 4;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * pot).find((p) => p >= bruto) ?? bruto;
  const ticks: number[] = [];
  for (let v = 0; v <= max + passo * 0.001; v += passo) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + passo);
  return ticks;
}

export default function BarChart({ dados, formato, altura = 240, titulo, rotuloCada = 1 }: Props) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const W = 640;
  const H = altura;
  const m = { top: 12, right: 8, bottom: 26, left: 64 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;
  const ticks = escala(Math.max(0, ...dados.map((d) => d.valor)));
  const topo = ticks[ticks.length - 1] || 1;
  const banda = iw / Math.max(dados.length, 1);
  const gap = Math.min(Math.max(banda * 0.25, 2), 16);
  const larg = Math.max(banda - gap, 1);
  const y = (v: number) => m.top + ih - (v / topo) * ih;
  const formatar = FORMATOS[formato].valor;
  const fe = FORMATOS[formato].eixo;
  const r = Math.min(4, larg / 2);

  const barra = (x: number, v: number) => {
    const y0 = m.top + ih;
    const h = Math.max(y0 - y(v), 0);
    if (h <= 0) return "";
    const rr = Math.min(r, h);
    // topo arredondado, base reta ancorada no zero
    return `M${x},${y0} V${y0 - h + rr} Q${x},${y0 - h} ${x + rr},${y0 - h} H${x + larg - rr} Q${x + larg},${y0 - h} ${x + larg},${y0 - h + rr} V${y0} Z`;
  };

  const p = ativo !== null ? dados[ativo] : null;
  const px = ativo !== null ? ((m.left + ativo * banda + gap / 2 + larg / 2) / W) * 100 : 0;
  const py = p ? (Math.max(y(p.valor) - 6, 0) / H) * 100 : 0;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titulo} onMouseLeave={() => setAtivo(null)}>
        <g className="axis">
          {ticks.map((t) => (
            <g key={t}>
              {t > 0 && <line className="gridline" x1={m.left} x2={W - m.right} y1={y(t)} y2={y(t)} />}
              <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                {fe(t)}
              </text>
            </g>
          ))}
          {dados.map((d, i) =>
            i % rotuloCada === 0 ? (
              <text key={d.rotulo} x={m.left + i * banda + banda / 2} y={H - 8} textAnchor="middle">
                {d.rotulo}
              </text>
            ) : null,
          )}
        </g>
        {dados.map((d, i) => (
          <path
            key={d.rotulo}
            className={`bar${d.destaque === false ? " dim" : ""}${ativo === i ? " active" : ""}`}
            d={barra(m.left + i * banda + gap / 2, d.valor)}
          />
        ))}
        <line className="baseline" x1={m.left} x2={W - m.right} y1={m.top + ih} y2={m.top + ih} />
        {dados.map((d, i) => (
          <rect
            key={d.rotulo}
            className="hit"
            x={m.left + i * banda}
            y={m.top}
            width={banda}
            height={ih}
            onMouseEnter={() => setAtivo(i)}
            onFocus={() => setAtivo(i)}
            onBlur={() => setAtivo(null)}
            tabIndex={0}
            aria-label={`${d.rotulo}: ${formatar(d.valor)}`}
          />
        ))}
      </svg>
      {p && (
        <div className="tooltip" style={{ left: `${px}%`, top: `${py}%` }}>
          <div className="muted">{p.rotulo}</div>
          <b>{formatar(p.valor)}</b>
          {p.detalhe?.map((l) => (
            <div key={l} className="muted">
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
