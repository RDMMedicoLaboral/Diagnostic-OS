import { useState } from "react";
import Icon from "./Icon.jsx";
import { ModalityPill, IntegrationStatusBadge, patientFullName } from "./common.jsx";
import { patientToFHIR, orderToServiceRequest, studyToImagingStudy, reportToDiagnosticReport } from "../lib/fhir.js";
import { fmtDate } from "../lib/format.js";

const FIXED_CONNECTORS = [
  { id: "hce", name: "HCE Ecosistema (propia)", type: "HCE", protocol: "FHIR R4", status: "Conectado", icon: "Building2" },
  { id: "agenda", name: "Sistema de agendamiento (propio)", type: "Agenda", protocol: "REST", status: "Conectado", icon: "CalendarClock" },
];

const DEFAULT_THIRD_PARTY = {
  name: "Conector de terceros", type: "HIS / LIS / RIS / PACS", protocol: "A definir por contrato", baseUrl: "", apiKey: "", status: "No configurado",
  authType: "apikey", tokenUrl: "", clientId: "", clientSecret: "", scope: "system/DiagnosticReport.write",
  apiKeySet: false, clientSecretSet: false, inboundKeySet: false,
};

// El panel de admin recibe el centro tal como viene del servidor (campos planos thirdParty*). Los
// secretos NUNCA llegan al navegador: solo se sabe si existen (…Set).
function connectorOfTenant(t) {
  if (!t) return DEFAULT_THIRD_PARTY;
  if (t.thirdPartyConnector) return { ...DEFAULT_THIRD_PARTY, ...t.thirdPartyConnector };
  return {
    ...DEFAULT_THIRD_PARTY,
    name: t.thirdPartyName || DEFAULT_THIRD_PARTY.name, type: t.thirdPartyType || DEFAULT_THIRD_PARTY.type, protocol: t.thirdPartyProtocol || DEFAULT_THIRD_PARTY.protocol,
    baseUrl: t.thirdPartyBaseUrl || "", status: t.thirdPartyStatus || "No configurado",
    authType: t.thirdPartyAuthType || "apikey", tokenUrl: t.thirdPartyTokenUrl || "", clientId: t.thirdPartyClientId || "", scope: t.thirdPartyScope || DEFAULT_THIRD_PARTY.scope,
    apiKeySet: Boolean(t.thirdPartyApiKeySet), clientSecretSet: Boolean(t.thirdPartyClientSecretSet), inboundKeySet: Boolean(t.inboundKeySet),
  };
}

