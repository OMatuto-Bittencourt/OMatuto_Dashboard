import type { Metadata } from "next";
import { Inter, Lilita_One, Questrial } from "next/font/google";
import { CHAVE_TEMA } from "@/lib/tema";
import "./globals.css";

const questrial = Questrial({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-marca" });
const lilita = Lilita_One({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-lilita" });
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MTO · Painel da rede",
  description: "Faturamento (Colibri) e folha (TOTVS RM) por loja",
  robots: { index: false, follow: false },
};

// Roda antes da primeira pintura: aplica o tema escolhido (ou o do sistema) sem piscar.
const scriptTema = `(function(){try{var t=localStorage.getItem(${JSON.stringify(CHAVE_TEMA)});if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: o data-theme é definido pelo script antes do React hidratar.
    <html lang="pt-BR" suppressHydrationWarning className={`${questrial.variable} ${lilita.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
