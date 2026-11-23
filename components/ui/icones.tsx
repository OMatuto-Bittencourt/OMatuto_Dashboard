// Ícones de linha (grade 24×24, traço 2) desenhados inline: herdam a cor do texto (`currentColor`)
// e o tamanho vem da classe (`size-5` etc.). Para um ícone novo, siga o mesmo padrão.
import type { ReactNode } from "react";

export type IconeProps = { className?: string };
export type Icone = (p: IconeProps) => ReactNode;

const criar = (conteudo: ReactNode, strokeWidth = 2): Icone =>
  function Icone({ className }: IconeProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={className}
      >
        {conteudo}
      </svg>
    );
  };

/* Navegação */
export const IconeCasa = criar(
  <>
    <path d="M3 10a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 21v-8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v8" />
  </>,
);
export const IconeSinal = criar(<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 20V4" />);
export const IconeBicicleta = criar(
  <>
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <circle cx="15" cy="5" r="1" />
    <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
  </>,
);
export const IconeLink = criar(
  <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />,
);
export const IconeLinkQuebrado = criar(
  <path d="m18.8 12.3 1.7-1.7a5 5 0 0 0-7-7l-1.7 1.7M5.2 11.7l-1.7 1.7a5 5 0 0 0 7 7l1.7-1.7M8 2v3M2 8h3M16 22v-3M22 16h-3" />,
);
export const IconeBanco = criar(
  <>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0" />
  </>,
);

/* Pessoas e lojas */
export const IconeUsuario = criar(
  <>
    <circle cx="12" cy="7" r="4" />
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
  </>,
);
export const IconeUsuarios = criar(
  <>
    <circle cx="9" cy="7" r="4" />
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
  </>,
);
export const IconeLoja = criar(
  <path d="M3 9 4.5 4h15L21 9M3 9h18M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v8h14v-8M10 20v-5h4v5" />,
);

/* Indicadores */
export const IconePercentual = criar(
  <>
    <path d="M19 5 5 19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </>,
);
export const IconeGraficoBarras = criar(<path d="M3 3v16a2 2 0 0 0 2 2h16M8 17v-3M13 17V9M18 17V5" />);
export const IconeCalendario = criar(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>,
);

/* Setas e controles */
export const IconeSetaDireita = criar(<path d="M5 12h14m-7-7 7 7-7 7" />);
export const IconeSetaCima = criar(<path d="M12 19V5m-7 7 7-7 7 7" />);
export const IconeSetaBaixo = criar(<path d="M12 5v14m7-7-7 7-7-7" />);
export const IconeChevronBaixo = criar(<path d="m6 9 6 6 6-6" />);
export const IconeChevronEsquerda = criar(<path d="m15 18-6-6 6-6" />);
export const IconeChevronDireita = criar(<path d="m9 18 6-6-6-6" />);
export const IconeChevronsEsquerda = criar(<path d="m11 17-5-5 5-5m7 10-5-5 5-5" />);
export const IconeChevronsDireita = criar(<path d="m6 17 5-5-5-5m7 10 5-5-5-5" />);
export const IconeOrdenar = criar(<path d="m7 15 5 5 5-5M7 9l5-5 5 5" />);
export const IconeBusca = criar(
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </>,
);
export const IconeLimpar = criar(<path d="M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8M3 3v5h5" />);
export const IconeEstrela = criar(
  <path d="M11.5 2.3a.5.5 0 0 1 1 0l2.3 4.7a2 2 0 0 0 1.6 1.2l5.2.7a.5.5 0 0 1 .3.9l-3.8 3.7a2 2 0 0 0-.6 1.9l.9 5.1a.5.5 0 0 1-.8.6l-4.6-2.4a2 2 0 0 0-2 0L6.4 21a.5.5 0 0 1-.8-.6l.9-5.1a2 2 0 0 0-.6-1.9L2.2 9.8a.5.5 0 0 1 .3-.9l5.1-.7a2 2 0 0 0 1.6-1.2z" />,
);
export const IconeSair = criar(<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />);

/* Formulários e alertas */
export const IconeEmail = criar(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </>,
  1.8,
);
export const IconeCadeado = criar(
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>,
  1.8,
);
export const IconeOlho = criar(
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
  1.8,
);
export const IconeOlhoFechado = criar(
  <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.4 3.3M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />,
  1.8,
);
export const IconeInfo = criar(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </>,
);
export const IconeAlerta = criar(
  <path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3M12 9v4M12 17h.01" />,
);
export const IconeSucesso = criar(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </>,
);

/* Barra superior, tema e menus */
export const IconeSol = criar(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
  </>,
);
export const IconeLua = criar(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);
export const IconeSino = criar(<path d="M10.3 21a1.9 1.9 0 0 0 3.4 0M3.3 15.3A1 1 0 0 0 4 17h16a1 1 0 0 0 .7-1.7C19.4 14 18 12.6 18 8A6 6 0 0 0 6 8c0 4.6-1.4 6-2.7 7.3" />);
export const IconeMenu = criar(<path d="M4 6h16M4 12h16M4 18h16" />);
export const IconeFechar = criar(<path d="M18 6 6 18M6 6l12 12" />);
export const IconeFunil = criar(<path d="M10 20a1 1 0 0 0 .6.9l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .5-1.3L21.7 4.7A1 1 0 0 0 21 3H3a1 1 0 0 0-.7 1.7l7.2 8A2 2 0 0 1 10 14z" />);
export const IconeMaisVertical = criar(
  <>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </>,
  2.5,
);

/* Vendas */
export const IconeRecibo = criar(<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1ZM16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11" />);
export const IconeCartao = criar(
  <>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20M6 15h4" />
  </>,
);
export const IconeRelogio = criar(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>,
);
export const IconeSacola = criar(<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" />);
