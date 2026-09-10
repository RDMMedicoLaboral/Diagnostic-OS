import { useState } from "react";
import Icon from "./Icon.jsx";
import { uid, initialsOf } from "../lib/format.js";
import { createPatient } from "../data/models.js";

const MATCH_LABEL = {
  confirmado: { label: "Confirmado", tone: "green" },
  pendiente: { label: "Pendiente de confirmar", tone: "amber" },
  posible_duplicado: { label: "Posible duplicado", tone: "coral" },
};

export default function PatientsView({ patients, setPatients, tenantId, onOpenPatient }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", documentType: "cedula", documentNumber: "", birthDate: "", sex: "F" });
  const [error, setError] = useState("");

  const submit = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.documentNumber.trim()) {
      setError("Nombres, apellidos y documento son obligatorios.");
      return;
    }
    const patient = createPatient({ tenantId, ...form });
    setPatients((prev) => [patient, ...prev]);
    setForm({ firstName: "", lastName: "", documentType: "cedula", documentNumber: "", birthDate: "", sex: "F" });
    setError("");
    setShowAdd(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="dos-btn dos-btn-primary" onClick={() => setShowAdd(true)}><Icon name="UserPlus" size={14} /> Nuevo paciente</button>
      </div>
      <div className="dos-patient-list">
        {patients.map((p) => {
          const match = MATCH_LABEL[p.matchStatus] || MATCH_LABEL.confirmado;
          return (
            <div className="dos-patient-item" key={p.id} style={{ cursor: "pointer" }} onClick={() => onOpenPatient(p)}>
              <div className="dos-avatar">{initialsOf(`${p.firstName} ${p.lastName}`)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{p.firstName} {p.lastName}</div>
                <div style={{ fontSize: 12, color: "var(--ink-dim)" }} className="dos-mono">
                  {p.documentType === "cedula" ? "C.I." : p.documentType === "ruc" ? "RUC" : "Pas."} {p.documentNumber} · {p.sex} · nac. {p.birthDate || "—"}
                  {p.sourceSystem && <> · origen: {p.sourceSystem}</>}
                </div>
              </div>
              <span className={`dos-pill dos-tone-${match.tone}`}>{match.label}</span>
              <Icon name="ChevronRight" size={15} color="var(--ink-faint)" />
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="dos-overlay" onClick={() => setShowAdd(false)}>
          <div className="dos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dos-modal-header"><h3>Nuevo paciente</h3><button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setShowAdd(false)}><Icon name="X" size={15} /></button></div>
            <div className="dos-modal-body">
              <div className="dos-field-row">
                <div className="dos-field"><label>Nombres</label><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Nombres" /></div>
                <div className="dos-field"><label>Apellidos</label><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Apellidos" /></div>
              </div>
              <div className="dos-field-row">
                <div className="dos-field">
                  <label>Tipo de documento</label>
                  <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })}>
                    <option value="cedula">Cédula</option>
                    <option value="pasaporte">Pasaporte</option>
                    <option value="ruc">RUC</option>
                  </select>
                </div>
                <div className="dos-field"><label>Número de documento</label><input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} placeholder="Cédula, pasaporte o RUC" /></div>
              </div>
              <div className="dos-field-row">
                <div className="dos-field"><label>Fecha de nacimiento</label><input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div>
                <div className="dos-field">
                  <label>Sexo</label>
                  <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                    <option value="F">Femenino</option>
                    <option value="M">Masculino</option>
                  </select>
                </div>
              </div>
              {error && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{error}</div>}
            </div>
            <div className="dos-modal-footer">
              <button className="dos-btn" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="dos-btn dos-btn-primary" onClick={submit}>Guardar paciente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
