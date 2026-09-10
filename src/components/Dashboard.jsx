import { useMemo } from "react";
import Icon from "./Icon.jsx";
import { ModalityPill, StudyStatusBadge, patientFullName } from "./common.jsx";
import { fmtDate } from "../lib/format.js";

export default function Dashboard({ patients, orders, studies, results, diagnosticReports, integrationMessages, currentRole, setView }) {
  const myStudies = useMemo(
    () => studies.filter((s) => currentRole.manage || currentRole.scope.includes(s.modality)),
    [studies, currentRole]
  );

  const completedWithTiming = myStudies.filter((s) => s.status === "completed" && s.completedAt && s.scheduledAt);
  const avgTatHours = completedWithTiming.length
    ? (
        completedWithTiming.reduce((sum, s) => sum + (new Date(s.completedAt) - new Date(s.scheduledAt)), 0) /
        completedWithTiming.length /
        3600000
      ).toFixed(1)
    : null;

  const counts = {
    ordersToday: orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length,
    pendingStudies: myStudies.filter((s) => s.status !== "completed" && s.status !== "cancelled").length,
    pendingValidation: diagnosticReports.filter((r) => r.status === "pending-validation" || r.status === "draft").length,
    integrationErrors: integrationMessages.filter((m) => m.status === "failed").length,
  };

  const criticalResults = results.filter((r) => r.flag === "critico");
  const failedIntegrations = integrationMessages.filter((m) => m.status === "failed" || m.status === "retrying");
  const possibleDuplicates = patients.filter((p) => p.matchStatus === "posible_duplicado");

  const patientName = (id) => patientFullName(patients.find((p) => p.id === id));
  const recentStudies = [...myStudies].sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)).slice(0, 6);

  return (
    <div>
      <div className="dos-grid">
        <div className="dos-metric"><p className="dos-metric-label">Órdenes de hoy</p><p className="dos-metric-value">{counts.ordersToday}</p></div>
        <div className="dos-metric"><p className="dos-metric-label">Estudios pendientes</p><p className="dos-metric-value" style={{ color: "var(--amber)" }}>{counts.pendingStudies}</p></div>
        <div className="dos-metric"><p className="dos-metric-label">Informes por validar</p><p className="dos-metric-value" style={{ color: "var(--blue)" }}>{counts.pendingValidation}</p></div>
        <div className="dos-metric"><p className="dos-metric-label">Errores de integración</p><p className="dos-metric-value" style={{ color: "var(--red)" }}>{counts.integrationErrors}</p></div>
        <div className="dos-metric"><p className="dos-metric-label">TAT promedio</p><p className="dos-metric-value">{avgTatHours !== null ? `${avgTatHours}h` : "—"}</p><p className="dos-metric-sub">Desde agendado hasta completado</p></div>
      </div>

      {(criticalResults.length > 0 || failedIntegrations.length > 0 || possibleDuplicates.length > 0) && (
        <div className="dos-card" style={{ marginBottom: 16 }}>
          <div className="dos-card-header"><h3>Alertas</h3></div>
          {criticalResults.map((r) => (
            <div className="dos-alert-row" key={r.id}><Icon name="AlertTriangle" size={14} color="var(--red)" /> Resultado crítico: <strong>{r.analyte}</strong> = {r.value} {r.unit}</div>
          ))}
          {failedIntegrations.map((m) => (
            <div className="dos-alert-row" key={m.id}><Icon name="AlertTriangle" size={14} color="var(--red)" /> Integración {m.status === "failed" ? "con error" : "reintentando"}: {m.type} hacia {m.destination}</div>
          ))}
          {possibleDuplicates.map((p) => (
            <div className="dos-alert-row" key={p.id}><Icon name="AlertTriangle" size={14} color="var(--coral)" /> Paciente posible duplicado: {p.firstName} {p.lastName}</div>
          ))}
        </div>
      )}

      <div className="dos-card">
        <div className="dos-card-header">
          <h3>Mi bandeja — {currentRole.label}</h3>
          <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setView(myStudies.some((s) => s.modality === "LAB") ? "lab" : "imaging")}>Ver todo <Icon name="ChevronRight" size={13} /></button>
        </div>
        {recentStudies.length === 0 ? (
          <div className="dos-empty"><Icon name="ClipboardList" size={26} /><div>No hay estudios en tu alcance todavía.</div></div>
        ) : (
          <table className="dos-table">
            <thead><tr><th>Paciente</th><th>Estudio</th><th>Modalidad</th><th>Fecha</th><th>Estado</th></tr></thead>
            <tbody>
              {recentStudies.map((s) => (
                <tr key={s.id}>
                  <td>{patientName(s.patientId)}</td>
                  <td>{s.serviceName}</td>
                  <td><ModalityPill modality={s.modality} /></td>
                  <td className="dos-mono">{fmtDate(s.scheduledAt)}</td>
                  <td><StudyStatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
