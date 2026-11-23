import { getImageProps } from "next/image";

// Banners completos (personagem, logo e chamada já na arte), os dois 3:2 (1536×1024).
// Desktop com a chamada "Painel da Rede"; mobile só com logo e personagem, e a onda
// creme já desenhada embaixo.
const BANNER_DESKTOP = "/brand/login-banner.png";
const BANNER_MOBILE = "/brand/login-banner-mobile.png";
const ALT =
  "O Matuto Churrascaria Expressa — Painel da Rede: acompanhe as vendas, resultados e a gestão das unidades.";

// Ícones decorativos sob o formulário (PNGs da arte). Entram como máscara: a cor vem do
// `text-*` do pai, então o tom e a transparência continuam controlados aqui.
const ICONES = ["espeto", "chama", "carne"] as const;

// Um banner por tela no mesmo <picture>: o navegador baixa só o da largura atual.
function bannerProps(src: string, sizes: string) {
  return getImageProps({ src, alt: ALT, width: 1536, height: 1024, sizes, priority: true }).props;
}

export default function AcessoLayout({ children }: { children: React.ReactNode }) {
  return (
    // --creme = cor do rodapé da arte mobile (#faf0ea): sem emenda entre banner e formulário.
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr] scheme-light bg-(--creme) font-interface text-stone-900 [--creme:var(--color-brand-creme)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:grid-rows-1">
      {/* ---------- Banner (cabeçalho no mobile, coluna esquerda no desktop) ---------- */}
      <aside className="relative flex items-center overflow-hidden lg:bg-[#6c0000]">
        {/* Caixa 3:2 = proporção do banner; no desktop as bordas esmaecem na cor de fundo (borda da arte) */}
        <div className="relative aspect-[3/2] w-full lg:[mask-image:linear-gradient(to_bottom,transparent,black_7%,black_93%,transparent)]">
          <Banner />
        </div>
      </aside>

      {/* ---------- Formulário ---------- */}
      <section className="relative flex justify-center px-5 pb-28 pt-2 lg:items-center lg:px-10 lg:py-16">
        {/* Borda curva sobre o painel vermelho (desktop) */}
        <svg className="absolute right-full top-0 hidden h-full w-20 lg:block" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden>
          <path d="M101 0 H40 C -5 350, -5 650, 75 1000 H101Z" fill="var(--creme)" />
        </svg>
        {/* Detalhe amarelo no canto (desktop) */}
        <svg className="absolute right-0 top-0 hidden h-44 w-[45%] lg:block" viewBox="0 0 300 160" preserveAspectRatio="none" aria-hidden>
          <path d="M0 0 H300 V150 C 230 70, 120 20, 0 0Z" fill="var(--color-brand-earth-400)" />
        </svg>
        {/* Ícones decorativos */}
        <div
          className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-6 text-brand-red-500/20 lg:bottom-8 lg:left-auto lg:right-8 lg:translate-x-0 lg:gap-8"
          aria-hidden
        >
          {ICONES.map((nome) => (
            <span
              key={nome}
              className="block size-11 bg-current lg:size-16"
              style={{ mask: `url(/brand/icone-${nome}.png) center / contain no-repeat` }}
            />
          ))}
        </div>

        <div className="relative w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}

function Banner() {
  const desktop = bannerProps(BANNER_DESKTOP, "60vw");
  const { srcSet: mobile, ...img } = bannerProps(BANNER_MOBILE, "100vw");
  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={desktop.srcSet} sizes={desktop.sizes} />
      <source srcSet={mobile} sizes="100vw" />
      {/* alt, width, height e src vêm do getImageProps */}
      <img {...img} className="absolute inset-0 size-full object-cover" />
    </picture>
  );
}
