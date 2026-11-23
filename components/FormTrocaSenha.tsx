"use client";

import { useActionState } from "react";
import { trocarSenha, type EstadoForm } from "@/app/acoes-auth";
import { cls, IconeCadeado } from "@/components/acesso/ui";

function CampoSenha(props: { id: string; label: string; autoComplete: string; dica?: string; autoFocus?: boolean; minLength?: number }) {
  const { id, label, dica, ...resto } = props;
  return (
    <div className={cls.campo}>
      <label htmlFor={id} className={cls.label}>
        {label}
      </label>
      <div className={cls.caixaInput}>
        <IconeCadeado className={cls.iconeInput} />
        <input id={id} name={id} type="password" className={cls.input} required aria-describedby={dica ? `${id}-dica` : undefined} {...resto} />
      </div>
      {dica && (
        <span id={`${id}-dica`} className={cls.dica}>
          {dica}
        </span>
      )}
    </div>
  );
}

export default function FormTrocaSenha() {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(trocarSenha, undefined);
  return (
    <form action={acao} className={cls.form} noValidate>
      <CampoSenha id="atual" label="Senha atual" autoComplete="current-password" autoFocus />
      <CampoSenha id="nova" label="Nova senha" autoComplete="new-password" minLength={10} dica="Mínimo de 10 caracteres, com letras e números." />
      <CampoSenha id="confirmacao" label="Repita a nova senha" autoComplete="new-password" />
      {estado?.erro && (
        <p className={cls.erro} role="alert">
          {estado.erro}
        </p>
      )}
      <button type="submit" className={cls.botao} disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
