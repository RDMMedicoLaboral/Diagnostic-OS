import { useState } from "react";
import Icon from "../Icon.jsx";
import { ModalityPill, StudyStatusBadge, ReportStatusBadge, patientFullName } from "../common.jsx";
import { PERMISSIONS } from "../../data/catalogs.js";
import { uid } from "../../lib/format.js";

const STUDY_STEPS = ["scheduled", "arrived", "in-progress", "completed"];
const STUDY_STEP_LABELS = { scheduled: "Agendado", arrived: "Recibido", "in-progress": "En proceso", completed: "Completado" };

export default function StudyDetailModal({ study, order, patient, specimen, specimenHistory, results, report, template, currentRole, onClose, onAdvanceStatus, onSaveSpecimen, onRejectSpecimen, onSaveResults, onSaveStudyFields, onSaveReportDraft, onValidate, onPublish, onAmend, onShare }) {
  const isLab = study.modality === "LAB";
  const [localResults, setLocalResults] = useState(results || []);
  const [conclusion, setConclusion] = useState(report?.conclusion || "");
  const [bodySite, setBodySite] = useState(study.bodySite || "");
  const [laterality, setLaterality] = useState(study.laterality || "n/a");
  const [technique, setTechnique] = useState(study.technique || "");
  const [findings, setFindings] = useState(report?.findings || "");
  const [impression, setImpression] = useState(report?.impression || "");
  const [amendReason, setAmendReason] = useState("");
  const [showAmend, setShowAmend] = useState(false);
  const [specimenType, setSpecimenType] = useState(specimen?.type || "");
  const [criticalAck, setCriticalAck] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectDraftReason, setRejectDraftReason] = useState("");

  const hasUnackedCritical = isLab && localResults.some((r) => r.flag === "critico" && !r.criticalNotifiedAt);

  const canOperate = currentRole.manage || currentRole.scope.includes(study.modality);
  const canEnter = canOperate && (currentRole.permissions.includes(PERMISSIONS.ENTER_RESULT) || currentRole.permissions.includes(PERMISSIONS.CREATE_REPORT) || currentRole.manage);
  const canValidate = canOperate && (currentRole.permissions.includes(PERMISSIONS.VALIDATE_RESULT) || currentRole.permissions.includes(PERMISSIONS.VALIDATE_REPORT) || currentRole.manage);
  const canPublish = canOperate && (currentRole.permissions.includes(PERMISSIONS.PUBLISH_REPORT) || currentRole.manage);
  const canAmend = canOperate && (currentRole.permissions.includes(PERMISSIONS.AMEND_REPORT) || currentRole.manage);
  const reportEditable = report && ["draft", "amended"].includes(report.status);

  const addResult = () => setLocalResults((r) => [...r, { id: uid("RES"), analyte: "", value: "", unit: "", referenceRange: "", flag: "normal", status: "draft" }]);
  const updateResult = (id, field, val) => setLocalResults((r) => r.map((row) => (row.id === id ? { ...row, [field]: val } : row)));
  const removeResult = (id) => setLocalResults((r) => r.filter((row) => row.id !== id));

  const saveDraft = () => {
    if (isLab) {
      onSaveSpecimen({ type: specimenType });
      const withAck = localResults.map((r) =>
        r.flag === "critico" && criticalAck && !r.criticalNotifiedAt
          ? { ...r, critical: true, criticalNotifiedAt: new Date().toISOString() }
          : r
      );
      onSaveResults(withAck);
      onSaveReportDraft({ conclusion });
    } else {
      onSaveStudyFields({ bodySite, laterality, technique });
      onSaveReportDraft({ findings, impression });
    }
  };

  const applyTemplate = () => {
    if (!template) return;
    if (isLab) setConclusion(template.conclusion || "");
    else {
      setFindings(template.findings || "");
      setImpression(template.impression || "");
    }
  };

  const stepIndex = STUDY_STEPS.indexOf(study.status);

  return (
    <div className="dos-overlay" onClick={onClose}>
      <div className="dos-modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="dos-modal-header">
          <div>
            <h3>{study.serviceName}</h3>
            <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 2 }}>
              {patientFullName(patient)} · <ModalityPill modality={study.modality} /> · orden {order?.id}
            </div>
          </div>
          <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={onClose}><Icon name="X" size={15} /></button>
        </div>

        <div className="dos-timeline">
          {STUDY_STEPS.map((s, i) => (
            <span key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className={`dos-timeline-step ${i <= stepIndex ? "done" : ""}`}>{i < stepIndex ? <Icon name="CheckCircle2" size={12} /> : null} {STUDY_STEP_LABELS[s]}</span>
              {i < STUDY_STEPS.length - 1 && <span className="dos-timeline-sep">→</span>}
            </span>
          ))}
        </div>

        <div className="dos-modal-body">
          <div className="dos-section-title" style={{ marginTop: 0 }}>Contexto de la orden</div>
          <dl className="dos-kv" style={{ marginBottom: 8 }}>
            <dt>Motivo</dt><dd>{order?.reason || "—"}</dd>
            <dt>Prioridad</dt><dd style={{ textTransform: "capitalize" }}>{order?.priority}</dd>
            <dt>Solicitante</dt><dd>{order?.requestingPractitioner?.name || "Interno"}</dd>
            <dt>Origen</dt><dd>{order?.sourceType === "interno" ? "Creación interna" : `${order.sourceType}${order.externalOrderId ? ` · ${order.externalOrderId}` : ""}`}</dd>
          </dl>

          {!canEnter && (
            <div style={{ background: "var(--amber-tint)", color: "var(--amber)", fontSize: 12.5, padding: "8px 12px", borderRadius: 7, marginBottom: 14 }}>
              Tu rol no tiene permiso para registrar resultados en esta modalidad. Solo puedes consultar.
            </div>
          )}

          {canOperate && stepIndex < STUDY_STEPS.length - 1 && (
            <button className="dos-btn dos-btn-sm" style={{ marginBottom: 14 }} onClick={() => onAdvanceStatus(STUDY_STEPS[stepIndex + 1])}>
              Marcar como "{STUDY_STEP_LABELS[STUDY_STEPS[stepIndex + 1]]}"
            </button>
          )}

          {isLab ? (
            <div>
              <div className="dos-section-title">Muestra</div>
              {specimenHistory && specimenHistory.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {specimenHistory.map((sp) => (
                    <div key={sp.id} className="dos-alert-row" style={{ padding: "6px 0" }}>
                      <Icon name="AlertTriangle" size={12} color="var(--red)" />
                      Toma anterior rechazada ({sp.type || "sin tipo registrado"}): {sp.rejectionReason}
                    </div>
                  ))}
                </div>
              )}
              <div className="dos-field-row">
                <div className="dos-field"><label>Tipo de muestra</label><input disabled={!canEnter} value={specimenType} onChange={(e) => setSpecimenType(e.target.value)} placeholder="Ej. Sangre venosa" /></div>
                <div className="dos-field"><label>Estado</label><input disabled value={specimen?.status ? { pending: "Pendiente de toma", collected: "Tomada", received: "Recibida", rejected: "Rechazada" }[specimen.status] || specimen.status : "—"} /></div>
              </div>
              {canEnter && specimen?.status !== "rejected" && !showReject && (
                <button className="dos-btn dos-btn-sm" style={{ marginBottom: 10 }} onClick={() => setShowReject(true)}>Rechazar muestra y solicitar nueva toma</button>
              )}
              {showReject && (
                <div className="dos-field">
                  <label>Motivo de rechazo (obligatorio)</label>
                  <textarea value={rejectDraftReason} onChange={(e) => setRejectDraftReason(e.target.value)} placeholder="Ej. Muestra hemolizada, volumen insuficiente…" />
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button className="dos-btn dos-btn-sm" onClick={() => { setShowReject(false); setRejectDraftReason(""); }}>Cancelar</button>
                    <button
                      className="dos-btn dos-btn-primary dos-btn-sm"
                      onClick={() => {
                        if (!rejectDraftReason.trim()) return;
                        onRejectSpecimen(rejectDraftReason.trim());
                        setShowReject(false);
                        setRejectDraftReason("");
                        setSpecimenType("");
                      }}
                    >
                      Confirmar rechazo y registrar nueva toma
                    </button>
                  </div>
                </div>
              )}

              <div className="dos-section-title">Resultados</div>
              {localResults.map((r) => (
                <div className="dos-test-row" key={r.id}>
                  <input disabled={!canEnter} placeholder="Analito" value={r.analyte} onChange={(e) => updateResult(r.id, "analyte", e.target.value)} />
                  <input disabled={!canEnter} placeholder="Valor" value={r.value} onChange={(e) => updateResult(r.id, "value", e.target.value)} />
                  <input disabled={!canEnter} placeholder="Unidad" value={r.unit} onChange={(e) => updateResult(r.id, "unit", e.target.value)} />
                  <input disabled={!canEnter} placeholder="Rango ref." value={r.referenceRange} onChange={(e) => updateResult(r.id, "referenceRange", e.target.value)} />
                  <select disabled={!canEnter} value={r.flag} onChange={(e) => updateResult(r.id, "flag", e.target.value)} style={{ fontSize: 12 }}>
                    <option value="normal">Normal</option>
                    <option value="alto">Alto</option>
                    <option value="bajo">Bajo</option>
                    <option value="critico">Crítico</option>
                  </select>
                  {canEnter && <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={() => removeResult(r.id)}><Icon name="Trash2" size={13} /></button>}
                </div>
              ))}
              {canEnter && <button className="dos-btn dos-btn-sm" style={{ marginTop: 4, marginBottom: 14 }} onClick={addResult}><Icon name="Plus" size={13} /> Agregar analito</button>}

              {hasUnackedCritical && (
                <div style={{ background: "var(--red-tint)", color: "var(--red)", fontSize: 12.5, padding: "10px 12px", borderRadius: 7, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, marginBottom: 6 }}>
                    <Icon name="AlertTriangle" size={14} /> Hay un resultado marcado como crítico
                  </div>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 6, fontWeight: 400, cursor: "pointer" }}>
                    <input type="checkbox" checked={criticalAck} onChange={(e) => setCriticalAck(e.target.checked)} style={{ marginTop: 2 }} />
                    Confirmo que notifiqué este resultado crítico al profesional solicitante.
                  </label>
                </div>
              )}

              <div className="dos-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ marginBottom: 0 }}>Conclusión del informe</label>
                  {template && reportEditable && canEnter && <button className="dos-btn dos-btn-ghost dos-btn-sm" onClick={applyTemplate}><Icon name="FileJson" size={12} /> Usar plantilla</button>}
                </div>
                <textarea disabled={!reportEditable || !canEnter} value={conclusion} onChange={(e) => setConclusion(e.target.value)} placeholder="Interpretación clínica del resultado" />
              </div>
            </div>
          ) : (
            <div>
              <div className="dos-field-row">
                <div className="dos-field"><label>Región anatómica</label><input disabled={!canEnter} value={bodySite} onChange={(e) => setBodySite(e.target.value)} placeholder="Ej. Tórax" /></div>
                <div className="dos-field">
                  <label>Lateralidad</label>
                  <select disabled={!canEnter} value={laterality} onChange={(e) => setLaterality(e.target.value)}>
                    <option value="n/a">No aplica</option>
                    <option value="izquierda">Izquierda</option>
                    <option value="derecha">Derecha</option>
                    <option value="bilateral">Bilateral</option>
                  </select>
                </div>
              </div>
              <div className="dos-field"><label>Técnica</label><input disabled={!canEnter} value={technique} onChange={(e) => setTechnique(e.target.value)} placeholder="Proyección o abordaje utilizado" /></div>
              {template && reportEditable && canEnter && (
                <button className="dos-btn dos-btn-ghost dos-btn-sm" style={{ marginBottom: 8 }} onClick={applyTemplate}><Icon name="FileJson" size={12} /> Usar plantilla del estudio</button>
              )}
              <div className="dos-field"><label>Hallazgos</label><textarea disabled={!reportEditable || !canEnter} value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="Descripción de los hallazgos" /></div>
              <div className="dos-field"><label>Impresión diagnóstica</label><textarea disabled={!reportEditable || !canEnter} value={impression} onChange={(e) => setImpression(e.target.value)} placeholder="Conclusión del estudio" /></div>
              <p style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>Accession Number: <span className="dos-mono">{study.accessionNumber || "—"}</span> · Study Instance UID reservado para integración DICOM/PACS futura.</p>
            </div>
          )}

          {report && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>Estado del informe:</span>
              <ReportStatusBadge status={report.status} />
              <span className="dos-mono" style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>v{report.version}</span>
            </div>
          )}

          {showAmend && (
            <div className="dos-field" style={{ marginTop: 10 }}>
              <label>Motivo de la corrección (obligatorio)</label>
              <textarea value={amendReason} onChange={(e) => setAmendReason(e.target.value)} placeholder="Explica por qué se corrige el informe ya publicado" />
            </div>
          )}
        </div>

        <div className="dos-modal-footer" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {canValidate && (report?.status === "draft" || report?.status === "amended") && <button className="dos-btn" disabled={hasUnackedCritical && !criticalAck} onClick={() => { saveDraft(); onValidate(); }}>Validar</button>}
            {canPublish && report?.status === "validated" && <button className="dos-btn dos-btn-primary" onClick={onPublish}><Icon name="CheckCircle2" size={14} /> Publicar informe</button>}
            {canPublish && report?.status === "published" && <button className="dos-btn dos-btn-primary" onClick={onShare}><Icon name="Share2" size={14} /> Compartir con sistemas externos</button>}
            {canAmend && report?.status === "published" && !showAmend && <button className="dos-btn" onClick={() => setShowAmend(true)}>Corregir informe</button>}
            {showAmend && (
              <button className="dos-btn dos-btn-primary" onClick={() => { if (amendReason.trim()) { onAmend(amendReason.trim()); setShowAmend(false); } }}>Confirmar corrección</button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {canEnter && reportEditable && <button className="dos-btn" disabled={hasUnackedCritical && !criticalAck} onClick={saveDraft}>Guardar borrador</button>}
            <button className="dos-btn" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
