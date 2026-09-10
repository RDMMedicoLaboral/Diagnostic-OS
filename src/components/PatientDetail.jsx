import { Fragment } from "react";
import Icon from "./Icon.jsx";
import { initialsOf, fmtDate } from "../lib/format.js";
import { ModalityPill, StudyStatusBadge, ReportStatusBadge } from "./common.jsx";

const MATCH_META = {
  confirmado: { label: "Identidad confirmada", tone: "green", icon: "CheckCircle2" },
  pendiente: { label: "Pendiente de confirmar identidad", tone: "amber", icon: "Clock" },
  posible_duplicado: { label: "Posible duplicado — requiere revisión", tone: "coral", icon: "AlertTriangle" },
};

export default function PatientDetail({ patient, orders, studies, diagnosticReports, onBack, onOpenStudy }) {
  const match = MATCH_META[patient.matchStatus] || MATCH_META.confirmado;
  const patientOrders = orders.filter((o) => o.patientId === patient.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const patientStudies = studies.filter((s) => s.patientId === patient.id);
  const reportOf = (studyId) => diagnosticReports.find((r) => r.studyId === studyId);

  return (
    <div>
      <button className="dos-btn dos-btn-ghost dos-btn-sm" style={{ marginBottom: 12 }} onClick={onBack}>
        <Icon name="ArrowRight" size={13} style={{ transform: "rotate(180deg)" }} /> Volver a pacientes
      </button>

      <div className="dos-card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16 }}>
          <div className="dos-avatar" style={{ width: 48, height: 48, fontSize: 16 }}>{initialsOf(`${patient.firstName} ${patient.lastName}`)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{patient.firstName} {patient.lastName}</div>
            <div className="dos-mono" style={{ fontSize: 12, color: "var(--ink-dim)" }}>
              {patient.documentType === "cedula" ? "C.I." : patient.documentType === "ruc" ? "RUC" : "Pas."} {patient.documentNumber} · {patient.sex} · nac. {patient.birthDate || "—"}
            </div>
          </div>
          <span className={`dos-pill dos-tone-${match.tone}`}><Icon name={match.icon} size={12} /> {match.label}</span>
        </div>

        <div className="dos-section-title" style={{ margin: "0 16px 6px" }}>Identificadores</div>
        <div style={{ padding: "0 16px 14px" }}>
          <dl className="dos-kv">
            <dt>ID interno</dt><dd className="dos-mono">{patient.id}</dd>
            {patient.sourceSystem && <><dt>Sistema de origen</dt><dd>{patient.sourceSystem}</dd></>}
            {patient.sourcePatientId && <><dt>ID en origen</dt><dd className="dos-mono">{patient.sourcePatientId}</dd></>}
            {(patient.externalIdentifiers || []).map((ei, i) => (
              <Fragment key={i}>
                <dt>{ei.type} ({ei.system})</dt>
                <dd className="dos-mono">{ei.value}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      </div>

      <div className="dos-card">
        <div className="dos-card-header"><h3>Historial de órdenes y estudios</h3></div>
        {patientOrders.length === 0 ? (
          <div className="dos-empty"><Icon name="ClipboardList" size={26} /><div>Este paciente aún no tiene órdenes.</div></div>
        ) : (
          <div>
            {patientOrders.map((order) => {
              const orderStudies = patientStudies.filter((s) => s.orderId === order.id);
              return (
                <div key={order.id} style={{ borderBottom: "1px solid var(--line)", padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <div>
                      <span className="dos-mono" style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{order.id}</span>
                      {" · "}<span style={{ fontSize: 13 }}>{order.reason || "Sin motivo especificado"}</span>
                    </div>
                    <span className="dos-mono" style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>{fmtDate(order.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-dim)", marginBottom: 8 }}>
                    Origen: {order.sourceType === "interno" ? "Creación interna" : `${order.sourceType} (${order.sourceSystem || "externo"})`}
                    {order.requestingPractitioner?.name ? ` · Solicitante: ${order.requestingPractitioner.name}` : ""}
                  </div>
                  {orderStudies.map((study) => {
                    const report = reportOf(study.id);
                    return (
                      <div key={study.id} className="dos-row" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6 }} onClick={() => onOpenStudy(study)}>
                        <ModalityPill modality={study.modality} />
                        <span style={{ fontSize: 13, flex: 1 }}>{study.serviceName}</span>
                        <StudyStatusBadge status={study.status} />
                        {report && <ReportStatusBadge status={report.status} />}
                        <Icon name="ChevronRight" size={14} color="var(--ink-faint)" />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
