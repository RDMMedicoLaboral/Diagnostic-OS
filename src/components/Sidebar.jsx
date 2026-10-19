import Icon from "./Icon.jsx";
import logo from "../assets/logo.png";
import { PERMISSIONS } from "../data/catalogs.js";

export default function Sidebar({ view, setView, counts, tenant, activeUser, currentRole, tenantModalities, onLogout }) {
  const hasLab = tenantModalities.includes("LAB");
  const hasImaging = tenantModalities.includes("RX") || tenantModalities.includes("ECO");
  const items = [
    { id: "dashboard", label: "Panel general", icon: "LayoutDashboard", show: true },
    { id: "patients", label: "Pacientes", icon: "Users", count: counts.patients, show: true },
    { id: "lab", label: "Laboratorio", icon: "FlaskConical", count: counts.lab, show: hasLab && (currentRole.manage || currentRole.scope.includes("LAB")) },
    { id: "imaging", label: "Imágenes", icon: "ScanLine", count: counts.imaging, show: hasImaging && (currentRole.manage || currentRole.scope.includes("RX") || currentRole.scope.includes("ECO")) },
    { id: "catalog", label: "Catálogo", icon: "ClipboardList", show: true },
    { id: "agenda", label: "Agenda", icon: "CalendarClock", count: counts.appointments, show: currentRole.manage || currentRole.permissions.includes(PERMISSIONS.CREATE_ORDER) },
    { id: "interop", label: "Centro de Integraciones", icon: "Radio", show: currentRole.permissions.includes(PERMISSIONS.MANAGE_INTEGRATIONS) },
    { id: "income", label: "Ingresos", icon: "FileJson", show: currentRole.manage },
    { id: "audit", label: "Auditoría", icon: "FileJson", show: currentRole.manage || currentRole.permissions.includes(PERMISSIONS.VIEW_AUDIT) },
    { id: "team", label: "Equipo", icon: "Stethoscope", show: true },
  ].filter((it) => it.show);

  return (
    <div className="dos-sidebar">
      <div className="dos-logo">
        <div className="dos-logo-mark"><img src={logo} alt="Diagnostic OS" /></div>
        <div>
          <div className="dos-logo-text">Diagnostic OS</div>
          <div className="dos-logo-sub">MULTI-CENTRO</div>
        </div>
      </div>
      <div className="dos-account-block">
        <div className="dos-account-tenant">{tenant.name}</div>
        <div className="dos-account-user">{activeUser.name} · {currentRole.label}</div>
        <div className="dos-account-logout" onClick={onLogout}><Icon name="ArrowLeftRight" size={12} /> Cerrar sesión</div>
      </div>
      <div className="dos-nav">
        {items.map((it) => (
          <button key={it.id} className={`dos-nav-item ${view === it.id ? "active" : ""}`} onClick={() => setView(it.id)}>
            <Icon name={it.icon} size={16} />
            {it.label}
            {typeof it.count === "number" && <span className="dos-nav-count">{it.count}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
