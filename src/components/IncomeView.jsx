import { useMemo } from "react";
import Icon from "./Icon.jsx";
import { patientFullName, ModalityPill } from "./common.jsx";
import { fmtDate } from "../lib/format.js";

export default function IncomeView({ studies, patients, catalog, diagnosticReports }) {
  const billable = useMemo(() => {
    return studies
      .filter((s) => s.status === "completed")
      .map((s) => {
        const svc = catalog.find((c) => c.code === s.serviceCode);
        const report = diagnosticReports.find((r) => r.id === s.reportId);
        return { study: s, price: svc?.price ?? 0, patient: patients.find((p) => p.id === s.patientId), report };
      })
      .sort((a, b) => new Date(b.study.completedAt) - new Date(a.study.completedAt));
  }, [studies, catalog, patients, diagnosticReports]);

  const total = billable.reduce((sum, r) => sum + r.price, 0);

  const byDay = useMemo(() => {
    const map = {};
    billable.forEach((r) => {
      const day = new Date(r.study.completedAt).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });
      map[day] = (map[day] || 0) + r.price;
    });
    return Object.entries(map);
  }, [billable]);

  const byModality = useMemo(() => {
    const map = {};
    billable.forEach((r) => { map[r.study.modality] = (map[r.study.modality] || 0) + r.price; });
    return Object.entries(map);
  }, [billable]);

  return (
    <div>
      <div className="dos-grid">
        <div className="dos-metric"><p className="dos-metric-label">Ingresos totales</p><p className="dos-metric-value" style={{ color: "var(--green)" }}>${total.toFixed(2)}</p></div>
        <div className="dos-metric"><p className="dos-metric-label">Estudios facturables</p><p className="dos-metric-value">{billable.length}</p></div>
        {byModality.map(([m, v]) => (
          <div className="dos-metric" key={m}><p className="dos-metric-label">Ingresos {m}</p><p className="dos-metric-value">${v.toFixed(2)}</p></div>
        ))}
      </div>

      <div className="dos-card" style={{ marginBottom: 16 }}>
        <div className="dos-card-header"><h3>Ingresos por día</h3></div>
        {byDay.length === 0 ? (
          <div className="dos-empty"><Icon name="FileJson" size={26} /><div>Aún no hay estudios completados.</div></div>
        ) : (
          <div style={{ padding: "4px 16px" }}>
            {byDay.map(([day, v]) => (
              <div key={day} className="dos-log-item"><span className="dos-log-dot" /><div style={{ flex: 1 }}>{day}</div><div className="dos-mono">${v.toFixed(2)}</div></div>
            ))}
          </div>
        )}
      </div>

      <div className="dos-card">
        <div className="dos-card-header"><h3>Detalle de estudios facturados</h3></div>
        {billable.length === 0 ? (
          <div className="dos-empty"><Icon name="ClipboardList" size={26} /><div>Aún no hay estudios completados para facturar.</div></div>
        ) : (
          <table className="dos-table">
            <thead><tr><th>Fecha</th><th>Paciente</th><th>Estudio</th><th>Modalidad</th><th>Precio</th></tr></thead>
            <tbody>
              {billable.map(({ study, price, patient }) => (
                <tr key={study.id}>
                  <td className="dos-mono">{fmtDate(study.completedAt)}</td>
                  <td>{patientFullName(patient)}</td>
                  <td>{study.serviceName}</td>
                  <td><ModalityPill modality={study.modality} /></td>
                  <td className="dos-mono">${price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 10 }}>
        El cálculo toma el precio vigente del catálogo al momento de completarse el estudio. Cambiar un precio en el Catálogo no recalcula estudios ya completados.
      </p>
    </div>
  );
}
