import { useState } from "react";
import Icon from "./Icon.jsx";
import { API_BASE_URL } from "../config.js";
import { fmtDate } from "../lib/format.js";

// ---------------------------------------------------------------------------------
// Conexiones de UN laboratorio / centro con las clínicas y sistemas con los que trabaja.
//
// Un laboratorio puede atender a varias clínicas a la vez. Se crea UNA conexión por clínica:
//   - cada clínica recibe su propia clave → el laboratorio sabe con certeza quién envía cada orden;
//   - cada orden queda marcada con el nombre de su clínica;
//   - el resultado vuelve SOLO a la clínica que pidió el examen.
// Los secretos (clave de entrada, client secret) nunca se vuelven a mostrar después de guardarlos.
// ---------------------------------------------------------------------------------

const HELP = { display: "block", marginTop: 4, fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.4 };
const TYPE_LABELS = { HCE: "HCE — historia clínica", HIS: "HIS — sistema hospitalario", LIS: "LIS — laboratorio", RIS: "RIS — imágenes", PACS: "PACS — almacén de imágenes" };
const MONO = { fontFamily: "ui-monospace, 'Cascadia Code', monospace", fontSize: 12, wordBreak: "break-all", userSelect: "all" };

function CopyRow({ label, value }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); } catch { /* el navegador puede bloquearlo: el texto sigue seleccionable */ }
    setDone(true); setTimeout(() => setDone(false), 1500);
  };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11.5, color: "var(--ink-dim)", marginBottom: 2 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ ...MONO, flex: 1, padding: "6px 8px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 6 }}>{value}</div>
        <button className="dos-btn dos-btn-sm" onClick={copy}>{done ? <><Icon name="Check" size={12} /> Copiado</> : "Copiar"}</button>
      </div>
    </div>
  );
}

function Pill({ tone, children }) { return <span className={`dos-pill dos-tone-${tone}`}>{children}</span>; }

