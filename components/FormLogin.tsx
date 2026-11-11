"use client";

import { useActionState, useState } from "react";
import { entrar, type EstadoForm } from "@/app/acoes-auth";

export default function FormLogin({ destino }: { destino: string }) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(entrar, undefined);
  const [ver, setVer] = useState(false);

  return (
    <form action={acao} className="form" noValidate>
      <input type="hidden" name="destino" value={destino} />
      <div className="campo">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required autoFocus={!estado?.email} defaultValue={estado?.email} key={estado?.email ?? ""} />
      </div>
      <div className="campo">
        <label htmlFor="senha">Senha</label>
        <div className="senha">
          <input id="senha" name="senha" type={ver ? "text" : "password"} autoComplete="current-password" required autoFocus={!!estado?.email} />
          <button type="button" className="ver" onClick={() => setVer((v) => !v)} aria-pressed={ver}>
            {ver ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>
      {estado?.erro && (
        <p className="form-erro" role="alert">
          {estado.erro}
        </p>
      )}
      <button type="submit" className="botao" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
