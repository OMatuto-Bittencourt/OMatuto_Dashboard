// Estilos (e ícones reexportados) compartilhados pelas telas de acesso (login / troca de senha).

export const cls = {
  form: "grid gap-5",
  campo: "grid gap-2",
  label: "text-sm font-semibold text-stone-800",
  caixaInput: "relative",
  iconeInput: "pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-stone-400",
  input:
    "w-full rounded-lg border border-stone-300 bg-white py-3 pl-11 pr-4 text-[15px] text-stone-900 shadow-xs " +
    "placeholder:text-stone-400 transition focus:border-brand-red-700 focus:outline-none focus:ring-3 focus:ring-brand-red-500/15",
  dica: "text-xs text-stone-500",
  erro: "m-0 rounded-lg border-l-3 border-brand-red-600 bg-brand-red-500/8 px-3 py-2.5 text-sm text-brand-red-900",
  botao:
    "mt-1 flex w-full cursor-pointer border-0 items-center justify-center gap-2 rounded-lg bg-linear-to-b from-brand-red-700 to-brand-red-900 " +
    "px-4 py-3.5 text-base font-semibold text-white shadow-md shadow-brand-red-900/25 transition " +
    "hover:from-brand-red-600 hover:to-brand-red-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-earth-400/60 " +
    "disabled:cursor-progress disabled:opacity-60",
};


// Ícones vêm do conjunto único em components/ui/icones.tsx.
export {
  IconeCadeado,
  IconeEmail,
  IconeOlho,
  IconeOlhoFechado,
  IconeSetaDireita as IconeSeta,
  IconeUsuario,
} from "@/components/ui/icones";
