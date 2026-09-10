// ---------------------------------------------------------------------------------
// Contratos de integración (spec sección 17). Documentados aquí como JSDoc typedefs
// para que el proyecto siga siendo JavaScript simple en la Fase 1, pero con la forma
// exacta que el backend deberá implementar como interfaces reales en la Fase 2.
//
// Todo mensaje que cruza el límite del sistema (entrante o saliente) debe poder
// describirse con uno de estos contratos. `IntegrationMessage` en el modelo interno
// (ver data/models.js) es el registro genérico de que "un contrato ocurrió"; estos
// typedefs documentan qué forma tiene el payload de cada uno.
// ---------------------------------------------------------------------------------

export const CONTRACT_TYPES = {
  PATIENT_IMPORT: "PatientImport",
  APPOINTMENT_RECEIVED: "AppointmentReceived",
  SERVICE_REQUEST_RECEIVED: "ServiceRequestReceived",
  ORDER_CREATED: "OrderCreated",
  STUDY_SCHEDULED: "StudyScheduled",
  STUDY_COMPLETED: "StudyCompleted",
  RESULT_VALIDATED: "ResultValidated",
  REPORT_PUBLISHED: "ReportPublished",
  REPORT_AMENDED: "ReportAmended",
  INTEGRATION_ACKNOWLEDGED: "IntegrationAcknowledged",
  INTEGRATION_FAILED: "IntegrationFailed",
};

/**
 * @typedef {Object} PatientImportPayload
 * @property {string} sourceSystem
 * @property {string} sourcePatientId
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} [documentNumber]
 * @property {string} [birthDate]
 * @property {{system:string,value:string,type:string}[]} [externalIdentifiers]
 */

/**
 * @typedef {Object} AppointmentReceivedPayload
 * @property {string} externalAppointmentId
 * @property {string} sourceSystem
 * @property {string} correlationId
 * @property {string} patientExternalId
 * @property {string} serviceCode
 * @property {string} scheduledAt
 */

/**
 * @typedef {Object} ServiceRequestReceivedPayload
 * @property {string} externalOrderId
 * @property {string} sourceSystem
 * @property {string} correlationId
 * @property {string} patientExternalId
 * @property {{name:string,specialty?:string,externalId?:string}} requestingPractitioner
 * @property {string[]} serviceCodes
 * @property {string} reason
 * @property {"rutina"|"prioritaria"|"urgente"|"emergencia"} priority
 */

/**
 * @typedef {Object} OrderCreatedPayload
 * @property {string} orderId  Id interno de Diagnostic OS.
 * @property {string} [externalOrderId]
 * @property {string} patientId
 * @property {string[]} studyIds
 */

/** @typedef {Object} StudyScheduledPayload
 * @property {string} studyId
 * @property {string} orderId
 * @property {string} modality
 * @property {string} scheduledAt
 */

/** @typedef {Object} StudyCompletedPayload
 * @property {string} studyId
 * @property {string} completedAt
 * @property {string} [technician]
 */

/** @typedef {Object} ResultValidatedPayload
 * @property {string} reportId
 * @property {string} studyId
 * @property {{userId:string,name:string}} validator
 * @property {string} validatedAt
 */

/** @typedef {Object} ReportPublishedPayload
 * @property {string} reportId
 * @property {string} studyId
 * @property {string} orderId
 * @property {string} patientId
 * @property {number} version
 * @property {string} publishedAt
 * @property {string} destination
 */

/** @typedef {Object} ReportAmendedPayload
 * @property {string} reportId
 * @property {number} version
 * @property {string} amendmentReason
 * @property {string} amendedAt
 */

/** @typedef {Object} IntegrationAcknowledgedPayload
 * @property {string} correlationId
 * @property {string} eventId
 * @property {string} acknowledgedBy
 */

/** @typedef {Object} IntegrationFailedPayload
 * @property {string} correlationId
 * @property {string} eventId
 * @property {string} reason
 * @property {number} attempts
 */
