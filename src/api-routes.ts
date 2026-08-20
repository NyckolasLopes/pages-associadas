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
