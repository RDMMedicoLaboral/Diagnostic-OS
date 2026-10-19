# Diagnostic OS — Frontend

Aplicación web de laboratorio clínico y centros de imágenes (RX y ecografía), multi-centro, con
resultados compartibles con otros sistemas (HCE / HIS) vía FHIR R4.

El frontend **no guarda datos**: habla con el backend (`Dx-backend`), que es quien los guarda en
PostgreSQL y aísla la información de cada centro. La dirección del backend está en `src/config.js`.

## Páginas

| Archivo | Qué es |
|---|---|
| `index.html` | La aplicación de cada centro (laboratorio, imágenes, pacientes, órdenes, integraciones) |
| `admin.html` | Panel del administrador de la plataforma: centros, usuarios y conexión con sistemas externos |
| `booking.html` | Reserva de citas en línea para pacientes |
| `results.html` | Consulta de resultados para pacientes |

## Primer uso

El sistema arranca **vacío**: no incluye cuentas ni datos de demostración. El administrador de la
plataforma se crea en el servidor con las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` (ver el README del
backend). Desde `admin.html` se crean los centros y sus usuarios.

## Desarrollo

```bash
npm install
npm run dev          # abre http://localhost:5173 (usa el backend indicado en src/config.js)
```

## Estructura

```
src/
  main.jsx, admin/main.jsx, booking/main.jsx   Puntos de entrada de cada página
  App.jsx                    Aplicación de un centro
  admin/AdminApp.jsx         Panel de administrador
  config.js                  URL del backend
  lib/api.js                 Cliente HTTP del backend (token de sesión)
  hooks/useRemoteData.js     Carga y guarda el estado del centro en el servidor
  components/                Vistas (laboratorio, imágenes, pacientes, integraciones, etc.)
  data/                      Catálogos y constantes
```

## ⚠ Cómo publicar cambios (léelo antes de subir nada a GitHub)

GitHub Pages publica los archivos **tal cual están en el repositorio** y **no compila**. Los `index.html`,
`admin.html` y `booking.html` de la raíz son archivos YA COMPILADOS (un solo archivo con todo adentro). Por eso,
**subir solo la carpeta `src/` no cambia nada en el sitio**.

Después de modificar algo en `src/`:

```
npm install            # solo la primera vez
npm run build:pages    # genera release/index.html, release/admin.html y release/booking.html
```

y sube los HTML de `release/` a la **raíz** del repositorio, reemplazando los anteriores. En 1–2 minutos el
sitio se actualiza (recarga con Ctrl+Shift+R).
