import { NextResponse, type NextRequest } from "next/server";

// Protecao por HTTP Basic Auth. O dashboard exibe dados de folha: sem usuario/senha configurados, nada e servido.
export function middleware(req: NextRequest) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;
  if (!user || !pass) {
    return new NextResponse("Dashboard sem credenciais configuradas (DASHBOARD_USER / DASHBOARD_PASSWORD).", { status: 503 });
  }

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const [u, ...rest] = atob(header.slice(6)).split(":");
      if (seguroIgual(u, user) && seguroIgual(rest.join(":"), pass)) return NextResponse.next();
    } catch {
      /* cabecalho invalido */
    }
  }
  return new NextResponse("Autenticação necessária.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="O Matuto Dashboard", charset="UTF-8"' },
  });
}

function seguroIgual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
