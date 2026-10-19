import { useState } from "react";
import Icon from "./Icon.jsx";
import { ModalityPill, IntegrationStatusBadge, patientFullName } from "./common.jsx";
import { patientToFHIR, orderToServiceRequest, studyToImagingStudy, reportToDiagnosticReport } from "../lib/fhir.js";
import { fmtDate } from "../lib/format.js";

export default function InteropView({ studies, orders, patients, diagnosticReports, integrationMessages, connections = [], onRetryMessage, onSendReport }) {
  const publishable = diagnosticReports.filter((r) => r.status === "published" || r.status === "validated");
  const [selectedId, setSelectedId] = useState(publishable[0]?.id || "");
  const [resourceKind, setResourceKind] = useState("report");
  const [connFilter, setConnFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const run = async (label, fn) => { setBusy(label); setNotice(""); try { await fn(); } catch (err) { setNotice(err.message); } finally { setBusy(""); } };
  const selectedReport = diagnosticReports.find((r) => r.id === selectedId) || publishable[0];
  const selectedStudy = selectedReport ? studies.find((s) => s.id === selectedReport.studyId) : null;
  const selectedOrder = selectedStudy ? orders.find((o) => o.id === selectedStudy.orderId) : null;
  const selectedPatient = selectedStudy ? patients.find((p) => p.id === selectedStudy.patientId) : null;

  let json = null;
  if (selectedReport && selectedStudy && selectedPatient) {
    if (resourceKind === "report") json = reportToDiagnosticReport(selectedReport, selectedOrder, selectedStudy);
    else if (resourceKind === "patient") json = patientToFHIR(selectedPatient);
    else if (resourceKind === "order") json = orderToServiceRequest(selectedOrder, selectedStudy);
    else if (resourceKind === "imagingStudy" && selectedStudy.modality !== "LAB") json = studyToImagingStudy(selectedStudy, selectedPatient.id);
  }

  const connName = (id) => connections.find((c) => c.id === id)?.name || "la clínica";
  const shownMessages = connFilter === "all" ? integrationMessages : integrationMessages.filter((m) => m.connectionId === connFilter);

  return (
    <div>
      <div className="dos-card" style={{ marginBottom: 16 }}>
        <div className="dos-card-header"><h3>Vista previa de recurso FHIR</h3></div>
        <div style={{ padding: "0 16px", fontSize: 12, color: "var(--ink-dim)" }}>Recurso FHIR completo del informe. Lo que se envía a cada clínica depende de lo que su sistema sabe recibir.</div>
        <div style={{ padding: 16 }}>
          {publishable.length === 0 ? (
            <div className="dos-empty"><Icon name="FileJson" size={26} /><div>Valida un informe para generar sus recursos FHIR.</div></div>
          ) : (
            <>
              <div className="dos-field-row" style={{ maxWidth: 480 }}>
                <div className="dos-field">
                  <label>Informe</label>
                  <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                    {publishable.map((r) => {
                      const st = studies.find((s) => s.id === r.studyId);
                      const pt = patients.find((p) => p.id === st?.patientId);
                      return <option key={r.id} value={r.id}>{st?.serviceName} — {patientFullName(pt)}</option>;
                    })}
                  </select>
                </div>
                <div className="dos-field">
                  <label>Recurso</label>
                  <select value={resourceKind} onChange={(e) => setResourceKind(e.target.value)}>
                    <option value="report">DiagnosticReport</option>
                    <option value="patient">Patient</option>
                    <option value="order">ServiceRequest</option>
                    {selectedStudy && selectedStudy.modality !== "LAB" && <option value="imagingStudy">ImagingStudy</option>}
                  </select>
                </div>
              </div>
              {selectedOrder?.connectionId && (
                <div style={{ margin: "4px 0 10px", fontSize: 12.5, color: "var(--ink-dim)" }}>
                  Orden enviada por <strong>{connName(selectedOrder.connectionId)}</strong>: el informe vuelve solo a esa clínica.
                </div>
              )}
              {onSendReport && selectedReport?.status === "published" && selectedOrder?.connectionId && (
                <div style={{ margin: "4px 0 10px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button className="dos-btn dos-btn-sm" disabled={busy === "send"} onClick={() => run("send", async () => { const r = await onSendReport(selectedReport.id); setNotice(r?.ok ? "" : r?.message?.lastError || r?.message?.payloadSummary || "No se pudo enviar."); })}>
                    <Icon name="Share2" size={13} /> {busy === "send" ? "Enviando…" : `Enviar este informe a ${connName(selectedOrder.connectionId)}`}
                  </button>
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Útil para informes publicados antes de configurar la conexión.</span>
                </div>
              )}
              {notice && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 8 }}>{notice}</div>}
              <pre className="dos-json">{JSON.stringify(json, null, 2)}</pre>
            </>
          )}
        </div>
      </div>


      <div className="dos-card">
        <div className="dos-card-header">
          <h3>Registro de mensajes de integración</h3>
          {connections.length > 1 && (
            <select value={connFilter} onChange={(e) => setConnFilter(e.target.value)} style={{ maxWidth: 220 }}>
              <option value="all">Todas las clínicas</option>
              {connections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
        {shownMessages.length === 0 ? (
          <div className="dos-empty"><Icon name="Radio" size={26} /><div>Ningún mensaje se ha registrado todavía.</div></div>
        ) : (
          <div style={{ padding: "4px 16px" }}>
            {shownMessages.map((m) => (
              <div className="dos-log-item" key={m.id}>
                <span className="dos-log-dot" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{m.type} <span style={{ color: "var(--ink-dim)", fontWeight: 400 }}>· {m.direction === "inbound" ? `${m.source} → Diagnostic OS` : `Diagnostic OS → ${m.destination}`}</span></div>
                  <div style={{ fontSize: 12, color: "var(--ink-dim)" }} className="dos-mono">{m.payloadSummary} · corr: {m.correlationId} · intentos: {m.attempts}</div>
                  {m.status === "failed" && m.lastError && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 2 }}>{m.lastError}</div>}
                  {m.status === "failed" && (
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                      {m.nextRetryAt ? `Se reintentará automáticamente: ${fmtDate(m.nextRetryAt)}` : "No se reintenta sola: corrige la causa y pulsa Reintentar."}
                    </div>
                  )}
                </div>
                {m.status === "failed" && onRetryMessage && m.direction === "outbound" && (
                  <button className="dos-btn dos-btn-sm" disabled={busy === `retry-${m.id}`} onClick={() => run(`retry-${m.id}`, () => onRetryMessage(m.id))}>Reintentar</button>
                )}
                <IntegrationStatusBadge status={m.status} />
                <div className="dos-mono" style={{ fontSize: 11.5, color: "var(--ink-faint)", whiteSpace: "nowrap" }}>{fmtDate(m.updatedAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