function ConnectionCard({ tenant, conn, open, onToggle, onUpdate, onDelete, onTest, onGenerateKey }) {
  const [form, setForm] = useState(null); // null = no se está editando el retorno
  const [preset, setPreset] = useState("custom");
  const [testResult, setTestResult] = useState(null);
  const [newKey, setNewKey] = useState(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const run = async (label, fn) => { setBusy(label); setNotice(""); try { await fn(); } catch (err) { setNotice(err.message); } finally { setBusy(""); } };

  const returnConfigured = Boolean(conn.baseUrl);
  const startEdit = () => {
    setPreset(conn.authType === "oauth2" ? "clinicos" : "custom");
    setForm({ name: conn.name, type: conn.type, baseUrl: conn.baseUrl, authType: conn.authType, tokenUrl: conn.tokenUrl, clientId: conn.clientId, clientSecret: "", apiKey: "", scope: conn.scope });
    setTestResult(null);
  };
  const applyPreset = (value) => {
    setPreset(value);
    if (value === "clinicos") setForm((f) => ({ ...f, type: "HCE", authType: "oauth2", scope: "system/DiagnosticReport.write" }));
    if (value === "apikey") setForm((f) => ({ ...f, authType: "apikey" }));
  };
  const save = () => run("save", async () => {
    const patch = { name: form.name, type: form.type, baseUrl: form.baseUrl?.trim() || "", authType: form.authType, tokenUrl: form.tokenUrl?.trim() || "", clientId: form.clientId?.trim() || "", scope: form.scope?.trim() || undefined };
    // Los secretos solo se mandan si escribiste uno nuevo; vacío = conservar el que ya está guardado.
    if (form.clientSecret?.trim()) patch.clientSecret = form.clientSecret.trim();
    if (form.apiKey?.trim()) patch.apiKey = form.apiKey.trim();
    await onUpdate(conn.id, patch);
    setForm(null);
  });

  return (
    <div className="dos-card" style={{ marginBottom: 12, opacity: conn.enabled ? 1 : 0.75 }}>
      <div className="dos-card-header" style={{ cursor: "pointer" }} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Icon name={open ? "ChevronDown" : "ChevronRight"} size={14} />
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0 }}>{conn.name}</h3>
            <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>{TYPE_LABELS[conn.type] || conn.type} · {conn.ordersCount ?? 0} orden{conn.ordersCount === 1 ? "" : "es"} recibida{conn.ordersCount === 1 ? "" : "s"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {!conn.enabled && <Pill tone="red">Desactivada</Pill>}
          <Pill tone={conn.inboundKeySet ? "green" : "amber"}>{conn.inboundKeySet ? "Recibe órdenes" : "Sin clave de entrada"}</Pill>
          <Pill tone={returnConfigured ? "green" : "amber"}>{returnConfigured ? "Retorno configurado" : "Sin destino de retorno"}</Pill>
        </div>
      </div>

      {open && (
        <div style={{ padding: "4px 16px 16px" }}>
          {/* ---------- 1. ENTRADA ---------- */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>1. Recibir órdenes de {conn.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-dim)", marginBottom: 8 }}>
              {conn.name} usa una <strong>clave propia</strong> para enviar sus órdenes a este laboratorio. Así, cada orden queda marcada con su clínica y no se confunde con las de otras.
              {conn.inboundKeySet ? ` Clave activa desde ${conn.inboundKeyCreatedAt ? fmtDate(conn.inboundKeyCreatedAt) : "antes"}.` : " Todavía no hay clave."}
            </div>
            <button className="dos-btn dos-btn-sm" disabled={busy === "key"} onClick={() => {
              if (conn.inboundKeySet && !window.confirm(`Ya existe una clave para ${conn.name}. Si generas otra, la anterior dejará de funcionar de inmediato y la clínica tendrá que actualizarla. ¿Continuar?`)) return;
              run("key", async () => setNewKey(await onGenerateKey(conn.id)));
            }}>
              <Icon name="KeyRound" size={13} /> {busy === "key" ? "Generando…" : conn.inboundKeySet ? "Generar clave nueva" : "Generar clave"}
            </button>
            {newKey && (
              <div style={{ marginTop: 10, padding: 12, border: "1px solid var(--line)", borderRadius: 8, background: "var(--surface-2)" }}>
                <div style={{ fontSize: 12, marginBottom: 8 }}><strong>Entrega estos datos a {conn.name}.</strong> La clave no se vuelve a mostrar.</div>
                <CopyRow label="Laboratorio al que se conectan" value={`${newKey.tenantName} (id: ${newKey.tenantId})`} />
                <CopyRow label="Dirección del laboratorio (pégala en la clínica)" value={newKey.fhirBaseUrl} />
                <CopyRow label={`Clave de ${conn.name} (encabezado ${newKey.header})`} value={newKey.apiKey} />
              </div>
            )}
          </div>

          {/* ---------- 2. SALIDA ---------- */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>2. Devolver los resultados a {conn.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-dim)", marginBottom: 8 }}>
              Los informes de las órdenes de {conn.name} se envían <strong>solo</strong> a la dirección que configures aquí, nunca a otra clínica.
            </div>

            {!form && (
              <div>
                {returnConfigured ? (
                  <div style={{ fontSize: 12.5, marginBottom: 8 }}>
                    <div><strong>Destino:</strong> <span style={MONO}>{conn.baseUrl}</span></div>
                    <div style={{ color: "var(--ink-dim)" }}>Autenticación: {conn.authType === "oauth2" ? `OAuth2 client_credentials (client id: ${conn.clientId || "—"}${conn.clientSecretSet ? ", secreto guardado" : ", sin secreto"})` : `clave de API${conn.apiKeySet ? " guardada" : " sin definir"}`}</div>
                  </div>
                ) : <div style={{ fontSize: 12.5, color: "var(--amber)", marginBottom: 8 }}>Falta el destino: sin él, los resultados de {conn.name} no tienen a dónde volver.</div>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="dos-btn dos-btn-sm" onClick={startEdit}><Icon name="Pencil" size={13} /> {returnConfigured ? "Editar destino" : "Configurar destino"}</button>
                  {returnConfigured && <button className="dos-btn dos-btn-sm" disabled={busy === "test"} onClick={() => run("test", async () => setTestResult(await onTest(conn.id)))}><Icon name="Radio" size={13} /> {busy === "test" ? "Probando…" : "Probar conexión"}</button>}
                </div>
                {testResult && (
                  <div style={{ marginTop: 10, fontSize: 12.5 }}>
                    {testResult.steps.map((st) => (
                      <div key={st.step} style={{ display: "flex", gap: 8, padding: "2px 0" }}>
                        <span style={{ color: st.ok ? "var(--green)" : st.warning ? "var(--amber)" : "var(--red)" }}>{st.ok ? "✓" : st.warning ? "!" : "✗"}</span>
                        <span><strong>{st.step}:</strong> {st.detail}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 6, fontWeight: 500 }}>{testResult.ok ? "Conexión lista para devolver resultados." : "Hay problemas: revisa los pasos marcados."}</div>
                  </div>
                )}
              </div>
            )}

            {form && (
              <div className="dos-connector-edit" style={{ borderRadius: 8, border: "1px solid var(--line)" }}>
                <div className="dos-field" style={{ maxWidth: 420 }}>
                  <label>¿Qué sistema usa {conn.name}?</label>
                  <select value={preset} onChange={(e) => applyPreset(e.target.value)}>
                    <option value="custom">— Elegir —</option>
                    <option value="clinicos">Clinic-OS (llena todo automáticamente)</option>
                    <option value="apikey">Otro sistema FHIR con clave de API</option>
                  </select>
                </div>
                <div className="dos-field-row">
                  <div className="dos-field">
                    <label>Nombre de la clínica</label>
                    <input autoComplete="off" name="dx-conn-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="dos-field">
                    <label>Tipo de sistema</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      {[...new Set([form.type, "HCE", "HIS", "LIS", "RIS", "PACS"])].filter(Boolean).map((t) => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="dos-field">
                  <label>Dirección FHIR de {conn.name} (a donde enviamos los informes)</label>
                  <input autoComplete="off" name="dx-conn-url" inputMode="url" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://clinic-os.ejemplo.com/api/fhir" />
                  <small style={HELP}>Debe empezar con https:// y terminar en /api/fhir (sin /DiagnosticReport). Si el navegador te rellena aquí un correo, bórralo.</small>
                </div>
                <div className="dos-field" style={{ maxWidth: 380 }}>
                  <label>Cómo nos autenticamos ante {conn.name}</label>
                  <select value={form.authType} onChange={(e) => setForm({ ...form, authType: e.target.value })}>
                    <option value="oauth2">OAuth2 client_credentials (Clinic-OS)</option>
                    <option value="apikey">Clave de API fija</option>
                  </select>
                </div>
                {form.authType === "oauth2" ? (
                  <>
                    <div className="dos-field-row">
                      <div className="dos-field"><label>Client ID</label><input autoComplete="off" name="dx-conn-client-id" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} placeholder="Lo crea la clínica para este laboratorio" /></div>
                      <div className="dos-field"><label>Client secret</label><input type="password" autoComplete="new-password" value={form.clientSecret} onChange={(e) => setForm({ ...form, clientSecret: e.target.value })} placeholder={conn.clientSecretSet ? "•••••• guardado (vacío = conservarlo)" : "Se muestra una sola vez en la clínica"} /></div>
                    </div>
                    <div className="dos-field-row">
                      <div className="dos-field"><label>URL del token (opcional)</label><input autoComplete="off" name="dx-conn-token-url" value={form.tokenUrl} onChange={(e) => setForm({ ...form, tokenUrl: e.target.value })} placeholder="Vacío = {dirección}/oauth/token" /></div>
                      <div className="dos-field"><label>Scope</label><input autoComplete="off" name="dx-conn-scope" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} /></div>
                    </div>
                  </>
                ) : (
                  <div className="dos-field"><label>Clave / token de API</label><input type="password" autoComplete="new-password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder={conn.apiKeySet ? "•••••• guardada (vacía = conservarla)" : "Clave que aceptará la clínica"} /></div>
                )}
                <small style={{ ...HELP, marginBottom: 10 }}>Los secretos se guardan cifrados en el servidor y nunca se vuelven a mostrar.</small>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  {returnConfigured && <button className="dos-btn dos-btn-sm" onClick={() => { if (window.confirm(`Se borrarán la dirección y las credenciales de retorno de ${conn.name}. ¿Continuar?`)) run("clear", async () => { await onUpdate(conn.id, { disconnect: true }); setForm(null); }); }}>Quitar destino</button>}
                  <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setForm(null)}>Cancelar</button>
                  <button className="dos-btn dos-btn-primary dos-btn-sm" disabled={busy === "save"} onClick={save}>{busy === "save" ? "Guardando…" : "Guardar"}</button>
                </div>
              </div>
            )}
          </div>

          {/* ---------- ESTADO ---------- */}
          <div style={{ paddingTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button className="dos-btn dos-btn-sm" onClick={() => run("toggle", () => onUpdate(conn.id, { enabled: !conn.enabled }))}>{conn.enabled ? "Desactivar conexión" : "Activar conexión"}</button>
            {(conn.ordersCount || 0) === 0 && <button className="dos-btn dos-btn-sm" onClick={() => { if (window.confirm(`¿Eliminar la conexión con ${conn.name}?`)) run("delete", () => onDelete(conn.id)); }}><Icon name="Trash2" size={13} /> Eliminar</button>}
            <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{conn.enabled ? "Desactivarla impide que la clínica envíe órdenes y detiene el retorno de resultados; el historial se conserva." : "Desactivada: no recibe órdenes ni recibe resultados."}</span>
          </div>
          {notice && <div style={{ color: "var(--red)", fontSize: 12.5, marginTop: 8 }}>{notice}</div>}
        </div>
      )}
    </div>
  );
}

export default function ConnectionsPanel({ tenant, connections, onCreate, onUpdate, onDelete, onTest, onGenerateKey }) {
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("HCE");
  const [notice, setNotice] = useState("");
  const base = `${API_BASE_URL}/api/fhir/tenants/${tenant.id}`;

  const create = async () => {
    setNotice("");
    try {
      const c = await onCreate(name.trim(), type);
      setName(""); setAdding(false); setOpenId(c.id);
    } catch (err) { setNotice(err.message); }
  };

  return (
    <div>
      <div className="dos-card" style={{ marginBottom: 16 }}>
        <div className="dos-card-header"><h3>Datos de {tenant.name} para conectarse</h3></div>
        <div style={{ padding: "4px 16px 14px" }}>
          <div style={{ fontSize: 12, color: "var(--ink-dim)", marginBottom: 10 }}>
            Esto es lo que una clínica necesita para conectarse con <strong>este laboratorio</strong>. Cada clínica usa la misma dirección pero <strong>su propia clave</strong> (se genera dentro de su conexión, más abajo).
          </div>
          <CopyRow label="Id del laboratorio" value={tenant.id} />
          <CopyRow label="Dirección del laboratorio (la clínica la pega en su configuración)" value={base} />
        </div>
      </div>

      <div className="dos-card" style={{ marginBottom: 12 }}>
        <div className="dos-card-header">
          <h3>Conexiones con clínicas y otros sistemas</h3>
          <button className="dos-btn dos-btn-primary dos-btn-sm" onClick={() => { setAdding((v) => !v); setNotice(""); }}><Icon name="Plus" size={13} /> Nueva conexión</button>
        </div>
        <div style={{ padding: "0 16px 12px", fontSize: 12, color: "var(--ink-dim)" }}>
          Un laboratorio puede trabajar con varias clínicas. Crea <strong>una conexión por cada clínica</strong>: sus órdenes quedan marcadas con su nombre y sus resultados vuelven solo a ella.
        </div>
        {adding && (
          <div className="dos-connector-edit">
            <div className="dos-field-row">
              <div className="dos-field"><label>Nombre de la clínica o sistema</label><input autoComplete="off" name="dx-new-conn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Clínica RDM" /></div>
              <div className="dos-field">
                <label>Tipo de sistema</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>{["HCE", "HIS", "LIS", "RIS", "PACS"].map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}</select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setAdding(false)}>Cancelar</button>
              <button className="dos-btn dos-btn-primary dos-btn-sm" disabled={!name.trim()} onClick={create}>Crear conexión</button>
            </div>
          </div>
        )}
        {notice && <div style={{ color: "var(--red)", fontSize: 12.5, padding: "0 16px 10px" }}>{notice}</div>}
      </div>

      {connections.length === 0 && !adding && (
        <div style={{ padding: 20, textAlign: "center", color: "var(--ink-dim)", fontSize: 13, border: "1px dashed var(--line)", borderRadius: 10 }}>
          Este laboratorio todavía no está conectado con ninguna clínica. Pulsa <strong>Nueva conexión</strong> para empezar.
        </div>
      )}
      {connections.map((c) => (
        <ConnectionCard key={c.id} tenant={tenant} conn={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)}
          onUpdate={onUpdate} onDelete={onDelete} onTest={onTest} onGenerateKey={onGenerateKey} />
      ))}
    </div>
  );
}
