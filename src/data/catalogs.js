// ---------------------------------------------------------------------------------
// Catálogos centrales. Nada de LAB/RX/ECO "hardcodeado" en los componentes: todo
// componente que necesite listar modalidades, estados o permisos lee de aquí.
// Así una modalidad nueva (CT, MRI, Mamografía...) se activa por configuración,
// sin tocar el núcleo (spec sección 25).
// ---------------------------------------------------------------------------------

export const MODALITIES = {
  LAB: { code: "LAB", label: "Laboratorio", icon: "FlaskConical", ramp: "teal", category: "laboratory" },
  RX: { code: "RX", label: "Radiografía", icon: "Bone", ramp: "blue", category: "imaging" },
  ECO: { code: "ECO", label: "Ecografía", icon: "Waves", ramp: "coral", category: "imaging" },
  CT: { code: "CT", label: "Tomografía", icon: "ScanLine", ramp: "blue", category: "imaging", comingSoon: true },
  MRI: { code: "MRI", label: "Resonancia magnética", icon: "ScanLine", ramp: "blue", category: "imaging", comingSoon: true },
  MAMO: { code: "MAMO", label: "Mamografía", icon: "ScanLine", ramp: "coral", category: "imaging", comingSoon: true },
};

export const ORDER_STATUSES = {
  draft: { label: "Borrador" },
  active: { label: "Activa" },
  scheduled: { label: "Agendada" },
  completed: { label: "Completada" },
  cancelled: { label: "Cancelada" },
};

export const STUDY_STATUSES = {
  scheduled: { label: "Agendado", icon: "Clock", tone: "amber" },
  arrived: { label: "Paciente recibido", icon: "UserPlus", tone: "blue" },
  "in-progress": { label: "En proceso", icon: "Activity", tone: "blue" },
  completed: { label: "Completado", icon: "CheckCircle2", tone: "blue" },
  cancelled: { label: "Cancelado", icon: "X", tone: "red" },
};

export const SPECIMEN_STATUSES = {
  pending: { label: "Pendiente de toma" },
  collected: { label: "Tomada" },
  received: { label: "Recibida en laboratorio" },
  rejected: { label: "Rechazada" },
  processing: { label: "En procesamiento" },
  completed: { label: "Procesada" },
};

export const RESULT_STATUSES = {
  draft: { label: "Borrador" },
  resulted: { label: "Resultado registrado" },
  validated: { label: "Validado" },
  corrected: { label: "Corregido" },
};

export const REPORT_STATUSES = {
  draft: { label: "Borrador", tone: "amber" },
  "pending-validation": { label: "Pendiente de validación", tone: "amber" },
  validated: { label: "Validado", tone: "blue" },
  published: { label: "Publicado", tone: "green" },
  amended: { label: "Enmendado", tone: "coral" },
};

export const INTEGRATION_STATUSES = {
  pending: { label: "Pendiente", tone: "amber" },
  sent: { label: "Enviado", tone: "blue" },
  acknowledged: { label: "Confirmado (ACK)", tone: "green" },
  duplicate: { label: "Duplicado / ignorado", tone: "coral" },
  failed: { label: "Error", tone: "red" },
  retrying: { label: "Reintentando", tone: "amber" },
};

export const PRIORITIES = {
  rutina: { label: "Rutina", tone: "teal" },
  prioritaria: { label: "Prioritaria", tone: "blue" },
  urgente: { label: "Urgente", tone: "coral" },
  emergencia: { label: "Emergencia", tone: "red" },
};

export const ORDER_SOURCES = {
  interno: "Creación interna",
  HCE: "HCE",
  Agenda: "Sistema de agendamiento",
  Portal: "Portal externo",
};

// ---------------------------------------------------------------------------------
// Permisos: la unidad de control es el permiso, no el rol (spec sección 21).
// Un rol es solo una agrupación conveniente de permisos + alcance por modalidad.
// ---------------------------------------------------------------------------------
export const PERMISSIONS = {
  MANAGE_CENTER: "manage_center",
  MANAGE_USERS: "manage_users",
  MANAGE_CATALOG: "manage_catalog",
  MANAGE_INTEGRATIONS: "manage_integrations",
  CREATE_ORDER: "create_order",
  MANAGE_SPECIMEN: "manage_specimen",
  ENTER_RESULT: "enter_result",
  VALIDATE_RESULT: "validate_result",
  CREATE_REPORT: "create_report",
  VALIDATE_REPORT: "validate_report",
  PUBLISH_REPORT: "publish_report",
  AMEND_REPORT: "amend_report",
  VIEW_AUDIT: "view_audit",
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const CENTER_OWNER_PERMISSIONS = ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.MANAGE_INTEGRATIONS);

export const ROLE_META = {
  dueno: {
    label: "Dueño / Administrador del centro",
    scope: ["LAB", "RX", "ECO"],
    permissions: CENTER_OWNER_PERMISSIONS,
    manage: true,
    color: "teal",
  },
  platform_admin: {
    label: "Administrador de la plataforma",
    scope: ["LAB", "RX", "ECO"],
    permissions: ALL_PERMISSIONS,
    manage: true,
    isPlatform: true,
    color: "teal",
  },
  recepcion: {
    label: "Recepción",
    scope: ["LAB", "RX", "ECO"],
    permissions: [PERMISSIONS.CREATE_ORDER],
    color: "teal",
  },
  laboratorista: {
    label: "Laboratorista",
    scope: ["LAB"],
    permissions: [PERMISSIONS.CREATE_ORDER, PERMISSIONS.MANAGE_SPECIMEN, PERMISSIONS.ENTER_RESULT, PERMISSIONS.CREATE_REPORT],
    color: "teal",
  },
  responsable_laboratorio: {
    label: "Responsable de laboratorio",
    scope: ["LAB"],
    permissions: [PERMISSIONS.CREATE_ORDER, PERMISSIONS.MANAGE_SPECIMEN, PERMISSIONS.ENTER_RESULT, PERMISSIONS.VALIDATE_RESULT, PERMISSIONS.CREATE_REPORT, PERMISSIONS.VALIDATE_REPORT, PERMISSIONS.PUBLISH_REPORT, PERMISSIONS.AMEND_REPORT],
    color: "teal",
  },
  tecnologo_rx: {
    label: "Tecnólogo en RX",
    scope: ["RX"],
    permissions: [PERMISSIONS.CREATE_ORDER, PERMISSIONS.CREATE_REPORT],
    color: "blue",
  },
  ecografista: {
    label: "Ecografista",
    scope: ["ECO"],
    permissions: [PERMISSIONS.CREATE_ORDER, PERMISSIONS.CREATE_REPORT, PERMISSIONS.VALIDATE_REPORT, PERMISSIONS.PUBLISH_REPORT],
    color: "coral",
  },
  radiologo: {
    label: "Radiólogo",
    scope: ["RX", "ECO"],
    permissions: [PERMISSIONS.CREATE_REPORT, PERMISSIONS.VALIDATE_REPORT, PERMISSIONS.PUBLISH_REPORT, PERMISSIONS.AMEND_REPORT],
    color: "blue",
  },
  auditor: {
    label: "Auditor",
    scope: ["LAB", "RX", "ECO"],
    permissions: [PERMISSIONS.VIEW_AUDIT],
    color: "coral",
  },
};

export function hasPermission(role, permission) {
  return !!ROLE_META[role]?.permissions.includes(permission);
}
