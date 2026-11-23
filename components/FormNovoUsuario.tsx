"use client";

import { useActionState } from "react";
import { criarUsuario, type EstadoAdmin } from "@/app/acoes-admin";
import SenhaTemporaria from "./SenhaTemporaria";

const ROTULO: Record<string, string> = { usuario: "Usuário (só consulta o painel)", admin: "Admin (também cria contas de usuário)" };

export default function FormNovoUsuario({ perfis }: { perfis: string[] }) {
  const [estado, acao, enviando] = useActionState<EstadoAdmin, FormData>(criarUsuario, undefined);
  return (
    <div>
      <form action={acao} className="form" key={estado?.ok ?? "novo"}>
        <div className="campo">
          <label htmlFor="nome">Nome</label>
          <input id="nome" name="nome" required minLength={3} maxLength={120} autoComplete="off" />
        </div>
        <div className="campo">
          <label htmlFor="email-novo">E-mail</label>
          <input id="email-novo" name="email" type="email" required autoComplete="off" />
        </div>
        <div className="campo">
          <label htmlFor="perfil">Perfil</label>
          <select id="perfil" name="perfil" defaultValue="usuario">
            {perfis.map((p) => (
              <option key={p} value={p}>
                {ROTULO[p] ?? p}
              </option>
            ))}
          </select>
        </div>
        {estado?.erro && (
          <p className="form-erro" role="alert">
            {estado.erro}
          </p>
        )}
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? "Criando…" : "Criar conta"}
        </button>
      </form>
      {estado?.ok && <p className="form-ok">{estado.ok}</p>}
      {estado?.senha && estado.email && <SenhaTemporaria email={estado.email} senha={estado.senha} />}
    </div>
  );
}
