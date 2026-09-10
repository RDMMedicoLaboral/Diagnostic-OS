import { uid, nowISO } from "../lib/format.js";
import { CONTRACT_TYPES } from "./contracts.js";
import { createPatient, createOrder, createStudy, createSpecimen, createResult, createDiagnosticReport, createIntegrationMessage, createAuditEvent } from "./models.js";

export const PLATFORM_TENANT_ID = "__platform__";

export const platformAdmin = {
  id: "usr-platform", tenantId: PLATFORM_TENANT_ID, name: "Soporte Diagnostic OS",
  role: "platform_admin", email: "soporte@diagnosticos.app", password: "plataforma123",
};

export const seedTenants = [
  { id: "ten-001", name: "Laboratorio Clínico San Rafael", kind: "Laboratorio", plan: "Profesional", hours: { open: "07:00", close: "16:00" } },
  { id: "ten-002", name: "Centro Diagnóstico Manta Salud", kind: "Centro de imágenes", plan: "Estándar", hours: { open: "08:00", close: "18:00" } },
];

export const seedUsers = [
  platformAdmin,
  { id: "usr-001", tenantId: "ten-001", name: "Dra. Patricia Andrade", role: "dueno", email: "pandrade@sanrafael.demo", password: "demo123" },
  { id: "usr-002", tenantId: "ten-001", name: "Fernando Loor", role: "laboratorista", email: "floor@sanrafael.demo", password: "demo123" },
  { id: "usr-003", tenantId: "ten-002", name: "Ing. Ramiro Cedeño", role: "dueno", email: "rcedeno@mantasalud.demo", password: "demo123" },
  { id: "usr-004", tenantId: "ten-002", name: "Dra. Karina Solórzano", role: "radiologo", email: "ksolorzano@mantasalud.demo", password: "demo123" },
  { id: "usr-005", tenantId: "ten-002", name: "Byron Mendoza", role: "tecnologo_rx", email: "bmendoza@mantasalud.demo", password: "demo123" },
];

// --- Pacientes: uno confirmado/interno, uno con identificador externo de la HCE
// propia, uno marcado como posible duplicado (para poder demostrar el matching) ---
export const seedPatients = [
  createPatient({ tenantId: "ten-001", firstName: "María Elena", lastName: "Vásquez", documentNumber: "1301245678", birthDate: "1985-04-12", sex: "F" }),
  createPatient({
    tenantId: "ten-001", firstName: "Carlos Andrés", lastName: "Ponce", documentNumber: "1307894512", birthDate: "1972-11-03", sex: "M",
    sourceSystem: "HCE-Ecosistema", sourcePatientId: "HCE-77451",
    externalIdentifiers: [{ system: "HCE-Ecosistema", value: "HCE-77451", type: "MRN" }],
  }),
  createPatient({ tenantId: "ten-002", firstName: "Lucía Fernanda", lastName: "Zambrano", documentNumber: "1312456789", birthDate: "1998-07-22", sex: "F" }),
];
// Forzar un caso de "posible duplicado" para el tercer paciente, a modo de demo:
seedPatients[1].matchStatus = "posible_duplicado";

const p1 = seedPatients[0].id; // María Elena Vásquez (ten-001)
const p2 = seedPatients[1].id; // Carlos Andrés Ponce (ten-001, HCE)
const p3 = seedPatients[2].id; // Lucía Fernanda Zambrano (ten-002)

