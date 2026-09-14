import { useState } from "react";
import Icon from "./Icon.jsx";
import logo from "../assets/logo.png";
import InteropView from "./InteropView.jsx";
import { ROLE_META } from "../data/catalogs.js";
import { initialsOf } from "../lib/format.js";

const CENTER_KINDS = ["Laboratorio", "Centro de imágenes", "Centro mixto"];
const EMPTY_TENANT_FORM = { centerName: "", kind: "Laboratorio", ownerName: "", email: "", password: "" };
const EMPTY_USER_FORM = { name: "", role: "laboratorista", email: "", password: "" };

export default function PlatformAdminView({
  tenants, allUsers, activeUser,
  allOrders, allStudies, allPatients, allDiagnosticReports, allIntegrationMessages,
  onSimulate, onLogout,
  onCreateTenant, onAddUser, onUpdateUser, onUpdateTenant,
  interopTenantId: interopTenantIdProp, onInteropTenantChange,
}) {
  const [tab, setTab] = useState("centros"); // centros | integraciones
  const [interopTenantIdLocal, setInteropTenantIdLocal] = useState(tenants[0]?.id || "");
  const interopTenantId = interopTenantIdProp ?? interopTenantIdLocal;
  const setInteropTenantId = onInteropTenantChange ?? setInteropTenantIdLocal;

  const [showNewTenant, setShowNewTenant] = useState(false);
  const [tenantForm, setTenantForm] = useState(EMPTY_TENANT_FORM);
  const [tenantError, setTenantError] = useState("");

  const [addUserTenantId, setAddUserTenantId] = useState(null);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [userError, setUserError] = useState("");

  const [editingUser, setEditingUser] = useState(null); // user object being edited
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");

  const [editingTenantName, setEditingTenantName] = useState(null);
  const [tenantNameDraft, setTenantNameDraft] = useState("");

  const [resettingUser, setResettingUser] = useState(null); // usuario al que se le está restableciendo la contraseña
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const interopTenant = tenants.find((t) => t.id === interopTenantId);
  const interopStudies = allStudies.filter((s) => s.tenantId === interopTenantId);
  const interopOrders = allOrders.filter((o) => o.tenantId === interopTenantId);
  const interopPatients = allPatients.filter((p) => p.tenantId === interopTenantId);
  const interopReports = allDiagnosticReports.filter((r) => r.tenantId === interopTenantId);
  const interopMessages = allIntegrationMessages.filter((m) => m.tenantId === interopTenantId);

  const submitNewTenant = () => {
    if (!tenantForm.centerName.trim() || !tenantForm.ownerName.trim() || !tenantForm.email.trim() || !tenantForm.password.trim()) {
      setTenantError("Completa todos los campos para crear el centro y su dueño.");
      return;
    }
    if (allUsers.find((u) => u.email.toLowerCase() === tenantForm.email.trim().toLowerCase())) {
      setTenantError("Ya existe una cuenta con ese correo.");
      return;
    }
    onCreateTenant(tenantForm);
    setTenantForm(EMPTY_TENANT_FORM);
    setTenantError("");
    setShowNewTenant(false);
  };

  const submitNewUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      setUserError("Nombre, correo y contraseña son obligatorios.");
      return;
    }
    if (allUsers.find((u) => u.email.toLowerCase() === userForm.email.trim().toLowerCase())) {
      setUserError("Ya existe una cuenta con ese correo.");
      return;
    }
    onAddUser(addUserTenantId, userForm);
    setUserForm(EMPTY_USER_FORM);
    setUserError("");
    setAddUserTenantId(null);
  };

  const startEditUser = (u) => {
    setEditingUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role, password: "" });
    setEditError("");
  };

  const submitEditUser = () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditError("Nombre y correo son obligatorios.");
      return;
    }
    const clash = allUsers.find((u) => u.id !== editingUser.id && u.email.toLowerCase() === editForm.email.trim().toLowerCase());
    if (clash) {
      setEditError("Ya existe otra cuenta con ese correo.");
      return;
    }
    onUpdateUser(editingUser.id, editForm);
    setEditingUser(null);
    setEditForm(null);
  };

  const saveTenantName = (tenantId) => {
    if (tenantNameDraft.trim()) onUpdateTenant(tenantId, { name: tenantNameDraft.trim() });
    setEditingTenantName(null);
  };

  const startResetPassword = (u) => {
    setResettingUser(u);
    setResetPassword("");
    setResetError("");
    setResetDone(false);
  };

  const submitResetPassword = () => {
    if (!resetPassword.trim() || resetPassword.trim().length < 4) {
      setResetError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    onUpdateUser(resettingUser.id, { password: resetPassword.trim() });
    setResetError("");
    setResetDone(true);
  };

  return (
    <div className="dos-root" style={{ flexDirection: "column" }}>
      <div className="dos-admin-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="dos-logo-mark"><img src={logo} alt="Diagnostic OS" /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Diagnostic OS</div>
            <div style={{ fontSize: 11, color: "#7FA3A3", fontFamily: "ui-monospace, monospace", letterSpacing: 0.6 }}>PANEL DE PLATAFORMA</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12.5, color: "#CFE3E3" }}>{activeUser.name} · Administrador de la plataforma</span>
          <div className="dos-account-logout" onClick={onLogout}><Icon name="ArrowLeftRight" size={12} /> Cerrar sesión</div>
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 980, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <p style={{ fontSize: 12.5, color: "var(--ink-dim)", marginBottom: 16 }}>
          Esta vista existe solo para el equipo de Diagnostic OS: aquí se crean los centros clientes y sus usuarios, se administran sus contraseñas y se conectan con sistemas externos. Ningún dueño de centro tiene acceso a esta pantalla.
        </p>

        <div className="dos-tabs">
          <div className={`dos-tab ${tab === "centros" ? "active" : ""}`} onClick={() => setTab("centros")}><Icon name="Building2" size={14} /> Centros y usuarios</div>
          <div className={`dos-tab ${tab === "integraciones" ? "active" : ""}`} onClick={() => setTab("integraciones")}><Icon name="Radio" size={14} /> Integraciones</div>
        </div>

        {tab === "centros" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button className="dos-btn dos-btn-primary" onClick={() => { setTenantForm(EMPTY_TENANT_FORM); setTenantError(""); setShowNewTenant(true); }}>
                <Icon name="Plus" size={14} /> Crear centro
              </button>
            </div>

            {tenants.length === 0 && (
              <div className="dos-empty"><Icon name="Building2" size={26} /><div>Todavía no hay centros registrados en la plataforma.</div></div>
            )}

            {tenants.map((t) => {
              const tenantUsers = allUsers.filter((u) => u.tenantId === t.id);
              return (
                <div className="dos-tenant-card" key={t.id}>
                  <div className="dos-tenant-card-head">
                    <div className="dos-tenant-card-mark"><Icon name="Building2" size={16} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingTenantName === t.id ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <input
                            style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "5px 8px", fontSize: 13, flex: 1 }}
                            value={tenantNameDraft}
                            onChange={(e) => setTenantNameDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveTenantName(t.id)}
                            autoFocus
                          />
                          <button className="dos-btn dos-btn-sm dos-btn-primary" onClick={() => saveTenantName(t.id)}><Icon name="Check" size={13} /></button>
                          <button className="dos-btn dos-btn-sm dos-btn-ghost" onClick={() => setEditingTenantName(null)}><Icon name="X" size={13} /></button>
                        </div>
                      ) : (
                        <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                          {t.name}
                          <Icon name="Pencil" size={12} color="var(--ink-faint)" style={{ cursor: "pointer" }} onClick={() => { setEditingTenantName(t.id); setTenantNameDraft(t.name); }} />
                        </div>
                      )}
                      <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>{t.kind} · Plan {t.plan} · {tenantUsers.length} usuario(s)</div>
                    </div>
                    <button className="dos-btn dos-btn-sm" onClick={() => { setUserForm(EMPTY_USER_FORM); setUserError(""); setAddUserTenantId(t.id); }}>
                      <Icon name="UserPlus" size={13} /> Agregar usuario
                    </button>
                  </div>

                  {tenantUsers.length === 0 ? (
                    <div className="dos-empty" style={{ padding: 20 }}><div>Este centro todavía no tiene usuarios.</div></div>
                  ) : (
                    tenantUsers.map((u) => (
                      <div className="dos-user-row" key={u.id}>
                        <div className="dos-avatar">{initialsOf(u.name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>{u.email}</div>
                        </div>
                        <span className={`dos-pill dos-pill-${ROLE_META[u.role]?.color || "teal"}`}>{ROLE_META[u.role]?.label || u.role}</span>
                        <div className="dos-user-row-actions">
                          <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => startEditUser(u)}><Icon name="Pencil" size={13} /></button>
                          <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => startResetPassword(u)} title="Restablecer contraseña"><Icon name="KeyRound" size={13} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "integraciones" && (
          <div>
            <div className="dos-field" style={{ maxWidth: 360, marginBottom: 16 }}>
              <label>Centro a inspeccionar</label>
              <select value={interopTenantId} onChange={(e) => setInteropTenantId(e.target.value)}>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {interopTenant ? (
              <InteropView
                studies={interopStudies}
                orders={interopOrders}
                patients={interopPatients}
                diagnosticReports={interopReports}
                integrationMessages={interopMessages}
                onSimulate={(kind) => onSimulate(kind, interopTenantId)}
                tenant={interopTenant}
                canEditConnectors
                onUpdateConnector={(patch) => onUpdateTenant(interopTenantId, { thirdPartyConnector: patch })}
              />
            ) : (
              <div className="dos-empty"><Icon name="Building2" size={26} /><div>Todavía no hay centros registrados en la plataforma.</div></div>
            )}
          </div>
        )}
      </div>

      {/* --- Modal: crear centro + dueño --- */}
      {showNewTenant && (
        <div className="dos-overlay" onClick={() => setShowNewTenant(false)}>
          <div className="dos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dos-modal-header"><h3>Crear centro</h3><button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setShowNewTenant(false)}><Icon name="X" size={15} /></button></div>
            <div className="dos-modal-body">
              <div className="dos-field"><label>Nombre del centro</label><input value={tenantForm.centerName} onChange={(e) => setTenantForm({ ...tenantForm, centerName: e.target.value })} placeholder="Ej. Laboratorio Clínico del Valle" /></div>
              <div className="dos-field">
                <label>Tipo</label>
                <select value={tenantForm.kind} onChange={(e) => setTenantForm({ ...tenantForm, kind: e.target.value })}>
                  {CENTER_KINDS.map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div className="dos-field"><label>Nombre del dueño / administrador</label><input value={tenantForm.ownerName} onChange={(e) => setTenantForm({ ...tenantForm, ownerName: e.target.value })} placeholder="Nombres y apellidos" /></div>
              <div className="dos-field"><label>Correo de acceso del dueño</label><input value={tenantForm.email} onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })} placeholder="correo@centro.com" /></div>
              <div className="dos-field"><label>Contraseña temporal</label><input type="password" value={tenantForm.password} onChange={(e) => setTenantForm({ ...tenantForm, password: e.target.value })} placeholder="El dueño podrá cambiarla luego" /></div>
              {tenantError && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{tenantError}</div>}
            </div>
            <div className="dos-modal-footer">
              <button className="dos-btn" onClick={() => setShowNewTenant(false)}>Cancelar</button>
              <button className="dos-btn dos-btn-primary" onClick={submitNewTenant}>Crear centro</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal: agregar usuario a un centro --- */}
      {addUserTenantId && (
        <div className="dos-overlay" onClick={() => setAddUserTenantId(null)}>
          <div className="dos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dos-modal-header"><h3>Agregar usuario · {tenants.find((t) => t.id === addUserTenantId)?.name}</h3><button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setAddUserTenantId(null)}><Icon name="X" size={15} /></button></div>
            <div className="dos-modal-body">
              <div className="dos-field"><label>Nombre completo</label><input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="Nombres y apellidos" /></div>
              <div className="dos-field"><label>Correo de acceso</label><input value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="correo@centro.com" /></div>
              <div className="dos-field"><label>Contraseña temporal</label><input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="El usuario podrá cambiarla luego" /></div>
              <div className="dos-field">
                <label>Rol</label>
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  {Object.entries(ROLE_META).filter(([key]) => key !== "platform_admin").map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
                </select>
              </div>
              {userError && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{userError}</div>}
            </div>
            <div className="dos-modal-footer">
              <button className="dos-btn" onClick={() => setAddUserTenantId(null)}>Cancelar</button>
              <button className="dos-btn dos-btn-primary" onClick={submitNewUser}>Guardar usuario</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal: editar usuario (nombre, correo, rol, contraseña) --- */}
      {editingUser && editForm && (
        <div className="dos-overlay" onClick={() => setEditingUser(null)}>
          <div className="dos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dos-modal-header"><h3>Editar usuario</h3><button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setEditingUser(null)}><Icon name="X" size={15} /></button></div>
            <div className="dos-modal-body">
              <div className="dos-field"><label>Nombre completo</label><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div className="dos-field"><label>Correo de acceso</label><input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div className="dos-field">
                <label>Rol</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                  {Object.entries(ROLE_META).filter(([key]) => key !== "platform_admin").map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
                </select>
              </div>
              <div className="dos-field">
                <label>Nueva contraseña</label>
                <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Déjalo en blanco para no cambiarla" />
              </div>
              {editError && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{editError}</div>}
            </div>
            <div className="dos-modal-footer">
              <button className="dos-btn" onClick={() => setEditingUser(null)}>Cancelar</button>
              <button className="dos-btn dos-btn-primary" onClick={submitEditUser}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
      {/* --- Modal: restablecer contraseña --- */}
      {resettingUser && (
        <div className="dos-overlay" onClick={() => setResettingUser(null)}>
          <div className="dos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dos-modal-header"><h3>Restablecer contraseña</h3><button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setResettingUser(null)}><Icon name="X" size={15} /></button></div>
            <div className="dos-modal-body">
              {resetDone ? (
                <p style={{ fontSize: 13.5 }}>
                  Listo — la contraseña de <strong>{resettingUser.name}</strong> ({resettingUser.email}) se actualizó. Compártesela por un canal seguro.
                </p>
              ) : (
                <>
                  <p style={{ fontSize: 13, color: "var(--ink-dim)", marginTop: 0 }}>
                    Nueva contraseña para <strong>{resettingUser.name}</strong> ({resettingUser.email}).
                  </p>
                  <div className="dos-field"><label>Nueva contraseña</label><input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="Mínimo 4 caracteres" onKeyDown={(e) => e.key === "Enter" && submitResetPassword()} autoFocus /></div>
                  {resetError && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{resetError}</div>}
                </>
              )}
            </div>
            <div className="dos-modal-footer">
              {resetDone ? (
                <button className="dos-btn dos-btn-primary" onClick={() => setResettingUser(null)}>Cerrar</button>
              ) : (
                <>
                  <button className="dos-btn" onClick={() => setResettingUser(null)}>Cancelar</button>
                  <button className="dos-btn dos-btn-primary" onClick={submitResetPassword}>Restablecer</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
