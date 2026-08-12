import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    try {
      serverEntryPromise = import("@tanstack/react-start/server-entry").then(
        (m) => (m.default ?? m) as ServerEntry,
      );
    } catch (e) {
      console.error("Erro ao carregar server entry:", e);
      throw e;
    }
  }
  return serverEntryPromise;
}

// In-memory rate limiting (per worker)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 200; // 200 requests per minute

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  try {
    if (response.status < 500) return response;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return response;

    const body = await response.clone().text();
    if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
      return response;
    }

    const errObj = consumeLastCapturedError();
    const errMsg = errObj ? (errObj as any).stack || (errObj as any).message : `h3 swallowed SSR error: ${body}`;
    console.error(errObj ?? new Error(errMsg));
    
    // Security: Do not expose stack traces to user
    return new Response(renderErrorPage("Ocorreu um erro interno no servidor."), {
      status: 202,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    console.error("Erro interno ao tentar processar SSR error:", e);
    return response;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown";
      
      if (!checkRateLimit(ip)) {
        return new Response("Too Many Requests", { status: 429 });
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      let normalized = await normalizeCatastrophicSsrResponse(response);

      // Edge Caching Strategy
      try {
        const url = new URL(request.url);
        const noCachePaths = ['/admin', '/login', '/cart', '/checkout', '/perfil', '/pedidos', '/cadastro', '/inscricao', '/painel-loja'];
        const shouldCache = request.method === 'GET' && 
                            normalized.status === 200 && 
                            !noCachePaths.some(p => url.pathname.startsWith(p));
        
        if (shouldCache) {
          const newHeaders = new Headers(normalized.headers);
          // Cache on Vercel CDN for 60 seconds, serve stale for up to 5 minutes while revalidating
          newHeaders.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
          normalized = new Response(normalized.body, {
            status: normalized.status,
            statusText: normalized.statusText,
            headers: newHeaders
          });
        }
      } catch (e) {
        // Ignore URL parsing errors
        console.error("Erro no processamento de cache:", e);
      }

      return normalized;
    } catch (error: any) {
      console.error("Erro catastrofico na requisicao:", error);
      // Security: Do not expose stack traces to user
      return new Response(renderErrorPage("Ocorreu um erro interno no servidor."), {
        status: 202,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
