import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this project at https://<user>.github.io/yunnan_fungi_visualization/
export default defineConfig({
  base: "/yunnan_fungi_visualization/",
  plugins: [react()],
});
