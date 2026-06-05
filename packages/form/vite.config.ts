import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "./src",
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "@matthuggins/form",
      fileName: "form",
    },
    rollupOptions: {},
  },
  plugins: [react()],
});
