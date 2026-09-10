import { useState } from "react";
import Icon from "./Icon.jsx";
import { ModalityPill } from "./common.jsx";

export default function CatalogView({ catalog, hours, onUpdateHours, canManage, onUpdatePrice, onToggleActive, onAddService }) {
  const [editingId, setEditingId] = useState(null);
  const [draftPrice, setDraftPrice] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", modality: "LAB", price: "", preparation: "", estimatedTime: "" });
  const [error, setError] = useState("");

  const startEdit = (svc) => { setEditingId(svc.id); setDraftPrice(String(svc.price ?? "")); };
  const confirmEdit = (svc) => {
    const value = Number(draftPrice);
    if (!Number.isNaN(value) && value >= 0) onUpdatePrice(svc.id, value);
    setEditingId(null);
  };

  const submitAdd = () => {
    if (!form.code.trim() || !form.name.trim()) { setError("Código y nombre son obligatorios."); return; }
    if (catalog.some((c) => c.code.toLowerCase() === form.code.trim().toLowerCase())) { setError("Ya existe un estudio con ese código."); return; }
    const price = Number(form.price);
    onAddService({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      modality: form.modality,
      price: Number.isNaN(price) ? 0 : price,
      preparation: form.preparation.trim(),
      estimatedTime: form.estimatedTime.trim() || "—",
    });
    setForm({ code: "", name: "", modality: "LAB", price: "", preparation: "", estimatedTime: "" });
    setError("");
    setShowAdd(false);
  };

  return (
    <div>
      <div className="dos-card" style={{ marginBottom: 16 }}>
        <div className="dos-card-header"><h3>Horario de atención</h3></div>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div className="dos-field" style={{ marginBottom: 0 }}>
            <label>Abre</label>
            <input type="time" disabled={!canManage} value={hours.open} onChange={(e) => onUpdateHours({ ...hours, open: e.target.value })} style={{ width: 110 }} />
          </div>
          <div className="dos-field" style={{ marginBottom: 0 }}>
            <label>Cierra</label>
            <input type="time" disabled={!canManage} value={hours.close} onChange={(e) => onUpdateHours({ ...hours, close: e.target.value })} style={{ width: 110 }} />
          </div>
          <p style={{ fontSize: 11.5, color: "var(--ink-faint)", margin: 0 }}>Este horario es el que se ofrece en la página de reservas en línea.</p>
        </div>
      </div>

      <div className="dos-card">
      <div className="dos-card-header">
        <h3>Catálogo y tarifario del centro</h3>
        {canManage && <button className="dos-btn dos-btn-primary dos-btn-sm" onClick={() => setShowAdd(true)}><Icon name="Plus" size={13} /> Agregar estudio</button>}
      </div>
      {catalog.length === 0 ? (
        <div className="dos-empty"><Icon name="ClipboardList" size={26} /><div>Este centro aún no tiene estudios configurados.{canManage ? " Usa \"Agregar estudio\" para crear el primero." : ""}</div></div>
      ) : (
        <table className="dos-table">
          <thead><tr><th>Código</th><th>Nombre</th><th>Modalidad</th><th>Preparación</th><th>Tiempo estimado</th><th>Precio</th><th>Estado</th></tr></thead>
          <tbody>
            {catalog.map((svc) => (
              <tr key={svc.id}>
                <td className="dos-mono">{svc.code}</td>
                <td>{svc.name}</td>
                <td><ModalityPill modality={svc.modality} /></td>
                <td style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>{svc.preparation || "—"}</td>
                <td>{svc.estimatedTime}</td>
                <td className="dos-mono">
                  {editingId === svc.id ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        style={{ width: 70, padding: "3px 6px", fontSize: 12.5 }}
                        value={draftPrice}
                        onChange={(e) => setDraftPrice(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && confirmEdit(svc)}
                        autoFocus
                      />
                      <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => confirmEdit(svc)}><Icon name="CheckCircle2" size={13} /></button>
                    </span>
                  ) : (
                    <span onClick={() => canManage && startEdit(svc)} style={{ cursor: canManage ? "pointer" : "default", borderBottom: canManage ? "1px dashed var(--ink-faint)" : "none" }}>
                      ${svc.price?.toFixed(2)}
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`dos-pill ${svc.active ? "dos-tone-green" : "dos-tone-amber"}`}
                    style={{ cursor: canManage ? "pointer" : "default" }}
                    onClick={() => canManage && onToggleActive(svc.id)}
                  >
                    {svc.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ fontSize: 11.5, color: "var(--ink-faint)", padding: "10px 16px 14px", margin: 0, borderTop: "1px solid var(--line)" }}>
        {canManage
          ? "Haz clic en un precio o en el estado para editarlo. Estos precios alimentan directamente el cálculo de ingresos."
          : "Este catálogo es por centro: un tenant que solo ofrece laboratorio simplemente no tiene aquí estudios de imagen."}
      </p>

      {showAdd && (
        <div className="dos-overlay" onClick={() => setShowAdd(false)}>
          <div className="dos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dos-modal-header"><h3>Agregar estudio al catálogo</h3><button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => setShowAdd(false)}><Icon name="X" size={15} /></button></div>
            <div className="dos-modal-body">
              <div className="dos-field-row">
                <div className="dos-field"><label>Código</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Ej. LAB-TSH" /></div>
                <div className="dos-field">
                  <label>Modalidad</label>
                  <select value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })}>
                    <option value="LAB">Laboratorio</option>
                    <option value="RX">Radiografía</option>
                    <option value="ECO">Ecografía</option>
                  </select>
                </div>
              </div>
              <div className="dos-field"><label>Nombre del estudio</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. TSH (hormona tiroestimulante)" /></div>
              <div className="dos-field-row">
                <div className="dos-field"><label>Precio (USD)</label><input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" /></div>
                <div className="dos-field"><label>Tiempo estimado</label><input value={form.estimatedTime} onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })} placeholder="Ej. 2 horas" /></div>
              </div>
              <div className="dos-field"><label>Preparación</label><input value={form.preparation} onChange={(e) => setForm({ ...form, preparation: e.target.value })} placeholder="Ej. Ayuno de 8 horas" /></div>
              {error && <div style={{ color: "var(--red)", fontSize: 12.5 }}>{error}</div>}
            </div>
            <div className="dos-modal-footer">
              <button className="dos-btn" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="dos-btn dos-btn-primary" onClick={submitAdd}>Guardar estudio</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
