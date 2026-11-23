"use client";

import { useActionState, useState } from "react";
import { entrar, type EstadoForm } from "@/app/acoes-auth";
import { cls, IconeCadeado, IconeEmail, IconeOlho, IconeOlhoFechado, IconeSeta } from "@/components/acesso/ui";

export default function FormLogin({ destino }: { destino: string }) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(entrar, undefined);
  const [ver, setVer] = useState(false);
  const [ajuda, setAjuda] = useState(false);

  return (
    <form action={acao} className={cls.form} noValidate>
      <input type="hidden" name="destino" value={destino} />
      <div className={cls.campo}>
        <label htmlFor="email" className={cls.label}>
          E-mail
        </label>
        <div className={cls.caixaInput}>
          <IconeEmail className={cls.iconeInput} />
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Seu e-mail"
            className={cls.input}
            autoComplete="username"
            required
            autoFocus={!estado?.email}
            defaultValue={estado?.email}
            key={estado?.email ?? ""}
          />
        </div>
      </div>
      <div className={cls.campo}>
        <label htmlFor="senha" className={cls.label}>
          Senha
        </label>
        <div className={cls.caixaInput}>
          <IconeCadeado className={cls.iconeInput} />
          <input
            id="senha"
            name="senha"
            type={ver ? "text" : "password"}
            placeholder="Sua senha"
            className={`${cls.input} pr-12`}
            autoComplete="current-password"
            required
            autoFocus={!!estado?.email}
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            aria-pressed={ver}
            aria-label={ver ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-2 top-1/2 grid size-9 border-0 bg-transparent p-0 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          >
            {ver ? <IconeOlhoFechado className="size-5" /> : <IconeOlho className="size-5" />}
          </button>
        </div>
        <div className="text-right">
          <button
            type="button"
            onClick={() => setAjuda((a) => !a)}
            aria-expanded={ajuda}
            className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-brand-red-700 hover:text-brand-red-900 hover:underline"
          >
            Esqueceu a senha?
          </button>
          {ajuda && <p className="mt-1 text-sm text-stone-600">Fale com o administrador do painel para redefinir seu acesso.</p>}
        </div>
      </div>
      {estado?.erro && (
        <p className={cls.erro} role="alert">
          {estado.erro}
        </p>
      )}
      <button type="submit" className={cls.botao} disabled={enviando}>
        {enviando ? (
          "Entrando…"
        ) : (
          <>
            Entrar <IconeSeta className="size-5" />
          </>
        )}
      </button>
    </form>
  );
}
