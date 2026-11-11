"use client";

export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card error">
      <h1>Não foi possível carregar os dados</h1>
      <p className="sub">
        Verifique a conexão com o banco (variável <code>DATABASE_URL</code>) e tente novamente.
        {error.digest && <span className="muted"> Código: {error.digest}</span>}
      </p>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  );
}
