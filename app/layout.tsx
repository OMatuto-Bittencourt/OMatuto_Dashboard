import type { Metadata } from "next";
import { Questrial } from "next/font/google";
import "./globals.css";

const questrial = Questrial({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-marca" });

export const metadata: Metadata = {
  title: "MTO · Painel da rede",
  description: "Faturamento (Colibri) e folha (TOTVS RM) por loja",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={questrial.variable}>
      <body>{children}</body>
    </html>
  );
}
