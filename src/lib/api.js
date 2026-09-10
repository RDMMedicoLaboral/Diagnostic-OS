import { API_BASE_URL } from "../config.js";

// Cliente HTTP delgado. Guarda el token de sesión en memoria (no en
// localStorage): si recargas la página, tienes que volver a iniciar sesión —
// es la decisión de seguridad correcta para un panel de administración.
let token = null;
export function setToken(t) { token = t; }
export function getToken() { return token; }
export function clearToken() { token = null; }

async function request(path, { method = "GET", body, headers, isForm } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* respuesta sin cuerpo */ }

  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status} al conectar con el servidor`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => request(path, { method: "POST", body: formData, isForm: true }),
};
