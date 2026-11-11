"use client";

import { useActionState } from "react";
import { trocarSenha, type EstadoForm } from "@/app/acoes-auth";

export default function FormTrocaSenha() {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(trocarSenha, undefined);
  return (
    <form action={acao} className="form" noValidate>
      <div className="campo">
        <label htmlFor="atual">Senha atual</label>
        <input id="atual" name="atual" type="password" autoComplete="current-password" required autoFocus />
      </div>
      <div className="campo">
        <label htmlFor="nova">Nova senha</label>
        <input id="nova" name="nova" type="password" autoComplete="new-password" minLength={10} required aria-describedby="regra" />
        <span id="regra" className="dica">
          Mínimo de 10 caracteres, com letras e números.
        </span>
      </div>
      <div className="campo">
        <label htmlFor="confirmacao">Repita a nova senha</label>
        <input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" required />
      </div>
      {estado?.erro && (
        <p className="form-erro" role="alert">
          {estado.erro}
        </p>
      )}
      <button type="submit" className="botao" disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
