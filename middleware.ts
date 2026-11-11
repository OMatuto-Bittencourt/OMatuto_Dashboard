import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerSessao } from "@/lib/sessao-token";

// Barreira rapida: sem sessao assinada valida, vai para o login.
// A conferencia completa (usuario ativo, versao da senha) acontece no servidor, em lib/auth.ts.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  if (!lerSessao(req.cookies.get(COOKIE_SESSAO)?.value)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?destino=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|brand/|icon.jpg|favicon.ico).*)"],
};
