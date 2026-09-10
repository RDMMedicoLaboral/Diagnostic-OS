import { useState } from "react";
import Icon from "./Icon.jsx";
import { uid, initialsOf } from "../lib/format.js";
import { ROLE_META, MODALITIES } from "../data/catalogs.js";

export default function TeamView({ users, setUsers, tenantId, currentRole }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", role: "laboratorista", email: "", password: "" });
  const [error, setError] = useState("");

  const submit = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) { setError("Nombre, correo y contraseña son obligatorios."); return; }
    if (users.find((u) => u.email.toLowerCase() === form.email.trim().toLowerCase())) { setError("Ya existe un colaborador con ese correo."); return; }
    setUsers((prev) => [{ id: uid("usr"), tenantId, ...form, email: form.email.trim() }, ...prev]);
    setForm({ name: "", role: "laboratorista", email: "", password: "" });
    setError("");
    setShowAdd(false);
  };

  return (
    <div>
      {currentRole.manage ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button className="dos-btn dos-btn-primary" onClick={() => setShowAdd(true)}><Icon name="UserPlus" size={14} /> Agregar colaborador</button>
        </div>
      ) : (
        <p style={{ fontSize: 12.5, color: "var(--ink-dim)", marginBottom: 12 }}>Solo el dueño del centro puede agregar o quitar colaboradores.</p>
      )}
      <div className="dos-patient-list">
        {users.map((u) => (
          <div className="dos-patient-item" key={u.id}>
            <div className="dos-avatar">{initialsOf(u.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>Alcance: {ROLE_META[u.role].scope.map((s) => MODALITIES[s].code).join(" · ") || "—"} · {ROLE_META[u.role].permissions.length} permisos</div>
            </div>
            <span className={`dos-pill dos-pill-${ROLE_META[u.role].color}`}>{ROLE_META[u.role].label}</span>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="dos-overlay" onClick={() => setShowAdd(false)}>
          <div className="dos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dos-modal-header"><h3>Agregar colaborador</h3><button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setShowAdd(false)}><Icon name="X" size={15} /></button></div>
            <div className="dos-modal-body">
              <div className="dos-field"><label>Nombre completo</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombres y apellidos" /></div>
              <div className="dos-field"><label>Correo de acceso</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@centro.com" /></div>
              <div className="dos-field"><label>Contraseña temporal</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="El colaborador podrá cambiarla luego" /></div>
              <div className="dos-field">
                <label>Rol</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {Object.entries(ROLE_META).filter(([key]) => key !== "dueno").map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
                </select>
              </div>
              <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>El rol determina a qué exámenes tiene acceso: laboratorista ve solo laboratorio; tecnólogo en RX y ecografista ven su propia modalidad; radiólogo ve RX y ecografía.</p>
              {error && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{error}</div>}
            </div>
            <div className="dos-modal-footer">
              <button className="dos-btn" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="dos-btn dos-btn-primary" onClick={submit}>Guardar colaborador</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
