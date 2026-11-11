import Image from "next/image";

export default function AcessoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="acesso">
      <aside className="acesso-marca">
        <Image className="acesso-logo" src="/brand/mto.webp" alt="MTO Administração de Franquias" width={236} height={100} priority />
        <div className="acesso-chamada">
          <p className="acesso-titulo">Painel da rede</p>
          <p className="acesso-texto">Vendas do Colibri e folha do RM, loja a loja.</p>
        </div>
        <div className="acesso-marcas">
          <Image src="/brand/omatuto-fogo-mar.webp" alt="O Matuto Fogo e Mar" width={150} height={65} />
          <Image src="/brand/omatuto-expressa.webp" alt="O Matuto Churrascaria Expressa" width={150} height={65} />
        </div>
      </aside>
      <section className="acesso-form">{children}</section>
    </div>
  );
}
