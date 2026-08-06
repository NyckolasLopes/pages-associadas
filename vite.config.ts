import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
  },
  build: {
    // Security: Sourcemaps desativados em produção para proteger o código-fonte contra engenharia reversa
    sourcemap: false,
    target: "es2022",
    minify: "esbuild",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        sourcemap: false,
        manualChunks(id: string) {
          if (id.includes("node_modules/xlsx")) {
            return "vendor-xlsx";
          }
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3") || id.includes("node_modules/victory")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/@supabase")) {
            return "vendor-supabase";
          }
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-tanstack";
          }
          if (id.includes("node_modules/@radix-ui") || id.includes("node_modules/lucide-react")) {
            return "vendor-ui";
          }
        },
      },
    },
  },
  server: {
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  },
} as any);

