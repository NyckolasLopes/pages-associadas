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
        redirect: "manual",
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

  // 1.5. Dedicated Admin Save Product Endpoint (Bypasses RLS issues via authenticated admin context)
  if (url.pathname === "/api/admin/save-product" && request.method === "POST") {
    try {
      const body = await request.json();
      const productPayload = body.product || body;
      if (!productPayload || !productPayload.id) {
        return new Response(JSON.stringify({ error: "Missing product id or payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const targetBase = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "http://20.7.19.49:3006").replace(/\/$/, "");
      const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_lMKRz-zf_I7AXgFPgB9VWf_J1KIKAYU";
      const adminClient = createClient(targetBase, publishableKey);
      
      await adminClient.auth.signInWithPassword({
        email: "nyckolas.lopes@farmaciasassociadas.com.br",
        password: "Aspro@2026"
      });

      let { data, error } = await (adminClient.from('produtos') as any).upsert(productPayload).select();

      if (error && (error.message?.toLowerCase().includes("alerta_cor") || error.message?.toLowerCase().includes("fabricante") || error.message?.toLowerCase().includes("bula_url"))) {
        if (error.message?.toLowerCase().includes("alerta_cor")) {
          delete productPayload.alerta_cor_fundo;
          delete productPayload.alerta_cor_texto;
        }
        if (error.message?.toLowerCase().includes("fabricante")) {
          delete productPayload.fabricante;
        }
        if (error.message?.toLowerCase().includes("bula_url")) {
          delete productPayload.bula_url;
        }
        const retryRes = await (adminClient.from('produtos') as any).upsert(productPayload).select();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        return new Response(JSON.stringify({ error: error.message, details: error.details, code: error.code }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      console.error("[save-product error]:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 1.6. Dedicated Admin Delete Product Endpoint
  if (url.pathname === "/api/admin/delete-product" && request.method === "POST") {
    try {
      const body = await request.json();
      const { id, lojaId } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing product id" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const targetBase = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "http://20.7.19.49:3006").replace(/\/$/, "");
      const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_lMKRz-zf_I7AXgFPgB9VWf_J1KIKAYU";
      const adminClient = createClient(targetBase, publishableKey);
      
      await adminClient.auth.signInWithPassword({
        email: "nyckolas.lopes@farmaciasassociadas.com.br",
        password: "Aspro@2026"
      });

      if (lojaId) {
        await adminClient.from('produto_precos_loja').delete().eq('produto_id', id).eq('loja_id', lojaId);
      } else {
        await adminClient.from('produto_precos_loja').delete().eq('produto_id', id);
        const { error } = await adminClient.from('produtos').delete().eq('id', id);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      console.error("[delete-product error]:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 1.7. Dedicated Admin Delete All Products Endpoint
  if (url.pathname === "/api/admin/delete-all-products" && request.method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));
      const { lojaId } = body;

      const targetBase = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "http://20.7.19.49:3006").replace(/\/$/, "");
      const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_lMKRz-zf_I7AXgFPgB9VWf_J1KIKAYU";
      const adminClient = createClient(targetBase, publishableKey);
      
      await adminClient.auth.signInWithPassword({
        email: "nyckolas.lopes@farmaciasassociadas.com.br",
        password: "Aspro@2026"
      });

      if (lojaId) {
        // Limpa apenas os preços e estoques vinculados a essa loja específica
        await adminClient.from('produto_precos_loja').delete().eq('loja_id', lojaId);
      } else {
        // Limpeza geral de toda a rede: apaga produto_precos_loja e todos os produtos
        await adminClient.from('produto_precos_loja').delete().not('id', 'is', null);

        let hasMore = true;
        let batchCount = 0;
        while (hasMore) {
          const { data: chunk, error: chunkErr } = await adminClient
            .from('produtos')
            .select('id')
            .limit(1000);

          if (chunkErr || !chunk || chunk.length === 0) {
            hasMore = false;
            break;
          }

          const ids = chunk.map((p: any) => p.id);
          const { error: delErr } = await adminClient
            .from('produtos')
            .delete()
            .in('id', ids);

          if (delErr) {
            console.error("Erro ao deletar lote de produtos:", delErr);
            hasMore = false;
            break;
          }

          batchCount += ids.length;
          if (chunk.length < 1000) {
            hasMore = false;
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      console.error("[delete-all-products error]:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
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
