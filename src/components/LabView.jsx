import { StudyTable } from "./common.jsx";

export default function LabView({ studies, orders, patients, onOpen }) {
  const rows = studies
    .filter((s) => s.modality === "LAB")
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
    .map((study) => ({
      study,
      order: orders.find((o) => o.id === study.orderId),
      patient: patients.find((p) => p.id === study.patientId),
    }));

  return (
    <div className="dos-card">
      <div className="dos-card-header"><h3>Bandeja de laboratorio</h3></div>
      <StudyTable rows={rows} onOpen={onOpen} emptyLabel="Aún no hay estudios de laboratorio." emptyIconName="FlaskConical" />
    </div>
  );
}
