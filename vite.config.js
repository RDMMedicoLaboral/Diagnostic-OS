import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// GitHub Pages sirve los "project pages" (usuario.github.io/NOMBRE-REPO/) desde una
// subcarpeta, no desde la raíz del dominio. Sin este "base", los archivos generados
// buscarían sus rutas en la raíz y la página quedaría en blanco.
export default defineConfig({
  plugins: [react()],
  base: "/Diagnostic-OS/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        booking: resolve(__dirname, "booking.html"),
        admin: resolve(__dirname, "admin.html"),
      },
    },
  },
});
