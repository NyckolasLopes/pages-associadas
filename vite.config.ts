import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
  },
  plugins: [
    {
      name: "api-dev-routes",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && (req.url.startsWith("/api/") || req.url === "/api")) {
            try {
              const { handleCustomApiRoute } = await server.ssrLoadModule("/src/api-routes.ts");
              const protocol = req.headers["x-forwarded-proto"] || "http";
              const host = req.headers.host || "localhost:5173";
              const fullUrl = `${protocol}://${host}${req.url}`;
              
              let body: Buffer | undefined;
              if (req.method !== "GET" && req.method !== "HEAD") {
                const chunks: Buffer[] = [];
                for await (const chunk of req) {
                  chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
                }
                body = Buffer.concat(chunks);
              }

              const headers = new Headers();
              for (const [key, val] of Object.entries(req.headers)) {
                if (val) {
                  if (Array.isArray(val)) {
                    val.forEach(v => headers.append(key, v));
                  } else {
                    headers.set(key, val);
                  }
                }
              }

              const webReq = new Request(fullUrl, {
                method: req.method,
                headers,
                body: body && body.length > 0 ? body : undefined,
              });

              const apiRes = await handleCustomApiRoute(webReq);
              if (apiRes) {
                res.statusCode = apiRes.status;
                apiRes.headers.forEach((v, k) => res.setHeader(k, v));
                const resBody = await apiRes.arrayBuffer();
                res.end(Buffer.from(resBody));
                return;
              }
            } catch (err) {
              console.error("[vite dev api-routes error]:", err);
            }
          }
          next();
        });
      }
    }
  ],
  esbuild: {
    legalComments: "none",
    sourcemap: false,
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

