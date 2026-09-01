import { createClient } from "@supabase/supabase-js";

// Initialize Supabase with service_role key to bypass RLS and authenticate the RPC securely
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// If service key is not available, try to use anon key (though service key is recommended for these RPCs)
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const activeKey = supabaseServiceKey || anonKey;

const supabase = activeKey ? createClient(supabaseUrl, activeKey) : null;

export async function handleCustomApiRoute(request: Request): Promise<Response | null> {
  const url = new URL(request.url);

  // 1. Reverse Proxy for Supabase (Prevents Mixed Content blocks on HTTPS pages when Supabase is HTTP)
  if (url.pathname.startsWith("/api/supabase")) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      });
    }

    const targetBase = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "http://20.7.19.49:3006").replace(/\/$/, "");
    const subPath = url.pathname.replace(/^\/api\/supabase/, "");
    const targetUrl = `${targetBase}${subPath}${url.search}`;

    try {
      const forwardHeaders = new Headers();
      request.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (lower !== "host" && lower !== "connection" && lower !== "origin" && lower !== "referer") {
          forwardHeaders.set(key, value);
        }
      });

      const defaultKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_lMKRz-zf_I7AXgFPgB9VWf_J1KIKAYU";
      if (!forwardHeaders.has("apikey")) {
        forwardHeaders.set("apikey", defaultKey);
      }
      if (!forwardHeaders.has("authorization") || !forwardHeaders.get("authorization")) {
        forwardHeaders.set("authorization", `Bearer ${defaultKey}`);
      }

      const body = request.method !== "GET" && request.method !== "HEAD" 
        ? await request.arrayBuffer() 
        : undefined;

      const proxyRes = await fetch(targetUrl, {
        method: request.method,
        headers: forwardHeaders,
        body: body,
      });

      const responseHeaders = new Headers();
      proxyRes.headers.forEach((value, key) => {
        responseHeaders.set(key, value);
      });
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "*");

      return new Response(proxyRes.body, {
        status: proxyRes.status,
        statusText: proxyRes.statusText,
        headers: responseHeaders,
      });
    } catch (err: any) {
      console.error("[Supabase Proxy Error]:", err);
      return new Response(JSON.stringify({ error: "Proxy connection failed", details: err.message }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  
  if (url.pathname.includes("/api/rpc/")) {
    const rpcName = url.pathname.split("/").pop();
    let apikey = url.searchParams.get("apikey") || url.searchParams.get("api_key");

    let payload: any = {};
    if (request.method === "POST") {
      const bodyText = await request.text();
      if (bodyText) {
        payload = JSON.parse(bodyText);
      }
      if (!apikey) {
        apikey = payload.apikey || payload.api_key;
      }
    }

    if (!apikey) {
      return new Response(JSON.stringify({ message: "Invalid API key", hint: "Missing apikey parameter in URL or body" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (request.method !== "POST" && request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase client not configured in server" }), { status: 500 });
    }

    try {
      const rpcArgs = request.method === "POST" ? {
        api_key: apikey,
        payload: payload
      } : {
        api_key: apikey
      };

      const { data, error } = await supabase.rpc(rpcName as string, rpcArgs);

      if (error) {
        return new Response(JSON.stringify({ error: error.message, details: error.details, code: error.code }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify(data || { success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: "Invalid JSON body or internal error", details: e.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return null;
}
