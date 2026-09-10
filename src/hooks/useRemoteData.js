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
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await api.put("/api/state", {
          users, patients, orders, studies, specimens, results, diagnosticReports, catalog, appointments, integrationMessages, auditEvents,
          hours: tenant?.hours,
        });
        setSyncError("");
      } catch (err) {
        setSyncError(`No se pudo guardar en el servidor: ${err.message}`);
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, patients, orders, studies, specimens, results, diagnosticReports, catalog, appointments, integrationMessages, auditEvents, tenant?.hours, loaded]);

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
    loaded, refresh, syncError,
  };
}
