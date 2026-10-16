import { useState, useRef } from "react";
import Icon from "./components/Icon.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import Sidebar from "./components/Sidebar.jsx";
import PulseStrip from "./components/PulseStrip.jsx";
import Dashboard from "./components/Dashboard.jsx";
import PatientsView from "./components/PatientsView.jsx";
import PatientDetail from "./components/PatientDetail.jsx";
import TeamView from "./components/TeamView.jsx";
import LabView from "./components/LabView.jsx";
import ImagingView from "./components/ImagingView.jsx";
import CatalogView from "./components/CatalogView.jsx";
import AgendaView from "./components/AgendaView.jsx";
import IncomeView from "./components/IncomeView.jsx";
import InteropView from "./components/InteropView.jsx";
import AuditView from "./components/AuditView.jsx";
import NewOrderModal from "./components/modals/NewOrderModal.jsx";
import StudyDetailModal from "./components/modals/StudyDetailModal.jsx";
import { useRemoteData } from "./hooks/useRemoteData.js";
import { api } from "./lib/api.js";
import { uid, nowISO } from "./lib/format.js";
import { ROLE_META, PERMISSIONS } from "./data/catalogs.js";
import { CONTRACT_TYPES } from "./data/contracts.js";
import { createPatient, createOrder, createStudy, createSpecimen, createDiagnosticReport, createIntegrationMessage, createAuditEvent } from "./data/models.js";

const TITLES = {
  dashboard: ["Panel general", "Bandeja de trabajo, alertas e indicadores"],
  patients: ["Pacientes", "Registro y matching de pacientes"],
  patientDetail: ["Detalle de paciente", "Historial clínico completo"],
  lab: ["Laboratorio", "Bandeja de estudios de laboratorio"],
  imaging: ["Imágenes", "Bandeja de estudios de imagenología"],
  catalog: ["Catálogo", "Servicios diagnósticos y tarifario del centro"],
  agenda: ["Agenda", "Citas por confirmar, propias y de la reserva en línea"],
  interop: ["Centro de Integraciones", "Conectores, mensajes y simulador"],
  income: ["Ingresos", "Cálculo automático de ingresos por estudios completados"],
  audit: ["Auditoría", "Trazabilidad de acciones clínicas y administrativas"],
  team: ["Equipo", "Colaboradores, roles y permisos del centro"],
};

