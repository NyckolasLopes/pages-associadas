import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
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
  return new Response(renderErrorPage(errMsg), {
    status: 202,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
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
      }

      return normalized;
    } catch (error: any) {
      console.error(error);
      return new Response(renderErrorPage(error?.stack || error?.message || String(error)), {
        status: 202,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
