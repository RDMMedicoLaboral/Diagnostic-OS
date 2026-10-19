// Genera los HTML que se publican en GitHub Pages (un solo archivo por página, con todo incluido).
//
//   npm run build:pages            -> crea release/index.html y release/admin.html (y booking.html)
//
// IMPORTANTE: GitHub Pages publica los archivos TAL CUAL están en el repositorio; no compila nada.
// Por eso, después de cambiar algo en src/ hay que ejecutar este script y subir los HTML de
// release/ a la RAÍZ del repositorio (reemplazando los anteriores).
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { writeFileSync, rmSync, renameSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const PAGES = [
  { name: "index", title: "Diagnostic OS", entry: "/src/main.jsx", mount: "root" },
  { name: "admin", title: "Diagnostic OS — Administrador de plataforma", entry: "/src/admin/main.jsx", mount: "admin-root" },
  { name: "booking", title: "Reservar cita — Diagnostic OS", entry: "/src/booking/main.jsx", mount: "booking-root" },
];
const only = process.argv.slice(2);
const out = resolve(root, "release");
mkdirSync(out, { recursive: true });

for (const page of PAGES.filter((p) => !only.length || only.includes(p.name))) {
  const tmp = `.__entry-${page.name}.html`;
  writeFileSync(resolve(root, tmp), `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="./logo.png" />
    <title>${page.title}</title>
  </head>
  <body>
    <div id="${page.mount}"></div>
    <script type="module" src="${page.entry}"></script>
  </body>
</html>
`);
  try {
    await build({
      root, configFile: false, base: "/Diagnostic-OS/", logLevel: "warn", publicDir: false,
      plugins: [react(), viteSingleFile()],
      build: { outDir: out, emptyOutDir: false, rollupOptions: { input: resolve(root, tmp) } },
    });
    renameSync(resolve(out, tmp), resolve(out, `${page.name}.html`));
    console.log(`✓ release/${page.name}.html`);
  } finally {
    rmSync(resolve(root, tmp), { force: true });
  }
}
