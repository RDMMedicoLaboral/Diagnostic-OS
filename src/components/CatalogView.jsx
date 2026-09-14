import { useState } from "react";
import Icon from "./Icon.jsx";
import { ModalityPill } from "./common.jsx";
import { api } from "../lib/api.js";

export default function CatalogView({ catalog, hours, onUpdateHours, canManage, onUpdatePrice, onToggleActive, onAddService, onImportCatalog }) {
  const [editingId, setEditingId] = useState(null);
  const [draftPrice, setDraftPrice] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", modality: "LAB", price: "", preparation: "", estimatedTime: "" });
  const [error, setError] = useState("");

  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importWarnings, setImportWarnings] = useState([]);
  const [importRows, setImportRows] = useState(null); // null = todavía no se subió archivo

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

  const closeImport = () => { setShowImport(false); setImportRows(null); setImportError(""); setImportWarnings([]); };

  const handleFileSelected = async (file) => {
    if (!file) return;
    setImporting(true);
    setImportError("");
    setImportRows(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await api.upload("/api/catalog-import", formData);
      const rows = (result.items || []).map((it) => ({ ...it, included: true }));
      setImportRows(rows);
      setImportWarnings(result.warnings || []);
      if (rows.length === 0) setImportError("No se encontraron filas válidas en el archivo.");
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const updateImportRow = (i, patch) => setImportRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const confirmImport = () => {
    const toImport = importRows.filter((r) => r.included && r.name.trim() && r.code.trim());
    const existingCodes = new Set(catalog.map((c) => c.code.toLowerCase()));
    const finalItems = toImport
      .filter((r) => !existingCodes.has(r.code.trim().toLowerCase()))
      .map((r) => ({ code: r.code.trim().toUpperCase(), name: r.name.trim(), modality: r.modality, price: Number(r.price) || 0, preparation: r.preparation || "", estimatedTime: r.estimatedTime || "—" }));
    onImportCatalog(finalItems);
    closeImport();
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
        {canManage && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="dos-btn dos-btn-sm" onClick={() => setShowImport(true)}><Icon name="ArrowDownToLine" size={13} /> Importar (Excel/PDF)</button>
            <button className="dos-btn dos-btn-primary dos-btn-sm" onClick={() => setShowAdd(true)}><Icon name="Plus" size={13} /> Agregar estudio</button>
          </div>
        )}
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

      {showImport && (
        <div className="dos-overlay" onClick={closeImport}>
          <div className="dos-modal" style={{ maxWidth: importRows ? 720 : 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="dos-modal-header"><h3>Importar catálogo desde Excel/CSV o PDF</h3><button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={closeImport}><Icon name="X" size={15} /></button></div>
            <div className="dos-modal-body">
              {!importRows ? (
                <>
                  <p style={{ fontSize: 13, color: "var(--ink-dim)", marginTop: 0 }}>
                    Sube un archivo .xlsx, .csv o .pdf con tu lista de exámenes y precios. Ideal: columnas "Nombre" y "Precio" (opcional: Código, Modalidad, Preparación). Después de leerlo podrás revisar y editar cada fila antes de agregarla al catálogo.
                  </p>
                  <input type="file" accept=".xlsx,.xls,.csv,.pdf" onChange={(e) => handleFileSelected(e.target.files?.[0])} disabled={importing} />
                  {importing && <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}><Icon name="Loader2" size={13} style={{ animation: "spin 1s linear infinite", verticalAlign: "-2px" }} /> Leyendo archivo…</p>}
                  {importError && <div style={{ color: "var(--red)", fontSize: 12.5, marginTop: 8 }}>{importError}</div>}
                </>
              ) : (
                <>
                  {importWarnings.map((w, i) => (
                    <div key={i} style={{ background: "var(--amber-tint)", color: "var(--amber)", fontSize: 12, padding: "6px 10px", borderRadius: 6, marginBottom: 8 }}>{w}</div>
                  ))}
                  <p style={{ fontSize: 12.5, color: "var(--ink-dim)", marginTop: 0 }}>
                    Se encontraron {importRows.length} fila(s). Desmarca las que no quieras importar, y corrige lo que haga falta.
                  </p>
                  <div style={{ maxHeight: 340, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
                    <table className="dos-table">
                      <thead><tr><th></th><th>Nombre</th><th>Modalidad</th><th>Precio</th><th>Código</th></tr></thead>
                      <tbody>
                        {importRows.map((row, i) => {
                          const isDuplicate = catalog.some((c) => c.code.toLowerCase() === row.code.trim().toLowerCase());
                          return (
                            <tr key={i} style={{ opacity: row.included ? 1 : 0.45 }}>
                              <td><input type="checkbox" checked={row.included} onChange={(e) => updateImportRow(i, { included: e.target.checked })} /></td>
                              <td><input style={{ width: 190, fontSize: 12.5, padding: "3px 6px" }} value={row.name} onChange={(e) => updateImportRow(i, { name: e.target.value })} /></td>
                              <td>
                                <select style={{ fontSize: 12.5, padding: "3px 4px" }} value={row.modality} onChange={(e) => updateImportRow(i, { modality: e.target.value })}>
                                  <option value="LAB">Lab</option>
                                  <option value="RX">RX</option>
                                  <option value="ECO">Eco</option>
                                </select>
                              </td>
                              <td><input style={{ width: 70, fontSize: 12.5, padding: "3px 6px" }} value={row.price} onChange={(e) => updateImportRow(i, { price: e.target.value })} /></td>
                              <td>
                                <input style={{ width: 130, fontSize: 11.5, padding: "3px 6px" }} value={row.code} onChange={(e) => updateImportRow(i, { code: e.target.value })} />
                                {isDuplicate && <div style={{ fontSize: 10.5, color: "var(--red)" }}>Código repetido — se omitirá</div>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="dos-modal-footer">
              <button className="dos-btn" onClick={closeImport}>Cancelar</button>
              {importRows && (
                <button className="dos-btn dos-btn-primary" onClick={confirmImport}>
                  Importar {importRows.filter((r) => r.included).length} estudio(s)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
