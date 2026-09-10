// Catálogo de servicios/estudios — configurable por tenant (spec sección 9).
// Un centro que solo tiene laboratorio simplemente no tiene entradas de imagenología
// aquí; el núcleo no necesita saberlo de antemano.
import { uid } from "../lib/format.js";

// Catálogo por defecto para un centro recién registrado, según el tipo que eligió
// en el formulario de alta. Así "Nueva orden" y la página de reservas en línea
// tienen algo que ofrecer desde el primer momento.
export function defaultCatalogFor(tenantId, kind) {
  const LAB_ITEMS = [
    { code: "LAB-HEMO", name: "Hemograma completo", modality: "LAB", price: 12.5, preparation: "Ayuno no requerido.", estimatedTime: "2 horas", reportTemplate: { conclusion: "Serie roja, blanca y plaquetaria dentro de parámetros normales." } },
    { code: "LAB-GLU", name: "Glucosa en ayunas", modality: "LAB", price: 6, preparation: "Ayuno de 8 horas.", estimatedTime: "1 hora", reportTemplate: { conclusion: "Glucemia en ayunas dentro de rango de referencia." } },
    { code: "LAB-ORINA", name: "Examen elemental de orina", modality: "LAB", price: 8, preparation: "Primera micción de la mañana.", estimatedTime: "1 hora", reportTemplate: { conclusion: "Elemental y microscópico de orina sin alteraciones." } },
  ];
  const IMG_ITEMS = [
    { code: "RX-TORAX", name: "Radiografía de tórax PA", modality: "RX", price: 15, preparation: "Retirar objetos metálicos.", estimatedTime: "20 minutos", reportTemplate: { findings: "Campos pulmonares sin infiltrados. Silueta cardiaca conservada.", impression: "Radiografía de tórax sin hallazgos patológicos agudos." } },
    { code: "ECO-ABD", name: "Ecografía abdominal superior", modality: "ECO", price: 28, preparation: "Ayuno de 6 horas.", estimatedTime: "30 minutos", reportTemplate: { findings: "Hígado, vesícula, vía biliar, páncreas y bazo sin alteraciones.", impression: "Ecografía abdominal superior sin hallazgos patológicos." } },
  ];
  const items = kind === "Laboratorio" ? LAB_ITEMS : kind === "Centro de imágenes" ? IMG_ITEMS : [...LAB_ITEMS, ...IMG_ITEMS];
  return items.map((it) => ({ id: uid("SVC"), tenantId, active: true, externalCodes: [], ...it }));
}

export const seedCatalog = [
  // --- Laboratorio Clínico San Rafael (ten-001) — solo laboratorio ---
  { id: uid("SVC"), tenantId: "ten-001", code: "LAB-HEMO", name: "Hemograma completo", modality: "LAB", externalCodes: ["LOINC:58410-2"], price: 12.5, preparation: "Ayuno no requerido.", estimatedTime: "2 horas", active: true, reportTemplate: { conclusion: "Serie roja, blanca y plaquetaria dentro de parámetros normales para edad y sexo." } },
  { id: uid("SVC"), tenantId: "ten-001", code: "LAB-GLU", name: "Glucosa en ayunas", modality: "LAB", externalCodes: ["LOINC:1558-6"], price: 6, preparation: "Ayuno de 8 horas.", estimatedTime: "1 hora", active: true, reportTemplate: { conclusion: "Glucemia en ayunas dentro de rango de referencia." } },
  { id: uid("SVC"), tenantId: "ten-001", code: "LAB-LIP", name: "Perfil lipídico", modality: "LAB", externalCodes: ["LOINC:57698-3"], price: 18, preparation: "Ayuno de 12 horas.", estimatedTime: "3 horas", active: true, reportTemplate: { conclusion: "Perfil lipídico sin alteraciones significativas." } },

  // --- Centro Diagnóstico Manta Salud (ten-002) — imagenología ---
  { id: uid("SVC"), tenantId: "ten-002", code: "RX-TORAX", name: "Radiografía de tórax PA", modality: "RX", externalCodes: ["LOINC:36643-5"], price: 15, preparation: "Retirar objetos metálicos.", estimatedTime: "20 minutos", active: true, reportTemplate: { findings: "Campos pulmonares sin infiltrados. Silueta cardiaca de tamaño y morfología conservados. Senos costofrénicos libres.", impression: "Radiografía de tórax sin hallazgos patológicos agudos." } },
  { id: uid("SVC"), tenantId: "ten-002", code: "RX-COL-LUMBAR", name: "Radiografía de columna lumbar", modality: "RX", externalCodes: [], price: 22, preparation: "Sin preparación especial.", estimatedTime: "20 minutos", active: true, reportTemplate: { findings: "Alineación vertebral conservada. Alturas de cuerpos vertebrales y espacios discales conservados.", impression: "Radiografía de columna lumbar sin hallazgos patológicos agudos." } },
  { id: uid("SVC"), tenantId: "ten-002", code: "ECO-ABD", name: "Ecografía abdominal superior", modality: "ECO", externalCodes: ["LOINC:24869-0"], price: 28, preparation: "Ayuno de 6 horas.", estimatedTime: "30 minutos", active: true, reportTemplate: { findings: "Hígado de tamaño y ecogenicidad normales. Vesícula biliar sin litiasis. Vía biliar no dilatada. Páncreas y bazo sin alteraciones.", impression: "Ecografía abdominal superior sin hallazgos patológicos." } },
  { id: uid("SVC"), tenantId: "ten-002", code: "ECO-OBST", name: "Ecografía obstétrica", modality: "ECO", externalCodes: [], price: 30, preparation: "Vejiga semillena.", estimatedTime: "30 minutos", active: true, reportTemplate: { findings: "Feto único, vivo, en presentación y situación acordes a edad gestacional. Actividad cardiaca fetal presente.", impression: "Ecografía obstétrica sin hallazgos patológicos para la edad gestacional." } },
];