export default function InteropView({ studies, orders, patients, diagnosticReports, integrationMessages, onSimulate, tenant, canEditConnectors = false, onUpdateConnector, onTestConnection, onGenerateInboundKey, onRetryMessage, onSendReport }) {
  const publishable = diagnosticReports.filter((r) => r.status === "published" || r.status === "validated");
  const [selectedId, setSelectedId] = useState(publishable[0]?.id || "");
  const [resourceKind, setResourceKind] = useState("report");
  const [editingConnector, setEditingConnector] = useState(false);
  const thirdParty = connectorOfTenant(tenant);
  const [connForm, setConnForm] = useState(thirdParty);
  const [testResult, setTestResult] = useState(null);
  const [newKey, setNewKey] = useState(null);
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

  const startEdit = () => { setConnForm(thirdParty); setTestResult(null); setNewKey(null); setNotice(""); setEditingConnector(true); };
  const saveConnector = () => {
    const status = connForm.baseUrl?.trim() ? "Conectado" : "No configurado";
    const patch = {
      name: connForm.name?.trim() || DEFAULT_THIRD_PARTY.name, type: connForm.type, protocol: connForm.protocol,
      baseUrl: connForm.baseUrl?.trim() || "", authType: connForm.authType, tokenUrl: connForm.tokenUrl?.trim() || "",
      clientId: connForm.clientId?.trim() || "", scope: connForm.scope?.trim() || DEFAULT_THIRD_PARTY.scope, status,
    };
    // Los secretos solo se mandan si el usuario escribió uno nuevo; vacío = conservar el que ya está guardado.
    if (connForm.apiKey?.trim()) patch.apiKey = connForm.apiKey.trim();
    if (connForm.clientSecret?.trim()) patch.clientSecret = connForm.clientSecret.trim();
    onUpdateConnector?.(patch);
    setEditingConnector(false);
  };
  const disconnectThirdParty = () => {
    onUpdateConnector?.({ disconnect: true });
    setEditingConnector(false);
  };
  const doTest = () => run("test", async () => {
    // Prueba lo ya guardado: si cambiaste datos, pulsa primero "Guardar conexión".
    setTestResult(await onTestConnection?.());
  });
  const doGenerateKey = () => {
    if (thirdParty.inboundKeySet && !window.confirm("Ya existe una clave. Si generas otra, la anterior dejará de funcionar de inmediato y el sistema externo tendrá que actualizarla. ¿Continuar?")) return;
    run("key", async () => setNewKey(await onGenerateInboundKey?.()));
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
              <div className="dos-field"><label>Nombre del sistema externo</label><input value={connForm.name} onChange={(e) => setConnForm({ ...connForm, name: e.target.value })} placeholder="Ej. Clinic-OS" /></div>
              <div className="dos-field"><label>Protocolo</label><input value={connForm.protocol} onChange={(e) => setConnForm({ ...connForm, protocol: e.target.value })} placeholder="FHIR R4" /></div>
            </div>
            <div className="dos-field-row">
              <div className="dos-field"><label>Tipo</label><input value={connForm.type} onChange={(e) => setConnForm({ ...connForm, type: e.target.value })} placeholder="HCE / HIS / LIS / RIS / PACS" /></div>
              <div className="dos-field"><label>URL base FHIR (a donde enviamos los informes)</label><input value={connForm.baseUrl} onChange={(e) => setConnForm({ ...connForm, baseUrl: e.target.value })} placeholder="https://clinic-os.ejemplo.com/api/fhir" /></div>
            </div>
            <div className="dos-field" style={{ maxWidth: 360 }}>
              <label>Cómo nos autenticamos ante ese sistema</label>
              <select value={connForm.authType} onChange={(e) => setConnForm({ ...connForm, authType: e.target.value })}>
                <option value="oauth2">OAuth2 client_credentials (Clinic-OS)</option>
                <option value="apikey">Clave de API fija</option>
              </select>
            </div>
            {connForm.authType === "oauth2" ? (
              <>
                <div className="dos-field-row">
                  <div className="dos-field"><label>Client ID</label><input value={connForm.clientId} onChange={(e) => setConnForm({ ...connForm, clientId: e.target.value })} placeholder="El que te dio Clinic-OS al crear la integración" /></div>
                  <div className="dos-field"><label>Client secret</label><input type="password" autoComplete="new-password" value={connForm.clientSecret} onChange={(e) => setConnForm({ ...connForm, clientSecret: e.target.value })} placeholder={thirdParty.clientSecretSet ? "•••••• guardado (déjalo vacío para conservarlo)" : "Se muestra una sola vez en Clinic-OS"} /></div>
                </div>
                <div className="dos-field-row">
                  <div className="dos-field"><label>URL del token (opcional)</label><input value={connForm.tokenUrl} onChange={(e) => setConnForm({ ...connForm, tokenUrl: e.target.value })} placeholder="Vacío = {URL base}/oauth/token" /></div>
                  <div className="dos-field"><label>Scope</label><input value={connForm.scope} onChange={(e) => setConnForm({ ...connForm, scope: e.target.value })} /></div>
                </div>
              </>
            ) : (
              <div className="dos-field"><label>Clave / token de API</label><input type="password" autoComplete="new-password" value={connForm.apiKey} onChange={(e) => setConnForm({ ...connForm, apiKey: e.target.value })} placeholder={thirdParty.apiKeySet ? "•••••• guardada (déjala vacía para conservarla)" : "Clave que aceptará el sistema externo"} /></div>
            )}
            <p style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: "4px 0 10px" }}>Los secretos se guardan cifrados en el servidor y nunca se vuelven a mostrar.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="dos-btn dos-btn-sm" onClick={disconnectThirdParty}>Desconectar</button>
              <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setEditingConnector(false)}>Cancelar</button>
              <button className="dos-btn dos-btn-primary dos-btn-sm" onClick={saveConnector}>Guardar conexión</button>
            </div>
          </div>
        )}
        {canEditConnectors && thirdParty.baseUrl && onTestConnection && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <button className="dos-btn dos-btn-sm" onClick={doTest} disabled={busy === "test"}><Icon name="Radio" size={13} /> {busy === "test" ? "Probando…" : "Probar conexión"}</button>
              <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Verifica el token y el servidor sin enviar ningún dato clínico.</span>
            </div>
            {testResult && (
              <div style={{ marginTop: 10, fontSize: 12.5 }}>
                {testResult.steps.map((st) => (
                  <div key={st.step} style={{ display: "flex", gap: 8, padding: "2px 0" }}>
                    <span style={{ color: st.ok ? "var(--green, #1a7f5a)" : st.warning ? "var(--amber, #b7791f)" : "var(--red)" }}>{st.ok ? "✓" : st.warning ? "!" : "✗"}</span>
                    <span><strong>{st.step}:</strong> {st.detail}</span>
                  </div>
                ))}
                <div style={{ marginTop: 6, fontWeight: 500 }}>{testResult.ok ? "Conexión lista para enviar informes." : "La conexión tiene problemas: revisa los pasos marcados."}</div>
              </div>
            )}
          </div>
        )}
        {canEditConnectors && onGenerateInboundKey && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>Recibir órdenes desde el sistema externo</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 8 }}>
              El sistema externo envía las órdenes a este centro con una clave. {thirdParty.inboundKeySet ? "Ya hay una clave activa." : "Todavía no hay ninguna clave."} Se muestra una sola vez al generarla.
            </div>
            <button className="dos-btn dos-btn-sm" onClick={doGenerateKey} disabled={busy === "key"}><Icon name="Pencil" size={13} /> {thirdParty.inboundKeySet ? "Generar clave nueva" : "Generar clave"}</button>
            {newKey && (
              <div style={{ marginTop: 10, padding: 10, border: "1px solid var(--line)", borderRadius: 8, background: "var(--surface-2)" }}>
                <div style={{ fontSize: 12, marginBottom: 6 }}><strong>Cópiala ahora</strong>, no se vuelve a mostrar:</div>
                <div className="dos-mono" style={{ fontSize: 12, wordBreak: "break-all", userSelect: "all" }}>{newKey.apiKey}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-dim)", marginTop: 8 }}>
                  Enviar órdenes (POST) a:<br /><span className="dos-mono" style={{ wordBreak: "break-all", userSelect: "all" }}>{newKey.serviceRequestUrl}</span><br />
                  con el encabezado <span className="dos-mono">{newKey.header}: &lt;la clave&gt;</span>
                </div>
              </div>
            )}
          </div>
        )}
        {notice && <div style={{ color: "var(--red)", fontSize: 12.5, padding: "0 16px 10px" }}>{notice}</div>}
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
              {onSendReport && selectedReport?.status === "published" && thirdParty.baseUrl && (
                <div style={{ margin: "4px 0 10px", display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="dos-btn dos-btn-sm" disabled={busy === "send"} onClick={() => run("send", async () => { const r = await onSendReport(selectedReport.id); setNotice(r?.ok ? "" : r?.message?.lastError || r?.message?.payloadSummary || "No se pudo enviar."); })}>
                    <Icon name="Share2" size={13} /> {busy === "send" ? "Enviando…" : "Enviar este informe a " + thirdParty.name}
                  </button>
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Útil para informes publicados antes de configurar la conexión.</span>
                </div>
              )}
              <pre className="dos-json">{JSON.stringify(json, null, 2)}</pre>
            </>
          )}
        </div>
      </div>

      {onSimulate && !thirdParty.baseUrl && (
      <div className="dos-card" style={{ marginBottom: 16 }}>
        <div className="dos-card-header">
          <h3>Simulador de integraciones</h3>
          <span className="dos-pill dos-tone-amber">Solo demostración</span>
        </div>
        <div style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="dos-btn dos-btn-sm" onClick={() => onSimulate("ack")}>Simular ACK</button>
          <button className="dos-btn dos-btn-sm" onClick={() => onSimulate("error")}>Simular error (HTTP 500)</button>
          <button className="dos-btn dos-btn-sm" onClick={() => onSimulate("duplicate")}>Simular mensaje duplicado</button>
          <button className="dos-btn dos-btn-sm" onClick={() => onSimulate("retry")}>Simular reintento</button>
          <button className="dos-btn dos-btn-sm" onClick={() => onSimulate("disconnect")}>Simular desconexión</button>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--ink-faint)", padding: "0 16px 14px", margin: 0 }}>
          Permite probar el frontend sin depender de que la HCE y la Agenda estén técnicamente conectadas todavía. Se oculta cuando el centro tiene un conector real.
        </p>
      </div>
      )}

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
