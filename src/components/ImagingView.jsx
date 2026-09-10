import { useState } from "react";
import Icon from "./Icon.jsx";
import { StudyTable } from "./common.jsx";
import { MODALITIES } from "../data/catalogs.js";

export default function ImagingView({ studies, orders, patients, onOpen, availableModalities }) {
  const imagingModalities = availableModalities.filter((m) => MODALITIES[m]?.category === "imaging");
  const [tab, setTab] = useState(imagingModalities[0] || "RX");

  const rows = studies
    .filter((s) => s.modality === tab)
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
    .map((study) => ({
      study,
      order: orders.find((o) => o.id === study.orderId),
      patient: patients.find((p) => p.id === study.patientId),
    }));

  return (
    <div>
      <div className="dos-tabs">
        {imagingModalities.map((m) => (
          <div key={m} className={`dos-tab ${tab === m ? "active" : ""}`} onClick={() => setTab(m)}>
            <Icon name={MODALITIES[m].icon} size={14} /> {MODALITIES[m].label}
          </div>
        ))}
      </div>
      <div className="dos-card">
        <div className="dos-card-header"><h3>Bandeja de {MODALITIES[tab]?.label.toLowerCase()}</h3></div>
        <StudyTable rows={rows} onOpen={onOpen} emptyLabel="Aún no hay estudios registrados en esta modalidad." emptyIconName="ScanLine" />
      </div>
    </div>
  );
}
