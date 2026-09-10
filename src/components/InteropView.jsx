import { useState } from "react";
import Icon from "./Icon.jsx";
import { ModalityPill, IntegrationStatusBadge, patientFullName } from "./common.jsx";
import { patientToFHIR, orderToServiceRequest, studyToImagingStudy, reportToDiagnosticReport } from "../lib/fhir.js";
import { fmtDate } from "../lib/format.js";

const FIXED_CONNECTORS = [
  { id: "hce", name: "HCE Ecosistema (propia)", type: "HCE", protocol: "FHIR R4", status: "Conectado", icon: "Building2" },
  { id: "agenda", name: "Sistema de agendamiento (propio)", type: "Agenda", protocol: "REST", status: "Conectado", icon: "CalendarClock" },
];

const DEFAULT_THIRD_PARTY = { name: "Conector de terceros", type: "HIS / LIS / RIS / PACS", protocol: "A definir por contrato", baseUrl: "", apiKey: "", status: "No configurado" };

export default function InteropView({ studies, orders, patients, diagnosticReports, integrationMessages, onSimulate, tenant, canEditConnectors = false, onUpdateConnector }) {
  const publishable = diagnosticReports.filter((r) => r.status === "published" || r.status === "validated");
  const [selectedId, setSelectedId] = useState(publishable[0]?.id || "");
  const [resourceKind, setResourceKind] = useState("report");
  const [editingConnector, setEditingConnector] = useState(false);
  const thirdParty = { ...DEFAULT_THIRD_PARTY, ...(tenant?.thirdPartyConnector || {}) };
  const [connForm, setConnForm] = useState(thirdParty);
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

  const startEdit = () => { setConnForm(thirdParty); setEditingConnector(true); };
  const saveConnector = () => {
    const status = connForm.baseUrl?.trim() ? "Conectado" : "No configurado";
    onUpdateConnector?.({ ...connForm, name: connForm.name?.trim() || DEFAULT_THIRD_PARTY.name, status });
    setEditingConnector(false);
  };
  const disconnectThirdParty = () => {
    onUpdateConnector?.({ ...DEFAULT_THIRD_PARTY });
    setEditingConnector(false);
  };

  const CONNECTORS = [...FIXED_CONNECTORS, { id: "terceros", name: thirdParty.name, type: thirdParty.type, protocol: thirdParty.protocol, status: thirdParty.status, icon: "Radio" }];

  return (
    <div>
      <div className="dos-card" style={{ marginBottom: 16 }}>
        <div className="dos-card-header"><h3>Sistemas conectados</h3></div>
        {CONNECTORS.map((c) => (
          <div className="dos-conn-card" key={c.id}>
            <div className="dos-conn-icon"><Icon name={c.icon} size={16} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13.5 }}>{c.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>{c.type} · {c.protocol}</div>
            </div>
            <span className={`dos-pill ${c.status === "Conectado" ? "dos-tone-green" : "dos-tone-amber"}`}>{c.status}</span>
            {canEditConnectors && c.id === "terceros" && (
              <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={startEdit}><Icon name="Pencil" size={13} /> Configurar</button>
            )}
          </div>
        ))}
        {canEditConnectors && editingConnector && (
          <div className="dos-connector-edit">
            <div className="dos-field-row">
              <div className="dos-field"><label>Nombre del sistema externo</label><input value={connForm.name} onChange={(e) => setConnForm({ ...connForm, name: e.target.value })} placeholder="Ej. LIS Roche Cobas" /></div>
              <div className="dos-field"><label>Protocolo</label><input value={connForm.protocol} onChange={(e) => setConnForm({ ...connForm, protocol: e.target.value })} placeholder="FHIR R4 / HL7v2 / REST / DICOMweb" /></div>
            </div>
            <div className="dos-field-row">
              <div className="dos-field"><label>Tipo</label><input value={connForm.type} onChange={(e) => setConnForm({ ...connForm, type: e.target.value })} placeholder="HIS / LIS / RIS / PACS" /></div>
              <div className="dos-field"><label>URL base / endpoint</label><input value={connForm.baseUrl} onChange={(e) => setConnForm({ ...connForm, baseUrl: e.target.value })} placeholder="https://api.proveedor.com/v1" /></div>
            </div>
            <div className="dos-field"><label>Clave / token de API</label><input type="password" value={connForm.apiKey} onChange={(e) => setConnForm({ ...connForm, apiKey: e.target.value })} placeholder="Se guarda solo en esta sesión de demostración" /></div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="dos-btn dos-btn-sm" onClick={disconnectThirdParty}>Desconectar</button>
              <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setEditingConnector(false)}>Cancelar</button>
              <button className="dos-btn dos-btn-primary dos-btn-sm" onClick={saveConnector}>Guardar conexión</button>
            </div>
          </div>
        )}
        <p style={{ fontSize: 11.5, color: "var(--ink-faint)", padding: "10px 16px 14px", margin: 0, borderTop: "1px solid var(--line)" }}>
          El núcleo clínico no conoce estos proveedores directamente: cada conexión pasa por un adaptador (FHIR, HL7, REST, DICOM/DICOMweb) que traduce hacia/desde el modelo interno.
        </p>
      </div>

      <div className="dos-card" style={{ marginBottom: 16 }}>
        <div className="dos-card-header"><h3>Vista previa de recurso FHIR</h3></div>
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
              <pre className="dos-json">{JSON.stringify(json, null, 2)}</pre>
            </>
          )}
        </div>
      </div>

      <div className="dos-card" style={{ marginBottom: 16 }}>
        <div className="dos-card-header">
          <h3>Simulador de integraciones</h3>
          <span className="dos-pill dos-tone-amber">Fase 1 — sin backend real</span>
        </div>
        <div style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="dos-btn dos-btn-sm" onClick={() => onSimulate("ack")}>Simular ACK</button>
          <button className="dos-btn dos-btn-sm" onClick={() => onSimulate("error")}>Simular error (HTTP 500)</button>
          <button className="dos-btn dos-btn-sm" onClick={() => onSimulate("duplicate")}>Simular mensaje duplicado</button>
          <button className="dos-btn dos-btn-sm" onClick={() => onSimulate("retry")}>Simular reintento</button>
          <button className="dos-btn dos-btn-sm" onClick={() => onSimulate("disconnect")}>Simular desconexión</button>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--ink-faint)", padding: "0 16px 14px", margin: 0 }}>
          Permite probar el frontend sin depender de que la HCE y la Agenda estén técnicamente conectadas todavía.
        </p>
      </div>

      <div className="dos-card">
        <div className="dos-card-header"><h3>Registro de mensajes de integración</h3></div>
        {integrationMessages.length === 0 ? (
          <div className="dos-empty"><Icon name="Radio" size={26} /><div>Ningún mensaje se ha registrado todavía.</div></div>
        ) : (
          <div style={{ padding: "4px 16px" }}>
            {integrationMessages.map((m) => (
              <div className="dos-log-item" key={m.id}>
                <span className="dos-log-dot" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{m.type} <span style={{ color: "var(--ink-dim)", fontWeight: 400 }}>· {m.direction === "inbound" ? `${m.source} → Diagnostic OS` : `Diagnostic OS → ${m.destination}`}</span></div>
                  <div style={{ fontSize: 12, color: "var(--ink-dim)" }} className="dos-mono">{m.payloadSummary} · corr: {m.correlationId} · intentos: {m.attempts}</div>
                </div>
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
