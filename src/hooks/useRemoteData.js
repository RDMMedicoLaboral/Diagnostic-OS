import { useState, useEffect, useCallback, useRef } from "react";
import { api, setToken, clearToken } from "../lib/api.js";

// ---------------------------------------------------------------------------------
// Reemplaza a useDiagnosticData (localStorage). Misma idea: un solo lugar que
// junta todas las colecciones y las mantiene sincronizadas — pero ahora contra
// el backend real en vez del navegador. Los componentes (PatientsView, LabView,
// TeamView...) no cambian: siguen llamando a setPatients(prev => ...) igual
// que antes; el guardado hacia el servidor pasa solo, en segundo plano.
// ---------------------------------------------------------------------------------

const EMPTY = {
  tenant: null, users: [], patients: [], orders: [], studies: [], specimens: [],
  results: [], diagnosticReports: [], catalog: [], appointments: [], integrationMessages: [], auditEvents: [],
};

export function useRemoteData() {
  const [activeUser, setActiveUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [tenant, setTenant] = useState(null);
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [studies, setStudies] = useState([]);
  const [specimens, setSpecimens] = useState([]);
  const [results, setResults] = useState([]);
  const [diagnosticReports, setDiagnosticReports] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [integrationMessages, setIntegrationMessages] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);

  const [loaded, setLoaded] = useState(false); // true una vez que cargó el estado inicial tras el login
  const [syncError, setSyncError] = useState("");
  const skipNextSave = useRef(true); // evita re-guardar inmediatamente lo que acabamos de cargar
  const saveTimer = useRef(null);
  // Hora del servidor en que se cargaron los datos. Se devuelve al guardar para que el servidor
  // sepa qué registros YA conocía este navegador, y no borre lo que llegó mientras tanto (una
  // orden enviada por el HCE, una reserva en línea, algo que creó otro usuario).
  const loadedAt = useRef(null);
  const changeSeq = useRef(0); // cuenta cambios locales: si hay cambios sin guardar, no se pisan con datos del servidor
  const dirty = useRef(false);
  const saving = useRef(false);

  const applyState = (data) => {
    setTenant(data.tenant || null);
    setUsers(data.users || []);
    setPatients(data.patients || []);
    setOrders(data.orders || []);
    setStudies(data.studies || []);
    setSpecimens(data.specimens || []);
    setResults(data.results || []);
    setDiagnosticReports(data.diagnosticReports || []);
    setCatalog(data.catalog || []);
    setAppointments(data.appointments || []);
    setIntegrationMessages(data.integrationMessages || []);
    setAuditEvents(data.auditEvents || []);
  };

  const refresh = useCallback(async () => {
    const data = await api.get("/api/state");
    skipNextSave.current = true;
    loadedAt.current = data.serverTime || null;
    applyState(data);
  }, []);

  // Trae lo nuevo del servidor SOLO si el usuario no tiene cambios sin guardar (ni los tuvo mientras
  // se descargaba). Así los resultados y órdenes que llegan de otros sistemas aparecen solos.
  const refreshIfIdle = useCallback(async () => {
    if (dirty.current || saving.current) return;
    const seq = changeSeq.current;
    const data = await api.get("/api/state");
    if (dirty.current || saving.current || changeSeq.current !== seq) return;
    skipNextSave.current = true;
    loadedAt.current = data.serverTime || null;
    applyState(data);
  }, []);

  const login = async (email, password) => {
    setLoggingIn(true);
    setLoginError("");
    try {
      const { token, user } = await api.post("/api/auth/login", { email, password });
      setToken(token);
      setActiveUser(user);
      const data = await api.get("/api/state");
      skipNextSave.current = true;
      loadedAt.current = data.serverTime || null;
      applyState(data);
      setLoaded(true);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = () => {
    clearToken();
    setActiveUser(null);
    setLoaded(false);
    applyState(EMPTY);
  };

  // Guarda en segundo plano cada vez que algo cambia, con un pequeño colchón
  // (debounce) para no mandar una petición por cada tecla — igual de simple
  // que el useEffect que antes escribía a localStorage.
  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    dirty.current = true;
    const seq = ++changeSeq.current;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      saving.current = true;
      try {
        await api.put("/api/state", {
          loadedAt: loadedAt.current,
          users, patients, orders, studies, specimens, results, diagnosticReports, catalog, appointments, integrationMessages, auditEvents,
          hours: tenant?.hours,
        });
        setSyncError("");
        if (changeSeq.current === seq) dirty.current = false; // nada nuevo mientras guardaba
      } catch (err) {
        setSyncError(`No se pudo guardar en el servidor: ${err.message}`);
      } finally {
        saving.current = false;
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, patients, orders, studies, specimens, results, diagnosticReports, catalog, appointments, integrationMessages, auditEvents, tenant?.hours, loaded]);

  // Cada 30 s (con la pestaña visible) revisa si llegó algo nuevo desde otros sistemas.
  useEffect(() => {
    if (!loaded) return;
    const tick = () => { if (document.visibilityState === "visible") refreshIfIdle().catch(() => {}); };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [loaded, refreshIfIdle]);

  return {
    activeUser, login, logout, loginError, loggingIn,
    tenant, setTenant,
    users, setUsers,
    patients, setPatients,
    orders, setOrders,
    studies, setStudies,
    specimens, setSpecimens,
    results, setResults,
    diagnosticReports, setDiagnosticReports,
    catalog, setCatalog,
    appointments, setAppointments,
    integrationMessages, setIntegrationMessages,
    auditEvents, setAuditEvents,
    loaded, refresh, refreshIfIdle, syncError,
  };
}
