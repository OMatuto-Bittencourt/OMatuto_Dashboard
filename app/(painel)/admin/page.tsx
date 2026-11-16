import type { Metadata } from "next";
import AcoesConta from "@/components/AcoesConta";
import BarChart from "@/components/BarChart";
import FormNovoUsuario from "@/components/FormNovoUsuario";
import { exigirAdmin, perfisPermitidos, podeGerenciar } from "@/lib/auth";
import { fmtInt, fmtMes } from "@/lib/format";
import { criacoesPorMes, eventosRecentes, listarContas, resumoPorCriador } from "@/lib/usuarios";

export const metadata: Metadata = { title: "Usuários · MTO" };
export const dynamic = "force-dynamic";

const PERFIL: Record<string, string> = { master: "Master", admin: "Admin", usuario: "Usuário" };
const ACAO: Record<string, string> = {
  criado: "criou a conta de",
  desativado: "desativou",
  reativado: "reativou",
  senha_redefinida: "redefiniu a senha de",
  senha_alterada: "trocou a própria senha",
};

/** "YYYY-MM-DD HH:MI" -> "DD/MM/AAAA HH:MI" */
function dataHora(v: string | null): string {
  if (!v) return "–";
  const [d, h] = v.split(" ");
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}${h ? ` ${h}` : ""}`;
}

export default async function AdminPage() {
  const ator = await exigirAdmin();
  const [contas, porCriador, porMes, eventos] = await Promise.all([
    listarContas(),
    resumoPorCriador(),
    criacoesPorMes(),
    eventosRecentes(30),
  ]);

  const ativas = contas.filter((c) => c.ativo);
  const admins = ativas.filter((c) => c.perfil !== "usuario").length;
  const mesAtual = porMes[porMes.length - 1];
  const pendentes = ativas.filter((c) => c.trocar_senha).length;

  return (
    <>
      <h1>Usuários</h1>
      <p className="sub">
        Contas de acesso ao painel. {ator.perfil === "master" ? "Como master, você cria admins e usuários." : "Como admin, você cria contas de usuário."}
      </p>

      <section className="grid kpis">
        <div className="card kpi">
          <div className="label">Contas ativas</div>
          <div className="value">{fmtInt(ativas.length)}</div>
          <div className="hint">{contas.length - ativas.length} desativadas</div>
        </div>
        <div className="card kpi">
          <div className="label">Master e admins</div>
          <div className="value">{fmtInt(admins)}</div>
          <div className="hint">podem criar contas</div>
        </div>
        <div className="card kpi">
          <div className="label">Criadas em {mesAtual ? fmtMes(mesAtual.mes) : "–"}</div>
          <div className="value">{fmtInt(mesAtual?.contas ?? 0)}</div>
          <div className="hint">no mês atual</div>
        </div>
        <div className="card kpi">
          <div className="label">Aguardando 1º acesso</div>
          <div className="value">{fmtInt(pendentes)}</div>
          <div className="hint">ainda com senha temporária</div>
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <h2>Contas criadas por mês</h2>
          <BarChart
            titulo="Contas criadas por mês"
            dados={porMes.map((m) => ({ rotulo: fmtMes(m.mes), valor: m.contas }))}
            formato="int"
            altura={200}
          />
        </div>
        <div className="card">
          <h2>Quem criou as contas</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Responsável</th>
                  <th className="num">Contas</th>
                  <th className="num">Ativas</th>
                  <th>Última criação</th>
                </tr>
              </thead>
              <tbody>
                {porCriador.map((r) => (
                  <tr key={r.criador}>
                    <td>{r.criador}</td>
                    <td className="num">{fmtInt(r.contas)}</td>
                    <td className="num">{fmtInt(r.ativas)}</td>
                    <td>{dataHora(r.ultima)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid admin-grid">
        <div className="card">
          <h2>Nova conta</h2>
          <FormNovoUsuario perfis={perfisPermitidos(ator)} />
        </div>

        <div className="card">
          <h2>Contas</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Perfil</th>
                  <th>Situação</th>
                  <th>Criada por / em</th>
                  <th>Último acesso</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contas.map((c) => (
                  <tr key={c.id} className={c.ativo ? undefined : "inativa"}>
                    <td>
                      {c.nome ?? "–"}
                      <div className="muted small">{c.email}</div>
                    </td>
                    <td>
                      <span className="badge">{PERFIL[c.perfil] ?? c.perfil}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {!c.ativo ? (
                        <span className="badge crit">Desativada</span>
                      ) : c.trocar_senha ? (
                        <span className="badge warn">Aguardando 1º acesso</span>
                      ) : (
                        <span className="badge ok">Ativa</span>
                      )}
                    </td>
                    <td>
                      {c.criado_por_nome ?? <span className="muted">Criado no banco</span>}
                      <div className="muted small" style={{ whiteSpace: "nowrap" }}>
                        {dataHora(c.criado_em)}
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{dataHora(c.ultimo_login)}</td>
                    <td>
                      {podeGerenciar(ator, c) ? (
                        <AcoesConta id={c.id} nome={c.nome ?? c.email} ativo={c.ativo} />
                      ) : (
                        <span className="muted small">{c.id === ator.id ? "Você" : "–"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Histórico</h2>
        {eventos.length === 0 ? (
          <p className="muted">Nenhum evento registrado.</p>
        ) : (
          <ul className="historico">
            {eventos.map((e, i) => (
              <li key={i}>
                <span className="muted small">{dataHora(e.em)}</span>
                <span>
                  {e.acao === "senha_alterada" ? (
                    <>
                      <b>{e.usuario}</b> {ACAO[e.acao]}
                    </>
                  ) : (
                    <>
                      <b>{e.ator ?? "Banco de dados"}</b> {ACAO[e.acao] ?? e.acao} <b>{e.usuario}</b>
                      {e.acao === "criado" && e.detalhes?.perfil ? ` (${PERFIL[String(e.detalhes.perfil)] ?? e.detalhes.perfil})` : ""}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
