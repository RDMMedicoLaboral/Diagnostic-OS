import { useState, useEffect } from "react";
import Icon from "../components/Icon.jsx";
import { api } from "../lib/api.js";
import logo from "../assets/logo.png";
import "../styles.css";

export default function BookingApp() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tenants, setTenants] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [tenantId, setTenantId] = useState("");
  const [serviceCode, setServiceCode] = useState("");
  const [patientName, setPatientName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const loadedTenants = await api.get("/api/public/tenants");
        setTenants(loadedTenants);
        if (loadedTenants[0]) {
          setTenantId(loadedTenants[0].id);
          const cat = await api.get(`/api/public/tenants/${loadedTenants[0].id}/catalog`);
          setCatalog(cat);
        }
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Cuando cambian de centro, se trae el catálogo de ESE centro (cada uno tiene el suyo).
  useEffect(() => {
    if (!tenantId) return;
    api.get(`/api/public/tenants/${tenantId}/catalog`).then(setCatalog).catch(() => setCatalog([]));
  }, [tenantId]);

  const tenant = tenants.find((t) => t.id === tenantId);
  const tenantHours = tenant?.hours || { open: "08:00", close: "18:00" };

  const timeSlots = (() => {
    const [openH, openM] = tenantHours.open.split(":").map(Number);
    const [closeH, closeM] = tenantHours.close.split(":").map(Number);
    const slots = [];
    let h = openH, m = openM;
    while (h < closeH || (h === closeH && m < closeM)) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += 30;
      if (m >= 60) { m = 0; h += 1; }
    }
    return slots;
  })();

  const tenantServices = catalog.filter((c) => c.active);

  const submit = async () => {
    if (!tenantId) { setError("Selecciona un centro."); return; }
    if (!serviceCode) { setError("Selecciona un estudio."); return; }
    if (!patientName.trim() || !documentNumber.trim()) { setError("Completa tu nombre y documento."); return; }
    if (!preferredDate) { setError("Elige una fecha preferida."); return; }
    if (!preferredTime) { setError("Elige una hora dentro del horario del centro."); return; }
    setError("");
    setSubmitting(true);

    const svc = tenantServices.find((s) => s.code === serviceCode);
    try {
      const appointment = await api.post("/api/public/appointments", {
        tenantId,
        patientName: patientName.trim(),
        documentNumber: documentNumber.trim(),
        serviceCode: svc.code,
        scheduledAt: new Date(`${preferredDate}T${preferredTime}`).toISOString(),
      });
      setConfirmed({ ...appointment, serviceName: svc.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dos-root">
        <div className="dos-login-wrap">
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-dim)" }}>
            <Icon name="Loader2" size={18} style={{ animation: "spin 1s linear infinite" }} /> Cargando centros disponibles…
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="dos-root">
        <div className="dos-login-wrap">
          <div className="dos-login-card">
            <p className="dos-login-title">No se pudo conectar</p>
            <p style={{ fontSize: 13, color: "var(--ink-dim)" }}>{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="dos-root">
        <div className="dos-login-wrap">
          <div className="dos-login-card">
            <p className="dos-login-title">Reservar cita</p>
            <p style={{ fontSize: 13, color: "var(--ink-dim)" }}>
              Todavía no hay ningún centro registrado en Diagnostic OS.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="dos-root">
        <div className="dos-login-wrap">
          <div className="dos-login-card">
            <div className="dos-login-logo">
              <div className="dos-logo-mark" style={{ background: "var(--green)" }}><Icon name="CheckCircle2" size={15} color="#fff" /></div>
              <div>
                <p className="dos-login-title">Solicitud recibida</p>
                <p className="dos-login-sub">{tenant?.name}</p>
              </div>
            </div>
            <dl className="dos-kv">
              <dt>Estudio</dt><dd>{confirmed.serviceName}</dd>
              <dt>Paciente</dt><dd>{confirmed.patientName}</dd>
              <dt>Fecha y hora preferida</dt><dd>{new Date(confirmed.scheduledAt).toLocaleDateString("es-EC")} · {new Date(confirmed.scheduledAt).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</dd>
            </dl>
            <div className="dos-login-hint" style={{ marginTop: 14 }}>
              Tu solicitud quedó pendiente de confirmación por el centro. Te contactarán para confirmar el horario exacto.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="dos-root">
      <div className="dos-login-wrap">
        <div className="dos-login-card">
          <div className="dos-login-logo">
            <div className="dos-logo-mark"><img src={logo} alt="Diagnostic OS" /></div>
            <div>
              <p className="dos-login-title">Diagnostic OS</p>
              <p className="dos-login-sub">Reservar cita — página pública</p>
            </div>
          </div>
  
          <div className="dos-field">
            <label>Centro</label>
            <select value={tenantId} onChange={(e) => { setTenantId(e.target.value); setServiceCode(""); setPreferredTime(""); }}>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
  
          <div className="dos-field">
            <label>Estudio</label>
            {tenantServices.length === 0 ? (
              <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>{tenant?.name} no tiene estudios disponibles para reservar en este momento.</p>
            ) : (
              <select value={serviceCode} onChange={(e) => setServiceCode(e.target.value)}>
                <option value="">Selecciona un estudio…</option>
                {tenantServices.map((s) => <option key={s.code} value={s.code}>{s.name} — ${s.price?.toFixed(2)}</option>)}
              </select>
            )}
          </div>
  
          {serviceCode && (
            <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: -8, marginBottom: 12 }}>
              Preparación: {tenantServices.find((s) => s.code === serviceCode)?.preparation || "Sin requisitos especiales"}
            </p>
          )}
  
          <div className="dos-field-row">
            <div className="dos-field"><label>Nombre completo</label><input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Nombres y apellidos" /></div>
            <div className="dos-field"><label>Documento</label><input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Cédula o pasaporte" /></div>
          </div>
          <div className="dos-field-row">
            <div className="dos-field"><label>Fecha preferida</label><input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} /></div>
            <div className="dos-field">
              <label>Hora preferida</label>
              <select value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)}>
                <option value="">Selecciona una hora…</option>
                {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: -8, marginBottom: 12 }}>
            Horario de atención de {tenant?.name}: {tenantHours.open} a {tenantHours.close}.
          </p>
  
          {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
          <button className="dos-btn dos-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submit} disabled={submitting}>
            {submitting ? "Enviando…" : "Solicitar cita"}
          </button>
  
          <div className="dos-isolation-note">
            <Icon name="Radio" size={13} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>Esta página es independiente de Diagnostic OS: tu solicitud viaja como una cita entrante y aparece en la pestaña "Agenda" del centro para que la confirmen.</span>
          </div>
        </div>
      </div>
      </div>
  );
}
