# Diagnostic OS — Frontend (Fase 1)

Prototipo de frontend para **Diagnostic OS**, una aplicación de laboratorio clínico
multi-tenant con módulos de Laboratorio e Imágenes (RX y Ecografía), pensada para
compartir resultados con otros sistemas (HIS / agendamiento) vía FHIR.

Esta es la **Fase 1**: solo frontend. Todos los datos viven en el `localStorage`
del navegador (ver `src/lib/storage.js`) — no hay backend ni base de datos real
todavía, y por lo tanto **no hay aislamiento de datos verdadero entre centros**,
solo simulado en la interfaz.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (normalmente `http://localhost:5173`).

Cuentas de demostración (contraseña `demo123` para todas):

| Correo                         | Centro               | Rol         |
|---------------------------------|-----------------------|-------------|
| pandrade@sanrafael.demo         | Lab San Rafael         | Dueño       |
| floor@sanrafael.demo            | Lab San Rafael         | Laboratorista |
| rcedeno@mantasalud.demo         | Manta Salud            | Dueño       |
| ksolorzano@mantasalud.demo      | Manta Salud            | Radióloga   |
| bmendoza@mantasalud.demo        | Manta Salud            | Tecnólogo RX |

## Estructura del proyecto

```
src/
  main.jsx              Punto de entrada de React
  App.jsx                Componente raíz: enruta las vistas y conecta el estado
  styles.css              Todos los estilos de la aplicación
  lib/
    format.js             Utilidades (ids, fechas, iniciales)
    fhir.js                Traduce un examen a un recurso FHIR (DiagnosticReport / ImagingStudy)
    storage.js             ⭐ Capa de datos — el único archivo a reemplazar en la Fase 2
  data/
    constants.js           Metadatos (tipos de examen, roles) y datos de demostración
  hooks/
    useDiagnosticData.js   Hook central de estado de la aplicación
  components/
    Icon.jsx                Íconos propios en SVG (sin dependencias externas)
    common.jsx               TypePill, StatusBadge, ExamTable
    LoginScreen.jsx           Login + registro de nuevo centro
    Sidebar.jsx               Navegación + cuenta activa
    PulseStrip.jsx            Indicador visual de sincronización con el HIS
    Dashboard.jsx             Panel general
    PatientsView.jsx          Módulo de pacientes
    TeamView.jsx               Módulo de equipo/roles
    LabView.jsx                 Módulo de laboratorio
    ImagingView.jsx             Módulo de imágenes (RX/Ecografía)
    InteropView.jsx             Módulo de interoperabilidad (FHIR saliente + citas entrantes)
    modals/
      NewOrderModal.jsx          Modal de nueva orden
      ExamDetailModal.jsx        Modal de resultados/hallazgos
```

## Hoja de ruta — Fase 2 (backend)

Cuando pasemos a construir el backend, los cambios se concentran en pocos lugares:

1. **`src/lib/storage.js`** — reemplazar las funciones `loadData`/`saveData` por
   llamadas `fetch()` a la API real, con el token de sesión en las cabeceras.
2. **`src/components/LoginScreen.jsx`** — el login deja de comparar contraseñas
   en el navegador y pasa a llamar a un endpoint `/api/auth/login` que devuelve
   un token (JWT o de sesión).
3. **Aislamiento real de tenants** — se implementa en la base de datos
   (columna `tenant_id` + verificación en cada consulta del backend), no en el
   frontend. El frontend seguirá funcionando igual: solo pide "mis datos" y el
   servidor decide qué es "mío".
4. **`src/lib/fhir.js`** — se reutiliza tal cual; es la pieza que ya arma el
   recurso FHIR correcto para enviarlo al sistema de agendamiento/HIS.

El resto de los componentes (vistas, modales, hook de datos) no debería
necesitar cambios grandes, porque ya están separados de cómo se guardan los
datos.