// --- Orden 1 (ten-001): laboratorio, ya publicada y compartida ---
const order1 = createOrder({
  tenantId: "ten-001", patientId: p1, sourceType: "interno",
  requestingPractitioner: { name: "Dra. Patricia Andrade", specialty: "Medicina interna", organization: "Lab San Rafael", externalId: null },
  reason: "Control de rutina", priority: "rutina",
});
const study1 = createStudy({ tenantId: "ten-001", orderId: order1.id, patientId: p1, serviceCode: "LAB-HEMO", serviceName: "Hemograma completo", modality: "LAB" });
const specimen1 = createSpecimen({ tenantId: "ten-001", studyId: study1.id, type: "Sangre venosa" });
specimen1.status = "completed"; specimen1.collectedAt = nowISO(); specimen1.receivedAt = nowISO(); specimen1.quality = "apta";
const results1 = [
  { ...createResult({ tenantId: "ten-001", studyId: study1.id, specimenId: specimen1.id, analyte: "Hemoglobina", value: "13.4", unit: "g/dL", referenceRange: "12.0 - 15.5" }), status: "validated" },
  { ...createResult({ tenantId: "ten-001", studyId: study1.id, specimenId: specimen1.id, analyte: "Leucocitos", value: "11.8", unit: "10^3/uL", referenceRange: "4.5 - 11.0" }), status: "validated", flag: "alto" },
  { ...createResult({ tenantId: "ten-001", studyId: study1.id, specimenId: specimen1.id, analyte: "Plaquetas", value: "260", unit: "10^3/uL", referenceRange: "150 - 400" }), status: "validated" },
];
const report1 = {
  ...createDiagnosticReport({ tenantId: "ten-001", studyId: study1.id, orderId: order1.id, patientId: p1, type: "LAB", author: { userId: "usr-002", name: "Fernando Loor" } }),
  conclusion: "Leucocitosis leve, sugerente de proceso infeccioso en curso.",
  resultIds: results1.map((r) => r.id),
  status: "published",
  validator: { userId: "usr-001", name: "Dra. Patricia Andrade" },
  validatedAt: nowISO(),
  publishedAt: nowISO(),
};
study1.specimenId = specimen1.id; study1.resultIds = results1.map((r) => r.id); study1.reportId = report1.id; study1.status = "completed"; study1.completedAt = nowISO();
order1.studyIds = [study1.id]; order1.status = "completed"; order1.completedAt = nowISO();

// --- Orden 2 (ten-001): paciente de la HCE, RX (aunque el tenant es lab, sirve de ejemplo cross-modality si se activa) ---
// -> se mantiene como estudio de laboratorio pendiente para no mezclar modalidades fuera de catálogo del tenant.
const order2 = createOrder({
  tenantId: "ten-001", patientId: p2, sourceType: "HCE", sourceSystem: "HCE-Ecosistema", externalOrderId: "SR-2298",
  requestingPractitioner: { name: "Dr. Iván Zambrano", specialty: "Medicina general", organization: "HCE Ecosistema", externalId: "PRACT-441" },
  reason: "Sospecha de proceso infeccioso", priority: "prioritaria",
});
const study2 = createStudy({ tenantId: "ten-001", orderId: order2.id, patientId: p2, serviceCode: "LAB-GLU", serviceName: "Glucosa en ayunas", modality: "LAB" });
study2.status = "arrived";
const specimen2 = createSpecimen({ tenantId: "ten-001", studyId: study2.id, type: "" });
const report2 = createDiagnosticReport({ tenantId: "ten-001", studyId: study2.id, orderId: order2.id, patientId: p2, type: "LAB", author: { userId: "usr-002", name: "Fernando Loor" } });
study2.specimenId = specimen2.id; study2.reportId = report2.id;
order2.studyIds = [study2.id]; order2.status = "active"; order2.receivedAt = nowISO();

// --- Orden 3 (ten-002): RX completado, informe validado pero no publicado ---
const order3 = createOrder({
  tenantId: "ten-002", patientId: p3, sourceType: "interno",
  requestingPractitioner: { name: "Ing. Ramiro Cedeño", specialty: "Administración", organization: "Manta Salud", externalId: null },
  reason: "Dolor torácico atípico", priority: "rutina",
});
const study3 = createStudy({ tenantId: "ten-002", orderId: order3.id, patientId: p3, serviceCode: "RX-TORAX", serviceName: "Radiografía de tórax PA", modality: "RX", bodySite: "Tórax", laterality: "n/a", accessionNumber: "ACC-100234" });
study3.technique = "Proyección posteroanterior, en bipedestación";
study3.status = "completed"; study3.completedAt = nowISO(); study3.technician = "Byron Mendoza";
const report3 = {
  ...createDiagnosticReport({ tenantId: "ten-002", studyId: study3.id, orderId: order3.id, patientId: p3, type: "IMAGING", author: { userId: "usr-005", name: "Byron Mendoza" } }),
  findings: "Campos pulmonares sin infiltrados. Silueta cardiaca de tamaño conservado.",
  impression: "Radiografía de tórax sin hallazgos patológicos agudos.",
  status: "validated",
  validator: { userId: "usr-004", name: "Dra. Karina Solórzano" },
  validatedAt: nowISO(),
};
study3.reportId = report3.id;
order3.studyIds = [study3.id]; order3.status = "completed"; order3.completedAt = nowISO();

