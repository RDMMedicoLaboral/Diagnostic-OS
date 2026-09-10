import Icon from "./Icon.jsx";
import { fmtDate } from "../lib/format.js";

const ACTION_LABELS = {
  "order.create": "Creó una orden",
  "study.status": "Cambió el estado de un estudio",
  "result.save": "Guardó resultados",
  "result.critical_notified": "Confirmó notificación de valor crítico",
  "specimen.reject": "Rechazó una muestra y registró nueva toma",
  "report.validate": "Validó un informe",
  "report.publish": "Publicó un informe",
  "report.amend": "Corrigió un informe publicado",
  "integration.simulate": "Simuló un evento de integración",
  "appointment.import": "Importó una cita externa",
};

export default function AuditView({ auditEvents }) {
  return (
    <div className="dos-card">
      <div className="dos-card-header"><h3>Registro de auditoría</h3></div>
      {auditEvents.length === 0 ? (
        <div className="dos-empty"><Icon name="ClipboardList" size={26} /><div>Todavía no hay eventos registrados.</div></div>
      ) : (
        <table className="dos-table">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalle</th></tr></thead>
          <tbody>
            {[...auditEvents].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((ev) => (
              <tr key={ev.id}>
                <td className="dos-mono" style={{ fontSize: 12 }}>{fmtDate(ev.timestamp)}</td>
                <td>{ev.userName}</td>
                <td>{ACTION_LABELS[ev.action] || ev.action}</td>
                <td className="dos-mono" style={{ fontSize: 11.5 }}>{ev.entityType} · {ev.entityId}</td>
                <td style={{ fontSize: 12, color: "var(--ink-dim)" }}>{ev.after ? JSON.stringify(ev.after) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
