import Icon from "./Icon.jsx";
import { MODALITIES, STUDY_STATUSES, REPORT_STATUSES, INTEGRATION_STATUSES, PRIORITIES } from "../data/catalogs.js";
import { fmtDate } from "../lib/format.js";

export function ModalityPill({ modality }) {
  const m = MODALITIES[modality];
  if (!m) return null;
  return (
    <span className={`dos-pill dos-pill-${m.ramp}`}>
      <Icon name={m.icon} size={12} /> {m.code}
    </span>
  );
}

function toneClass(tone) {
  return { amber: "dos-tone-amber", blue: "dos-tone-blue", green: "dos-tone-green", coral: "dos-tone-coral", red: "dos-tone-red", teal: "dos-tone-teal" }[tone] || "dos-tone-amber";
}

export function StudyStatusBadge({ status }) {
  const m = STUDY_STATUSES[status] || STUDY_STATUSES.scheduled;
  return (
    <span className={`dos-pill ${toneClass(m.tone)}`}>
      <Icon name={m.icon} size={12} /> {m.label}
    </span>
  );
}

export function ReportStatusBadge({ status }) {
  const m = REPORT_STATUSES[status] || REPORT_STATUSES.draft;
  return <span className={`dos-pill ${toneClass(m.tone)}`}>{m.label}</span>;
}

export function IntegrationStatusBadge({ status }) {
  const m = INTEGRATION_STATUSES[status] || INTEGRATION_STATUSES.pending;
  return <span className={`dos-pill ${toneClass(m.tone)}`}>{m.label}</span>;
}

export function PriorityBadge({ priority }) {
  const m = PRIORITIES[priority] || PRIORITIES.rutina;
  return <span className={`dos-pill ${toneClass(m.tone)}`}>{m.label}</span>;
}

export function patientFullName(patient) {
  if (!patient) return "—";
  return `${patient.firstName} ${patient.lastName}`;
}

export function StudyTable({ rows, onOpen, emptyLabel, emptyIconName }) {
  if (rows.length === 0) {
    return (
      <div className="dos-empty">
        <Icon name={emptyIconName} size={26} />
        <div>{emptyLabel}</div>
      </div>
    );
  }
  return (
    <table className="dos-table">
      <thead>
        <tr><th>Paciente</th><th>Estudio</th><th>Orden</th><th>Fecha</th><th>Prioridad</th><th>Estado</th><th></th></tr>
      </thead>
      <tbody>
        {rows.map(({ study, order, patient }) => (
          <tr className="dos-row" key={study.id} onClick={() => onOpen(study)}>
            <td>{patientFullName(patient)}</td>
            <td>{study.serviceName}</td>
            <td className="dos-mono" style={{ fontSize: 11.5 }}>{order?.id}{order?.sourceType !== "interno" ? ` · ${order.sourceType}` : ""}</td>
            <td className="dos-mono">{fmtDate(study.scheduledAt)}</td>
            <td><PriorityBadge priority={order?.priority} /></td>
            <td><StudyStatusBadge status={study.status} /></td>
            <td style={{ textAlign: "right" }}><Icon name="ChevronRight" size={15} color="var(--ink-faint)" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