// --- Orden 4 (ten-002): ecografía recién agendada, sin ejecutar ---
const order4 = createOrder({
  tenantId: "ten-002", patientId: p3, sourceType: "interno",
  requestingPractitioner: { name: "Ing. Ramiro Cedeño", specialty: "Administración", organization: "Manta Salud", externalId: null },
  reason: "Control ecográfico", priority: "rutina",
});
const study4 = createStudy({ tenantId: "ten-002", orderId: order4.id, patientId: p3, serviceCode: "ECO-ABD", serviceName: "Ecografía abdominal superior", modality: "ECO", bodySite: "Abdomen superior" });
const report4 = createDiagnosticReport({ tenantId: "ten-002", studyId: study4.id, orderId: order4.id, patientId: p3, type: "IMAGING", author: { userId: "usr-004", name: "Dra. Karina Solórzano" } });
study4.reportId = report4.id;
order4.studyIds = [study4.id];

export const seedOrders = [order1, order2, order3, order4];
export const seedStudies = [study1, study2, study3, study4];
export const seedSpecimens = [specimen1, specimen2];
export const seedResults = results1;
export const seedDiagnosticReports = [report1, report2, report3, report4];

// Citas simuladas que llegarían del sistema de agendamiento externo (fase 2 real).
export const seedAppointments = [
  { id: uid("APT"), tenantId: "ten-001", patientName: "Jorge Iván Salcedo", serviceCode: "LAB-GLU", serviceName: "Glucosa en ayunas", modality: "LAB", scheduledAt: nowISO(), source: "Agenda" },
  { id: uid("APT"), tenantId: "ten-002", patientName: "Rosa Amelia Chávez", serviceCode: "RX-COL-LUMBAR", serviceName: "Radiografía de columna lumbar", modality: "RX", scheduledAt: nowISO(), source: "Agenda" },
];

// Mensajes de integración de ejemplo, para que el Centro de Integraciones no arranque vacío.
export const seedIntegrationMessages = [
  { ...createIntegrationMessage({ tenantId: "ten-001", type: CONTRACT_TYPES.REPORT_PUBLISHED, direction: "outbound", source: "Diagnostic OS", destination: "HCE-Ecosistema", status: "acknowledged", payloadSummary: `DiagnosticReport ${report1.id} — ${seedPatients[0].firstName} ${seedPatients[0].lastName}` }) },
  { ...createIntegrationMessage({ tenantId: "ten-001", type: CONTRACT_TYPES.SERVICE_REQUEST_RECEIVED, direction: "inbound", source: "HCE-Ecosistema", destination: "Diagnostic OS", status: "acknowledged", payloadSummary: `Orden externa SR-2298 — ${seedPatients[1].firstName} ${seedPatients[1].lastName}` }) },
];

export const seedAuditEvents = [
  createAuditEvent({ tenantId: "ten-001", userId: "usr-001", userName: "Dra. Patricia Andrade", action: "report.publish", entityType: "DiagnosticReport", entityId: report1.id, after: { status: "published" } }),
  createAuditEvent({ tenantId: "ten-002", userId: "usr-004", userName: "Dra. Karina Solórzano", action: "report.validate", entityType: "DiagnosticReport", entityId: report3.id, after: { status: "validated" } }),
];
