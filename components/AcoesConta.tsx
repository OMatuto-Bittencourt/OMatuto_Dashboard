"use client";

import { useActionState } from "react";
import { alternarAtivo, redefinirSenha, type EstadoAdmin } from "@/app/acoes-admin";
import SenhaTemporaria from "./SenhaTemporaria";

export default function AcoesConta({ id, nome, ativo }: { id: string; nome: string; ativo: boolean }) {
  const [estAtivo, acaoAtivo, pendAtivo] = useActionState<EstadoAdmin, FormData>(alternarAtivo, undefined);
  const [estSenha, acaoSenha, pendSenha] = useActionState<EstadoAdmin, FormData>(redefinirSenha, undefined);
  const confirmar = (msg: string) => (e: React.FormEvent) => {
    if (!window.confirm(msg)) e.preventDefault();
  };
  const erro = estAtivo?.erro ?? estSenha?.erro;

  return (
    <div className="acoes-conta">
      <div className="acoes-botoes">
        {ativo && (
          <form action={acaoSenha} onSubmit={confirmar(`Gerar nova senha temporária para ${nome}? A senha atual deixa de valer.`)}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="link-acao" disabled={pendSenha}>
              Redefinir senha
            </button>
          </form>
        )}
        <form
          action={acaoAtivo}
          onSubmit={confirmar(ativo ? `Desativar ${nome}? O acesso é bloqueado na hora.` : `Reativar ${nome}?`)}
        >
          <input type="hidden" name="id" value={id} />
          <button type="submit" className={`link-acao${ativo ? " perigo" : ""}`} disabled={pendAtivo}>
            {ativo ? "Desativar" : "Reativar"}
          </button>
        </form>
      </div>
      {erro && <div className="small form-erro">{erro}</div>}
      {estSenha?.senha && estSenha.email && <SenhaTemporaria email={estSenha.email} senha={estSenha.senha} />}
    </div>
  );
}
