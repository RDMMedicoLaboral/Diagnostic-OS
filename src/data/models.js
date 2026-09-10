// ---------------------------------------------------------------------------------
// Modelo clínico central de Diagnostic OS.
//
// Principio rector (spec sección 3): la HCE propia y el agendamiento propio son,
// para este núcleo, sistemas externos como cualquier otro. Por eso ninguna entidad
// aquí usa un ID de un proveedor externo como su identidad interna: todo lo externo
// entra como `externalIdentifiers` / `sourceSystem` / `externalId`, nunca como `id`.
//
// Flujo: Patient → Order → Study → Result / DiagnosticReport → Validation →
// Publication → sistemas externos (spec sección 4).
// ---------------------------------------------------------------------------------

import { uid, nowISO } from "../lib/format.js";

/** @typedef {{ system: string, value: string, type: string }} ExternalIdentifier */

export function createPatient({ tenantId, firstName, lastName, documentType = "cedula", documentNumber, birthDate, sex, sourceSystem = null, sourcePatientId = null, externalIdentifiers = [] }) {
  return {
    id: uid("PAT"),
    tenantId,
    firstName,
    lastName,
    documentType,
    documentNumber,
    birthDate,
    sex,
    externalIdentifiers, // ExternalIdentifier[]
    sourceSystem, // sistema que originó el registro, si no fue creado internamente
    sourcePatientId,
    matchStatus: sourceSystem ? "pendiente" : "confirmado", // confirmado | pendiente | posible_duplicado
    createdAt: nowISO(),
  };
}

export function createOrder({ tenantId, patientId, externalOrderId = null, sourceSystem = null, sourceType = "interno", requestingPractitioner, requestingOrganization = null, encounterId = null, appointmentId = null, reason, presumptiveDiagnosis = "", priority = "rutina", notes = "" }) {
  return {
    id: uid("ORD"),
    tenantId,
    externalOrderId,
    sourceSystem,
    sourceType, // interno | HCE | Agenda | Portal
    patientId,
    requestingPractitioner, // { name, specialty, organization, externalId }
    requestingOrganization,
    encounterId,
    appointmentId,
    reason,
    presumptiveDiagnosis,
    priority, // rutina | prioritaria | urgente | emergencia
    notes,
    status: "active", // draft | active | scheduled | cancelled | completed
    createdAt: nowISO(),
    scheduledAt: null,
    receivedAt: null,
    completedAt: null,
    studyIds: [],
  };
}

export function createStudy({ tenantId, orderId, patientId, serviceCode, serviceName, modality, room = "", equipment = "", technician = "", externalStudyId = null, bodySite = "", laterality = "", accessionNumber = null }) {
  return {
    id: uid("STD"),
    tenantId,
    orderId,
    patientId,
    serviceCode,
    serviceName,
    modality, // LAB | RX | ECO | ...
    status: "scheduled", // scheduled | arrived | in-progress | completed | cancelled
    room,
    equipment,
    technician,
    scheduledAt: nowISO(),
    startedAt: null,
    completedAt: null,
    externalStudyId,
    // Campos propios de imagenología (spec sección 11) — quedan reservados para no
    // rediseñar la pantalla cuando se conecte PACS/DICOM más adelante:
    bodySite,
    laterality, // izquierda | derecha | bilateral | n/a
    technique: "",
    accessionNumber,
    studyInstanceUID: null, // reservado para DICOM/PACS (fase 6)
    specimenId: null,
    resultIds: [],
    reportId: null,
  };
}

export function createSpecimen({ tenantId, studyId, type }) {
  return {
    id: uid("SPC"),
    tenantId,
    studyId,
    type,
    status: "pending", // pending | collected | received | rejected | processing | completed
    createdAt: nowISO(),
    collectedAt: null,
    receivedAt: null,
    quality: null, // apta | no apta
    rejectionReason: null,
  };
}

export function createResult({ tenantId, studyId, specimenId = null, analyte, value = "", unit = "", referenceRange = "", method = "" }) {
  return {
    id: uid("RES"),
    tenantId,
    studyId,
    specimenId,
    analyte,
    value,
    unit,
    referenceRange,
    flag: "normal", // normal | alto | bajo | critico
    method,
    status: "draft", // draft | resulted | validated | corrected
    critical: false,
    criticalNotifiedAt: null,
  };
}

export function createDiagnosticReport({ tenantId, studyId, orderId, patientId, type, author }) {
  return {
    id: uid("DR"),
    tenantId,
    studyId,
    orderId,
    patientId,
    type, // LAB | IMAGING
    status: "draft", // draft | pending-validation | validated | published | amended
    author, // { userId, name }
    validator: null,
    conclusion: "",
    findings: "", // solo imagenología
    impression: "", // solo imagenología
    resultIds: [], // solo laboratorio: referencia a Result[]
    version: 1,
    amendmentReason: "",
    pdfRef: null,
    createdAt: nowISO(),
    validatedAt: null,
    publishedAt: null,
  };
}

export function createIntegrationMessage({ tenantId, type, direction, source, destination, status = "pending", payloadSummary = "", correlationId = null }) {
  return {
    id: uid("MSG"),
    tenantId,
    eventId: uid("EVT"),
    correlationId: correlationId || uid("COR"),
    type, // AppointmentReceived | ServiceRequestReceived | OrderCreated | StudyScheduled | StudyCompleted | ResultValidated | ReportPublished | ReportAmended | IntegrationAcknowledged | IntegrationFailed
    direction, // inbound | outbound
    source,
    destination,
    status, // pending | sent | acknowledged | duplicate | failed | retrying
    payloadSummary,
    attempts: 1,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
}

export function createAuditEvent({ tenantId, userId, userName, action, entityType, entityId, before = null, after = null }) {
  return {
    id: uid("AUD"),
    tenantId,
    userId,
    userName,
    action, // texto libre pero consistente: "order.create", "result.validate", "report.publish", ...
    entityType, // Patient | Order | Study | Result | DiagnosticReport | IntegrationMessage
    entityId,
    before,
    after,
    timestamp: nowISO(),
  };
}
