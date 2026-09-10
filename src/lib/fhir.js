// ---------------------------------------------------------------------------------
// Mappers FHIR — traducen el modelo interno de Diagnostic OS a recursos FHIR R4.
//
// Corrección clave respecto a la v0.1 (spec sección 28): ImagingStudy representa
// solo el estudio/metadatos de imagen (modalidad, región, fechas, futura referencia
// DICOM). El texto interpretativo (hallazgos/impresión) vive en DiagnosticReport,
// igual que en laboratorio. Antes se mezclaban ambos en un solo objeto.
//
// Cada función mapea UNA entidad interna a UN recurso. Se combinan según lo que
// necesite el conector de turno (FHIR, HL7, REST propietario...) — el núcleo
// clínico no llama a esta capa directamente, solo el adapter de integración.
// ---------------------------------------------------------------------------------

export function patientToFHIR(patient) {
  return {
    resourceType: "Patient",
    id: patient.id,
    identifier: [
      { system: "urn:diagnostic-os:document", value: patient.documentNumber },
      ...(patient.externalIdentifiers || []).map((ei) => ({ system: ei.system, value: ei.value, type: { text: ei.type } })),
    ],
    name: [{ family: patient.lastName, given: [patient.firstName] }],
    gender: patient.sex === "F" ? "female" : patient.sex === "M" ? "male" : "unknown",
    birthDate: patient.birthDate || undefined,
  };
}

export function orderToServiceRequest(order, study) {
  return {
    resourceType: "ServiceRequest",
    id: order.id,
    identifier: order.externalOrderId ? [{ system: order.sourceSystem || "external", value: order.externalOrderId }] : undefined,
    status: order.status === "completed" ? "completed" : order.status === "cancelled" ? "revoked" : "active",
    intent: "order",
    priority: order.priority === "emergencia" ? "stat" : order.priority === "urgente" ? "urgent" : order.priority === "prioritaria" ? "asap" : "routine",
    code: study ? { text: study.serviceName } : undefined,
    subject: { reference: `Patient/${order.patientId}` },
    requester: order.requestingPractitioner ? { display: order.requestingPractitioner.name } : undefined,
    reasonCode: order.reason ? [{ text: order.reason }] : undefined,
    authoredOn: order.createdAt,
  };
}

export function observationFromResult(result, patientId) {
  return {
    resourceType: "Observation",
    id: result.id,
    status: result.status === "validated" ? "final" : result.status === "corrected" ? "amended" : "preliminary",
    code: { text: result.analyte },
    subject: { reference: `Patient/${patientId}` },
    valueQuantity: { value: Number(result.value) || result.value, unit: result.unit },
    referenceRange: result.referenceRange ? [{ text: result.referenceRange }] : undefined,
    interpretation: result.flag && result.flag !== "normal" ? [{ text: result.flag }] : undefined,
  };
}

/** Solo metadatos del estudio de imagen — NUNCA el texto interpretativo. */
export function studyToImagingStudy(study, patientId) {
  return {
    resourceType: "ImagingStudy",
    id: study.id,
    identifier: study.accessionNumber ? [{ system: "urn:diagnostic-os:accession", value: study.accessionNumber }] : undefined,
    status: study.status === "completed" ? "available" : study.status === "cancelled" ? "cancelled" : "registered",
    subject: { reference: `Patient/${patientId}` },
    started: study.startedAt || study.scheduledAt,
    modality: [{ system: "http://dicom.nema.org/resources/ontology/DCM", code: study.modality === "RX" ? "CR" : study.modality === "ECO" ? "US" : study.modality, display: study.serviceName }],
    // Reservado para cuando exista integración DICOM/PACS real (fase 6):
    procedureReference: study.studyInstanceUID ? { reference: `urn:dicom:uid:${study.studyInstanceUID}` } : undefined,
    note: study.bodySite ? [{ text: `Región: ${study.bodySite}${study.laterality && study.laterality !== "n/a" ? ` (${study.laterality})` : ""}` }] : undefined,
  };
}

/** El informe diagnóstico — aquí sí va la interpretación, tanto de lab como de imagen. */
export function reportToDiagnosticReport(report, order, study) {
  const isLab = report.type === "LAB";
  return {
    resourceType: "DiagnosticReport",
    id: report.id,
    status: report.status === "published" ? "final" : report.status === "amended" ? "amended" : report.status === "validated" ? "preliminary" : "registered",
    category: [
      {
        coding: [
          isLab
            ? { system: "http://terminology.hl7.org/CodeSystem/v2-0074", code: "LAB", display: "Laboratory" }
            : { system: "http://terminology.hl7.org/CodeSystem/v2-0074", code: "RAD", display: "Radiology" },
        ],
      },
    ],
    code: { text: study?.serviceName },
    subject: { reference: `Patient/${report.patientId}` },
    basedOn: order ? [{ reference: `ServiceRequest/${order.id}` }] : undefined,
    imagingStudy: !isLab && study ? [{ reference: `ImagingStudy/${study.id}` }] : undefined,
    result: isLab ? (report.resultIds || []).map((id) => ({ reference: `Observation/${id}` })) : undefined,
    conclusion: isLab ? report.conclusion || undefined : report.impression || undefined,
    extension: !isLab ? [{ url: "findings", valueString: report.findings || undefined }] : undefined,
    author: report.author ? [{ display: report.author.name }] : undefined,
    // version/enmienda no son estándar FHIR puro, se exponen como extensión propia:
    _diagnosticOs: { version: report.version, amendmentReason: report.amendmentReason || undefined },
  };
}
