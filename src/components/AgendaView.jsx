import Icon from "./Icon.jsx";
import { ModalityPill } from "./common.jsx";
import { fmtDate } from "../lib/format.js";

export default function AgendaView({ appointments, onImportAppointment, onRefresh }) {
  return (
    <div className="dos-card">
      <div className="dos-card-header">
        <h3>Citas por confirmar</h3>
        <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={onRefresh}><Icon name="ArrowLeftRight" size={13} /> Actualizar</button>
      </div>
      {appointments.length === 0 ? (
        <div className="dos-empty"><Icon name="CalendarClock" size={26} /><div>No hay citas pendientes. Las reservas hechas desde la página en línea o desde tu sistema de agendamiento aparecerán aquí.</div></div>
      ) : (
        appointments.map((a) => (
          <div className="dos-appt-item" key={a.id}>
            <div className="dos-appt-icon"><Icon name="CalendarClock" size={15} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{a.patientName}</div>
              <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>{a.serviceName} · <ModalityPill modality={a.modality} /> {a.source ? `· vía ${a.source}` : ""}</div>
              <div className="dos-mono" style={{ fontSize: 11, color: "var(--ink-faint)" }}>{fmtDate(a.scheduledAt)}</div>
            </div>
            <button className="dos-btn dos-btn-sm" onClick={() => onImportAppointment(a)}>Confirmar y crear orden</button>
          </div>
        ))
      )}
      <p style={{ fontSize: 11.5, color: "var(--ink-faint)", padding: "10px 16px 14px", margin: 0, borderTop: "1px solid var(--line)" }}>
        Esta bandeja recibe tanto las citas de tu sistema de agendamiento externo como las hechas por pacientes desde la página de reservas en línea del centro.
      </p>
    </div>
  );
}
