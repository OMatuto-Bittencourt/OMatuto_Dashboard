"use client";

import { useState } from "react";

/** Mostra a senha temporaria uma unica vez, com botao de copiar. */
export default function SenhaTemporaria({ email, senha }: { email: string; senha: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`E-mail: ${email}\nSenha temporária: ${senha}`);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };
  return (
    <div className="senha-temp" role="status">
      <div className="small muted">Senha temporária de {email}</div>
      <div className="senha-temp-linha">
        <code>{senha}</code>
        <button type="button" className="botao-sec" onClick={copiar}>
          {copiado ? "Copiado" : "Copiar acesso"}
        </button>
      </div>
      <div className="small muted">
        Ela aparece só agora. Envie à pessoa por um canal seguro; no primeiro acesso o sistema pede uma senha nova.
      </div>
    </div>
  );
}
