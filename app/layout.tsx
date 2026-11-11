import type { Metadata } from "next";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "O Matuto · Dashboard",
  description: "Faturamento (Colibri) e folha (TOTVS RM) por loja",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="topbar">
          <div className="brand">
            O Matuto <span>· Dashboard</span>
          </div>
          <Nav />
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
