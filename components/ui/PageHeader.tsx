import type { ReactNode } from "react";

const DECORACAO = ["espeto", "chama", "carne"] as const;

/** Título da página com a barra amarela da marca, descrição e ícones de churrasco decorativos. */
export default function PageHeader({
  titulo,
  descricao,
  decoracao = true,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  decoracao?: boolean;
}) {
  return (
    <div className="relative">
      {decoracao && (
        <div
          className="pointer-events-none absolute -top-1 right-0 flex rotate-[-8deg] gap-2 text-brand-earth-600/35 sm:gap-3 dark:text-white/25"
          aria-hidden
        >
          {DECORACAO.map((n, i) => (
            <span
              key={n}
              className="block size-9 bg-current sm:size-12"
              style={{ mask: `url(/brand/icone-${n}.png) center / contain no-repeat`, marginTop: i === 1 ? 8 : 0 }}
            />
          ))}
        </div>
      )}
      <h1 className="m-0 flex items-center gap-3 pr-28 font-heading text-[1.75rem] leading-tight text-brand-red-900 sm:pr-44 sm:text-[2.25rem] dark:text-white">
        <span className="h-8 w-1.5 shrink-0 rounded-full bg-brand-earth-400 sm:h-9" aria-hidden />
        {titulo}
      </h1>
      {descricao && <p className="mb-0 mt-1 text-sm text-foreground-suave sm:ml-4.5 sm:pr-44">{descricao}</p>}
    </div>
  );
}
