import { useState, useEffect, useCallback } from "react";
import Icon from "../components/Icon.jsx";
import logo from "../assets/logo.png";
import PlatformAdminView from "../components/PlatformAdminView.jsx";
import { api, setToken, clearToken } from "../lib/api.js";

// ---------------------------------------------------------------------------------
// Página independiente del superadmin (admin.html). Habla directo con el
// backend real (Render + Neon) — ya no usa localStorage. No comparte login ni
// pantalla con los dueños de centro: entra solo con una cuenta "platform_admin".
// ---------------------------------------------------------------------------------

export default function AdminApp() {
  const [adminUser, setAdminUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [tenants, setTenants] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");

  // Snapshot del centro que se está mirando en la pestaña "Integraciones".
  const [interopTenantId, setInteropTenantId] = useState(null);
  const [snapshot, setSnapshot] = useState({ patients: [], orders: [], studies: [], diagnosticReports: [], integrationMessages: [] });

  const loadTenantsAndUsers = useCallback(async () => {
    setLoadingData(true);
    setDataError("");
    try {
      const [t, u] = await Promise.all([api.get("/api/admin/tenants"), api.get("/api/admin/users")]);
      setTenants(t);
      setAllUsers(u);
      if (!interopTenantId && t[0]) setInteropTenantId(t[0].id);
    } catch (err) {
      setDataError(err.message);
    } finally {
      setLoadingData(false);
    }
  }, [interopTenantId]);

  useEffect(() => { if (adminUser) loadTenantsAndUsers(); }, [adminUser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!adminUser || !interopTenantId) return;
    api.get(`/api/admin/tenants/${interopTenantId}/snapshot`).then(setSnapshot).catch(() => {});
  }, [adminUser, interopTenantId]);

  const submitLogin = async () => {
    if (!email.trim() || !password.trim()) { setError("Completa correo y contraseña."); return; }
    setLoggingIn(true);
    setError("");
    try {
      const { token, user } = await api.post("/api/auth/admin-login", { email: email.trim(), password });
      setToken(token);
      setAdminUser(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => { clearToken(); setAdminUser(null); setTenants([]); setAllUsers([]); };

  const platformCreateTenant = async (form) => {
    try {
      await api.post("/api/admin/tenants", form);
      await loadTenantsAndUsers();
    } catch (err) { setDataError(err.message); }
  };

  const platformAddUser = async (tenantId, form) => {
    try {
      await api.post(`/api/admin/tenants/${tenantId}/users`, form);
      await loadTenantsAndUsers();
    } catch (err) { setDataError(err.message); }
  };

  const platformUpdateUser = async (userId, patch) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, patch);
      await loadTenantsAndUsers();
    } catch (err) { setDataError(err.message); }
  };

  const platformUpdateTenant = async (tenantId, patch) => {
    try {
      await api.patch(`/api/admin/tenants/${tenantId}`, patch);
      await loadTenantsAndUsers();
      if (tenantId === interopTenantId) {
        const snap = await api.get(`/api/admin/tenants/${tenantId}/snapshot`);
        setSnapshot(snap);
      }
    } catch (err) { setDataError(err.message); }
  };

  const simulateIntegration = async (kind, targetTenantId) => {
    try {
      await api.post(`/api/admin/tenants/${targetTenantId}/integrations/simulate`, { kind });
      const snap = await api.get(`/api/admin/tenants/${targetTenantId}/snapshot`);
      setSnapshot(snap);
    } catch (err) { setDataError(err.message); }
  };

  const reloadSnapshot = async (tenantId) => setSnapshot(await api.get(`/api/admin/tenants/${tenantId}/snapshot`));

  // Conexión con el sistema externo (HCE / Clinic-OS). Los errores se devuelven al panel de
  // integraciones, que los muestra junto al botón que los provocó.
  const testConnection = (tenantId) => api.post(`/api/admin/tenants/${tenantId}/integrations/test`);
  const generateInboundKey = async (tenantId) => {
    const r = await api.post(`/api/admin/tenants/${tenantId}/integrations/inbound-key`);
    await loadTenantsAndUsers(); // para que el panel sepa que ya hay una clave activa
    return r;
  };
  const retryMessage = async (tenantId, messageId) => {
    try { return await api.post(`/api/admin/tenants/${tenantId}/integrations/messages/${messageId}/retry`); }
    finally { await reloadSnapshot(tenantId); }
  };
  const sendReport = async (tenantId, reportId) => {
    try { return await api.post(`/api/admin/tenants/${tenantId}/integrations/reports/${reportId}/send`); }
    finally { await reloadSnapshot(tenantId); }
  };

  if (!adminUser) {
    return (
      <div className="dos-root">
        <div className="dos-login-wrap">
          <div className="dos-login-card">
            <div className="dos-login-logo">
              <div className="dos-logo-mark"><img src={logo} alt="Diagnostic OS" /></div>
              <div>
                <p className="dos-login-title">Diagnostic OS</p>
                <p className="dos-login-sub">Panel de administrador de la plataforma</p>
              </div>
            </div>
            <div className="dos-field"><label>Correo</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="soporte@diagnosticos.app" /></div>
            <div className="dos-field"><label>Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && submitLogin()} /></div>
            {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 8 }}>{error}</div>}
            <button className="dos-btn dos-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitLogin} disabled={loggingIn}>
              {loggingIn ? "Ingresando…" : "Ingresar"}
            </button>
            <div className="dos-isolation-note">
              <Icon name="Building2" size={13} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>Los dueños de laboratorios y centros de diagnóstico inician sesión en la aplicación principal, no aquí.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingData && tenants.length === 0) {
    return (
      <div className="dos-root" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--ink-dim)" }}>
          <Icon name="Loader2" size={22} style={{ animation: "spin 1s linear infinite" }} />
          Cargando…
        </div>
      </div>
    );
  }

  return (
    <>
      {dataError && (
        <div style={{ background: "#7A1F1F", color: "#fff", padding: "8px 16px", fontSize: 12.5, textAlign: "center" }}>
          {dataError} — <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={loadTenantsAndUsers}>reintentar</span>
        </div>
      )}
      <PlatformAdminView
        tenants={tenants}
        allUsers={allUsers}
        activeUser={adminUser}
        allOrders={snapshot.orders}
        allStudies={snapshot.studies}
        allPatients={snapshot.patients}
        allDiagnosticReports={snapshot.diagnosticReports}
        allIntegrationMessages={snapshot.integrationMessages}
        onSimulate={simulateIntegration}
        onTestConnection={testConnection}
        onGenerateInboundKey={generateInboundKey}
        onRetryMessage={retryMessage}
        onSendReport={sendReport}
        onLogout={handleLogout}
        onCreateTenant={platformCreateTenant}
        onAddUser={platformAddUser}
        onUpdateUser={platformUpdateUser}
        onUpdateTenant={platformUpdateTenant}
        interopTenantId={interopTenantId}
        onInteropTenantChange={setInteropTenantId}
      />
    </>
  );
}