export default function App() {
  const {
    activeUser, login, logout, loginError, loggingIn,
    tenant, setTenant,
    users, setUsers,
    patients, setPatients,
    orders, setOrders,
    studies, setStudies,
    specimens, setSpecimens,
    results, setResults,
    diagnosticReports, setDiagnosticReports: setReports,
    catalog, setCatalog,
    appointments, setAppointments,
    integrationMessages, setIntegrationMessages: setMessages,
    auditEvents, setAuditEvents: setAudit,
    loaded, refresh, refreshIfIdle, syncError,
  } = useRemoteData();

  const [view, setView] = useState("dashboard");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [openStudyId, setOpenStudyId] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const currentTenantId = activeUser?.tenantId;
  const currentRole = ROLE_META[activeUser?.role] || ROLE_META.laboratorista;
  const tenantModalities = [...new Set(catalog.filter((c) => c.active).map((c) => c.modality))];

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const openStudy = studies.find((s) => s.id === openStudyId);
  const openOrder = openStudy ? orders.find((o) => o.id === openStudy.orderId) : null;
  const openPatient = openStudy ? patients.find((p) => p.id === openStudy.patientId) : null;
  const openSpecimen = openStudy ? specimens.find((s) => s.id === openStudy.specimenId) : null;
  const openSpecimenHistory = openStudy ? specimens.filter((s) => s.studyId === openStudy.id && s.id !== openStudy.specimenId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : [];
  const openResults = openStudy ? results.filter((r) => r.studyId === openStudy.id) : [];
  const openReport = openStudy ? diagnosticReports.find((r) => r.id === openStudy.reportId) : null;
  const openTemplate = openStudy ? catalog.find((c) => c.code === openStudy.serviceCode)?.reportTemplate : null;

  const counts = {
    patients: patients.length,
    lab: studies.filter((s) => s.modality === "LAB").length,
    imaging: studies.filter((s) => s.modality !== "LAB").length,
    appointments: appointments.length,
  };

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const logAudit = (action, entityType, entityId, after) => {
    setAudit((prev) => [
      createAuditEvent({ tenantId: currentTenantId, userId: activeUser?.id, userName: activeUser?.name || "—", action, entityType, entityId, after }),
      ...prev,
    ]);
  };

  const handleLogin = (email, password) => login(email, password);
  const handleLogout = () => { logout(); setView("dashboard"); };

  // --- Crear orden con uno o varios estudios del catálogo (sección 7) ---
  const createNewOrder = (form) => {
    const order = createOrder({
      tenantId: currentTenantId, patientId: form.patientId, sourceType: form.sourceType,
      requestingPractitioner: form.requestingPractitioner, reason: form.reason,
      presumptiveDiagnosis: form.presumptiveDiagnosis, priority: form.priority, notes: form.notes,
    });
    const newStudies = [];
    const newSpecimens = [];
    const newReports = [];
    form.serviceCodes.forEach((code) => {
      const svc = catalog.find((c) => c.code === code);
      if (!svc) return;
      const study = createStudy({ tenantId: currentTenantId, orderId: order.id, patientId: form.patientId, serviceCode: svc.code, serviceName: svc.name, modality: svc.modality });
      const report = createDiagnosticReport({ tenantId: currentTenantId, studyId: study.id, orderId: order.id, patientId: form.patientId, type: svc.modality === "LAB" ? "LAB" : "IMAGING", author: { userId: activeUser.id, name: activeUser.name } });
      study.reportId = report.id;
      if (svc.modality === "LAB") {
        const specimen = createSpecimen({ tenantId: currentTenantId, studyId: study.id, type: "" });
        study.specimenId = specimen.id;
        newSpecimens.push(specimen);
      }
      newStudies.push(study);
      newReports.push(report);
    });
    order.studyIds = newStudies.map((s) => s.id);
    setOrders((prev) => [order, ...prev]);
    setStudies((prev) => [...newStudies, ...prev]);
    setSpecimens((prev) => [...newSpecimens, ...prev]);
    setReports((prev) => [...newReports, ...prev]);
    logAudit("order.create", "Order", order.id, { studies: newStudies.length });
    setShowNewOrder(false);
    showToast(`Orden creada con ${newStudies.length} estudio(s)`);
  };

  // --- Handlers del detalle de estudio ---
  const advanceStudyStatus = (newStatus) => {
    setStudies((prev) =>
      prev.map((s) => {
        if (s.id !== openStudyId) return s;
        const patch = { status: newStatus };
        if (newStatus === "in-progress") patch.startedAt = nowISO();
        if (newStatus === "completed") patch.completedAt = nowISO();
        return { ...s, ...patch };
      })
    );
    logAudit("study.status", "Study", openStudyId, { status: newStatus });
  };

  const saveStudyFields = (patch) => setStudies((prev) => prev.map((s) => (s.id === openStudyId ? { ...s, ...patch } : s)));

  const saveSpecimen = (patch) => {
    setSpecimens((prev) =>
      prev.map((sp) => {
        if (sp.id !== openStudy?.specimenId) return sp;
        const status = patch.type ? "received" : "pending";
        return { ...sp, ...patch, status, collectedAt: sp.collectedAt || (patch.type ? nowISO() : null), receivedAt: sp.receivedAt || (patch.type ? nowISO() : null) };
      })
    );
  };

  const rejectSpecimenAndRetake = (reason) => {
    const rejectedId = openStudy?.specimenId;
    const newSpecimen = createSpecimen({ tenantId: currentTenantId, studyId: openStudyId, type: "" });
    setSpecimens((prev) => [
      newSpecimen,
      ...prev.map((sp) => (sp.id === rejectedId ? { ...sp, status: "rejected", rejectionReason: reason } : sp)),
    ]);
    setStudies((prev) => prev.map((s) => (s.id === openStudyId ? { ...s, specimenId: newSpecimen.id } : s)));
    logAudit("specimen.reject", "Specimen", rejectedId, { reason, newSpecimenId: newSpecimen.id });
    showToast("Muestra rechazada — se registró una nueva toma");
  };

  const saveResults = (resultsArray) => {
    const previouslyAcked = new Set(results.filter((r) => r.criticalNotifiedAt).map((r) => r.id));
    const newlyAcked = resultsArray.filter((r) => r.criticalNotifiedAt && !previouslyAcked.has(r.id));
    setResults((prev) => [
      ...prev.filter((r) => r.studyId !== openStudyId),
      ...resultsArray.map((r) => ({ ...r, tenantId: currentTenantId, studyId: openStudyId, status: r.status === "draft" ? "resulted" : r.status })),
    ]);
    newlyAcked.forEach((r) => logAudit("result.critical_notified", "Result", r.id, { analyte: r.analyte, value: r.value, notifiedBy: activeUser?.name }));
  };

  const saveReportDraft = (patch) => setReports((prev) => prev.map((r) => (r.id === openStudy?.reportId ? { ...r, ...patch } : r)));

  const validateReport = () => {
    setReports((prev) => prev.map((r) => (r.id === openStudy?.reportId ? { ...r, status: "validated", validator: { userId: activeUser.id, name: activeUser.name }, validatedAt: nowISO() } : r)));
    setResults((prev) => prev.map((r) => (r.studyId === openStudyId ? { ...r, status: "validated" } : r)));
    logAudit("report.validate", "DiagnosticReport", openStudy?.reportId, { status: "validated" });
    showToast("Informe validado");
  };

  const publishReport = () => {
    setReports((prev) => prev.map((r) => (r.id === openStudy?.reportId ? { ...r, status: "published", publishedAt: nowISO() } : r)));
    logAudit("report.publish", "DiagnosticReport", openStudy?.reportId, { status: "published" });
    setPulseKey((k) => k + 1);
    // El envío al sistema conectado lo hace el SERVIDOR al guardarse la publicación y deja su propio
    // registro (con reintentos si falla). Antes aquí se inventaba un mensaje "enviado" aunque no se enviara nada.
    showToast("Informe publicado");
    setOpenStudyId(null);
    setTimeout(() => refreshIfIdle().catch(() => {}), 4000); // trae el estado real del envío
  };

  const shareAgain = async () => {
    const reportId = openStudy?.reportId;
    if (!reportId) return;
    try {
      const r = await api.post(`/api/reports/${reportId}/resend`);
      setPulseKey((k) => k + 1);
      if (r.status === "skipped") showToast("No se envió: el informe no corresponde a una orden del sistema conectado");
      else showToast(r.ok ? "Informe reenviado al sistema conectado" : `No se pudo reenviar${r.error ? `: ${r.error}` : ""}`);
      refresh().catch(() => {});
    } catch (err) {
      showToast(err.message);
    }
  };

  const amendReport = (reason) => {
    setReports((prev) => prev.map((r) => (r.id === openStudy?.reportId ? { ...r, status: "amended", version: r.version + 1, amendmentReason: reason } : r)));
    logAudit("report.amend", "DiagnosticReport", openStudy?.reportId, { amendmentReason: reason });
    showToast("Informe marcado como corregido — puedes editarlo de nuevo");
  };

  const updateCatalogPrice = (serviceId, price) => {
    setCatalog((prev) => prev.map((c) => (c.id === serviceId ? { ...c, price } : c)));
    logAudit("catalog.price_update", "CatalogItem", serviceId, { price });
  };

  const toggleCatalogActive = (serviceId) => {
    setCatalog((prev) => prev.map((c) => (c.id === serviceId ? { ...c, active: !c.active } : c)));
  };

  const addCatalogService = (fields) => {
    const service = { id: uid("SVC"), tenantId: currentTenantId, active: true, externalCodes: [], ...fields };
    setCatalog((prev) => [service, ...prev]);
    logAudit("catalog.service_add", "CatalogItem", service.id, { name: service.name, modality: service.modality });
    showToast(`Estudio "${service.name}" agregado al catálogo`);
  };

  const importCatalogItems = (items) => {
    if (!items.length) { showToast("No había ningún estudio para importar"); return; }
    const newServices = items.map((it) => ({ id: uid("SVC"), tenantId: currentTenantId, active: true, externalCodes: [], ...it }));
    setCatalog((prev) => [...newServices, ...prev]);
    logAudit("catalog.import", "CatalogItem", null, { count: newServices.length });
    showToast(`${newServices.length} estudio(s) importado(s) al catálogo`);
  };

  const updateTenantHours = (hours) => setTenant((prev) => (prev ? { ...prev, hours } : prev));

  // --- Centro de integraciones ---
  const importAppointment = (appt) => {
    let patient = patients.find((p) => `${p.firstName} ${p.lastName}` === appt.patientName);
    if (!patient) {
      const [firstName, ...rest] = appt.patientName.split(" ");
      patient = createPatient({ tenantId: currentTenantId, firstName, lastName: rest.join(" ") || "—", documentNumber: "—", sourceSystem: "Agenda", sourcePatientId: appt.id });
      setPatients((prev) => [patient, ...prev]);
    }
    const order = createOrder({ tenantId: currentTenantId, patientId: patient.id, sourceType: "Agenda", sourceSystem: "Agenda", appointmentId: appt.id, reason: "Cita agendada", priority: "rutina" });
    const study = createStudy({ tenantId: currentTenantId, orderId: order.id, patientId: patient.id, serviceCode: appt.serviceCode, serviceName: appt.serviceName, modality: appt.modality });
    const report = createDiagnosticReport({ tenantId: currentTenantId, studyId: study.id, orderId: order.id, patientId: patient.id, type: appt.modality === "LAB" ? "LAB" : "IMAGING", author: { userId: activeUser.id, name: activeUser.name } });
    study.reportId = report.id;
    if (appt.modality === "LAB") {
      const specimen = createSpecimen({ tenantId: currentTenantId, studyId: study.id, type: "" });
      study.specimenId = specimen.id;
      setSpecimens((prev) => [specimen, ...prev]);
    }
    order.studyIds = [study.id];
    setOrders((prev) => [order, ...prev]);
    setStudies((prev) => [study, ...prev]);
    setReports((prev) => [report, ...prev]);
    const msg = createIntegrationMessage({ tenantId: currentTenantId, type: CONTRACT_TYPES.APPOINTMENT_RECEIVED, direction: "inbound", source: "Agenda", destination: "Diagnostic OS", status: "acknowledged", payloadSummary: `Cita ${appt.id} — ${appt.patientName}` });
    setMessages((prev) => [msg, ...prev]);
    setAppointments((prev) => prev.filter((a) => a.id !== appt.id));
    logAudit("appointment.import", "Order", order.id, { fromAppointment: appt.id });
    showToast(`Orden creada desde la cita de ${appt.patientName}`);
  };

  const simulateIntegration = (kind) => {
    const lastOutbound = [...integrationMessages].find((m) => m.direction === "outbound");
    const lastFailed = [...integrationMessages].find((m) => m.status === "failed" || m.status === "retrying");
    if (kind === "ack" && lastOutbound) {
      setMessages((prev) => prev.map((m) => (m.id === lastOutbound.id ? { ...m, status: "acknowledged", updatedAt: nowISO() } : m)));
      showToast("ACK simulado recibido");
    } else if (kind === "error") {
      const msg = createIntegrationMessage({ tenantId: currentTenantId, type: CONTRACT_TYPES.INTEGRATION_FAILED, direction: "outbound", source: "Diagnostic OS", destination: "HCE-Ecosistema", status: "failed", payloadSummary: "Error simulado (HTTP 500)" });
      setMessages((prev) => [msg, ...prev]);
      showToast("Error simulado (HTTP 500)");
    } else if (kind === "duplicate") {
      const msg = createIntegrationMessage({ tenantId: currentTenantId, type: CONTRACT_TYPES.SERVICE_REQUEST_RECEIVED, direction: "inbound", source: "HCE-Ecosistema", destination: "Diagnostic OS", status: "duplicate", payloadSummary: "Mensaje duplicado detectado (mismo eventId) — ignorado" });
      setMessages((prev) => [msg, ...prev]);
      showToast("Mensaje duplicado simulado — se ignoró sin crear una segunda orden");
    } else if (kind === "retry") {
      if (lastFailed) {
        setMessages((prev) => prev.map((m) => (m.id === lastFailed.id ? { ...m, status: "acknowledged", attempts: m.attempts + 1, updatedAt: nowISO() } : m)));
        showToast("Reintento simulado — confirmado en el segundo intento");
      } else {
        showToast("No hay mensajes con error para reintentar");
      }
    } else if (kind === "disconnect") {
      const msg = createIntegrationMessage({ tenantId: currentTenantId, type: CONTRACT_TYPES.INTEGRATION_FAILED, direction: "outbound", source: "Diagnostic OS", destination: "HCE-Ecosistema", status: "failed", payloadSummary: "Sistema externo desconectado" });
      setMessages((prev) => [msg, ...prev]);
      showToast("Desconexión simulada");
    }
    logAudit("integration.simulate", "IntegrationMessage", kind, { kind });
  };

  if (!activeUser) {
    return (
      <div className="dos-root">
        <LoginScreen onLogin={handleLogin} loginError={loginError} loggingIn={loggingIn} />
      </div>
    );
  }

  if (!loaded || !tenant) {
    return (
      <div className="dos-root" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--ink-dim)" }}>
          <Icon name="Loader2" size={22} style={{ animation: "spin 1s linear infinite" }} />
          Cargando Diagnostic OS…
        </div>
      </div>
    );
  }

  return (
    <div className="dos-root">
      <Sidebar view={view} setView={setView} counts={counts} tenant={tenant} activeUser={activeUser} currentRole={currentRole} tenantModalities={tenantModalities} onLogout={handleLogout} />
      <div className="dos-main">
        <div className="dos-topbar">
          <div className="dos-topbar-row">
            <div>
              <p className="dos-title">{TITLES[view][0]}</p>
              <p className="dos-subtitle">{TITLES[view][1]}</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="dos-search"><Icon name="Search" size={14} color="var(--ink-faint)" /><input placeholder="Buscar paciente…" /></div>
              {(view === "lab" || view === "imaging") && (
                <button className="dos-btn dos-btn-primary" onClick={() => setShowNewOrder(true)}><Icon name="Plus" size={14} /> Nueva orden</button>
              )}
            </div>
          </div>
        </div>
        <PulseStrip pulseKey={pulseKey} />
        <div className="dos-content" style={{ position: "relative" }}>
          {syncError && <div style={{ background: "#7A1F1F", color: "#fff", padding: "6px 14px", fontSize: 12, borderRadius: 6, marginBottom: 10 }}>{syncError}</div>}
          {view === "dashboard" && <Dashboard patients={patients} orders={orders} studies={studies} results={results} diagnosticReports={diagnosticReports} integrationMessages={integrationMessages} currentRole={currentRole} setView={setView} />}
          {view === "patients" && <PatientsView patients={patients} setPatients={setPatients} tenantId={currentTenantId} onOpenPatient={(p) => { setSelectedPatientId(p.id); setView("patientDetail"); }} />}
          {view === "patientDetail" && selectedPatient && (
            <PatientDetail patient={selectedPatient} orders={orders} studies={studies} diagnosticReports={diagnosticReports} onBack={() => setView("patients")} onOpenStudy={(s) => setOpenStudyId(s.id)} />
          )}
          {view === "team" && <TeamView users={users} setUsers={setUsers} tenantId={currentTenantId} currentRole={currentRole} />}
          {view === "lab" && <LabView studies={studies} orders={orders} patients={patients} onOpen={(s) => setOpenStudyId(s.id)} />}
          {view === "imaging" && <ImagingView studies={studies} orders={orders} patients={patients} onOpen={(s) => setOpenStudyId(s.id)} availableModalities={currentRole.manage ? ["RX", "ECO"] : currentRole.scope} />}
          {view === "catalog" && (
            <CatalogView
              catalog={catalog}
              hours={tenant?.hours || { open: "08:00", close: "18:00" }}
              onUpdateHours={updateTenantHours}
              canManage={currentRole.manage}
              onUpdatePrice={updateCatalogPrice}
              onToggleActive={toggleCatalogActive}
              onAddService={addCatalogService}
              onImportCatalog={importCatalogItems}
            />
          )}
          {view === "agenda" && <AgendaView appointments={appointments} onImportAppointment={importAppointment} onRefresh={refresh} />}
          {view === "interop" && currentRole.permissions.includes(PERMISSIONS.MANAGE_INTEGRATIONS) && (
            <InteropView studies={studies} orders={orders} patients={patients} diagnosticReports={diagnosticReports} integrationMessages={integrationMessages} />
          )}
          {view === "income" && currentRole.manage && <IncomeView studies={studies} patients={patients} catalog={catalog} diagnosticReports={diagnosticReports} />}
          {view === "audit" && <AuditView auditEvents={auditEvents} />}
          {toast && <div className="dos-toast"><Icon name="CheckCircle2" size={14} /> {toast}</div>}
        </div>
      </div>

      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          patients={patients}
          catalog={catalog}
          allowedModalities={currentRole.manage ? ["LAB", "RX", "ECO"] : currentRole.scope}
          onCreate={createNewOrder}
        />
      )}
      {openStudy && (
        <StudyDetailModal
          study={openStudy}
          order={openOrder}
          patient={openPatient}
          specimen={openSpecimen}
          specimenHistory={openSpecimenHistory}
          results={openResults}
          report={openReport}
          template={openTemplate}
          currentRole={currentRole}
          onClose={() => setOpenStudyId(null)}
          onAdvanceStatus={advanceStudyStatus}
          onSaveSpecimen={saveSpecimen}
          onRejectSpecimen={rejectSpecimenAndRetake}
          onSaveResults={saveResults}
          onSaveStudyFields={saveStudyFields}
          onSaveReportDraft={saveReportDraft}
          onValidate={validateReport}
          onPublish={publishReport}
          onAmend={amendReport}
          onShare={shareAgain}
        />
      )}
    </div>
  );
}
