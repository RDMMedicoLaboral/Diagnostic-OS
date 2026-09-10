import { useState, useMemo } from "react";
import Icon from "../Icon.jsx";
import { ORDER_SOURCES, PRIORITIES } from "../../data/catalogs.js";
import { patientFullName } from "../common.jsx";

export default function NewOrderModal({ onClose, patients, catalog, allowedModalities, onCreate }) {
  const [patientId, setPatientId] = useState(patients[0]?.id || "");
  const [patientQuery, setPatientQuery] = useState("");
  const [sourceType, setSourceType] = useState("interno");
  const [practitionerName, setPractitionerName] = useState("");
  const [practitionerSpecialty, setPractitionerSpecialty] = useState("");
  const [reason, setReason] = useState("");
  const [presumptiveDiagnosis, setPresumptiveDiagnosis] = useState("");
  const [priority, setPriority] = useState("rutina");
  const [notes, setNotes] = useState("");
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [error, setError] = useState("");

  const availableServices = catalog.filter((s) => s.active && allowedModalities.includes(s.modality));
  const filteredPatients = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => `${p.firstName} ${p.lastName} ${p.documentNumber}`.toLowerCase().includes(q));
  }, [patients, patientQuery]);

  const toggleService = (code) => {
    setSelectedCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const submit = () => {
    if (!patientId) { setError("Selecciona un paciente."); return; }
    if (selectedCodes.length === 0) { setError("Selecciona al menos un estudio del catálogo."); return; }
    if (!reason.trim()) { setError("Indica el motivo de la orden."); return; }
    setError("");
    onCreate({
      patientId,
      sourceType,
      requestingPractitioner: practitionerName.trim() ? { name: practitionerName.trim(), specialty: practitionerSpecialty.trim(), organization: null, externalId: null } : null,
      reason: reason.trim(),
      presumptiveDiagnosis: presumptiveDiagnosis.trim(),
      priority,
      notes: notes.trim(),
      serviceCodes: selectedCodes,
    });
  };

  return (
    <div className="dos-overlay" onClick={onClose}>
      <div className="dos-modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="dos-modal-header"><h3>Nueva orden diagnóstica</h3><button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={onClose}><Icon name="X" size={15} /></button></div>
        <div className="dos-modal-body">
          <div className="dos-section-title" style={{ marginTop: 0 }}>Paciente</div>
          <div className="dos-field"><input value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} placeholder="Buscar por nombre o documento…" /></div>
          <div className="dos-field">
            <select size={Math.min(5, Math.max(3, filteredPatients.length))} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              {filteredPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {patientFullName(p)} — {p.documentNumber}{p.sourceSystem ? ` · origen: ${p.sourceSystem}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="dos-section-title">Origen y solicitante</div>
          <div className="dos-field-row">
            <div className="dos-field">
              <label>Origen de la orden</label>
              <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                {Object.entries(ORDER_SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="dos-field"><label>Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="dos-field-row">
            <div className="dos-field"><label>Profesional solicitante</label><input value={practitionerName} onChange={(e) => setPractitionerName(e.target.value)} placeholder="Nombre (opcional si es interno)" /></div>
            <div className="dos-field"><label>Especialidad</label><input value={practitionerSpecialty} onChange={(e) => setPractitionerSpecialty(e.target.value)} placeholder="Ej. Medicina interna" /></div>
          </div>

          <div className="dos-section-title">Motivo</div>
          <div className="dos-field"><label>Indicación clínica</label><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo de la orden" /></div>
          <div className="dos-field"><label>Diagnóstico presuntivo (opcional)</label><input value={presumptiveDiagnosis} onChange={(e) => setPresumptiveDiagnosis(e.target.value)} placeholder="Ej. Sospecha de proceso infeccioso" /></div>

          <div className="dos-section-title">Estudios</div>
          {availableServices.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>No hay estudios del catálogo disponibles para tu rol.</p>
          ) : (
            availableServices.map((svc) => {
              const checked = selectedCodes.includes(svc.code);
              return (
                <label key={svc.code} className={`dos-check-row ${checked ? "checked" : ""}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleService(svc.code)} />
                  <div className="dos-check-row-body">
                    <div className="dos-check-row-title">{svc.name} <span className="dos-mono" style={{ fontWeight: 400, color: "var(--ink-faint)" }}>· {svc.code}</span></div>
                    <div className="dos-check-row-sub">Preparación: {svc.preparation || "Sin requisitos especiales"} · Tiempo estimado: {svc.estimatedTime}</div>
                  </div>
                </label>
              );
            })
          )}

          <div className="dos-field" style={{ marginTop: 10 }}><label>Observaciones</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas clínicas u operativas" /></div>
          {error && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{error}</div>}
        </div>
        <div className="dos-modal-footer">
          <button className="dos-btn" onClick={onClose}>Cancelar</button>
          <button className="dos-btn dos-btn-primary" onClick={submit}>Crear orden</button>
        </div>
      </div>
    </div>
  );
}
