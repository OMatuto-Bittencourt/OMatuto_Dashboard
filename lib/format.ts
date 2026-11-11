const brl0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brl2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const pct1 = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

const nada = "–";
const ok = (v: number | null | undefined): v is number => v !== null && v !== undefined && Number.isFinite(v);

export const fmtBRL = (v: number | null | undefined) => (ok(v) ? brl0.format(v) : nada);
export const fmtBRL2 = (v: number | null | undefined) => (ok(v) ? brl2.format(v) : nada);
export const fmtInt = (v: number | null | undefined) => (ok(v) ? int.format(v) : nada);
export const fmtPct = (v: number | null | undefined) => (ok(v) ? pct1.format(v) : nada);

/** R$ compacto: 1,2 mi / 850 mil */
export function fmtBRLCurto(v: number | null | undefined): string {
  if (!ok(v)) return nada;
  const a = Math.abs(v);
  if (a >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (a >= 1e3) return `R$ ${(v / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return brl0.format(v);
}

/** YYYY-MM-DD -> DD/MM/AAAA */
export function fmtData(iso: string | null | undefined): string {
  if (!iso) return nada;
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
/** YYYY-MM -> out/2026 */
export function fmtMes(mes: string): string {
  const [y, m] = mes.split("-");
  return `${MESES[Number(m) - 1]}/${y}`;
}

export function fmtCnpj(c: string | null | undefined): string {
  if (!c || c.length !== 14) return c ?? nada;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

export const div = (a: number | null | undefined, b: number | null | undefined) =>
  ok(a) && ok(b) && b !== 0 ? a / b : null;
