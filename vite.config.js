import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          postprocessing: [
            "three/addons/postprocessing/EffectComposer.js",
            "three/addons/postprocessing/RenderPass.js",
            "three/addons/postprocessing/ShaderPass.js",
            "three/addons/postprocessing/UnrealBloomPass.js",
          ],
        },
      },
    },
  },
});
