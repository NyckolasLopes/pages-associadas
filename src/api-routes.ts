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

      if (responseHeaders.has("location")) {
        const loc = responseHeaders.get("location") || "";
        const originUrl = new URL(request.url).origin;
        const rewrittenLoc = loc
          .replace(/http:\/\/20\.7\.19\.49:3006\/auth\/v1\//g, `${originUrl}/api/supabase/auth/v1/`)
          .replace(/http:\/\/20\.7\.19\.49:3006/g, originUrl);
        responseHeaders.set("location", rewrittenLoc);
      }

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

      // Ensure slug is populated
      if (!productPayload.slug) {
        const baseSlug = String(productPayload.nome || "produto")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        productPayload.slug = (productPayload.url && !productPayload.url.includes('/') ? productPayload.url : '') || (baseSlug ? `${baseSlug}-${productPayload.id}` : String(productPayload.id));
      }

      delete productPayload.foto;
      delete productPayload.alerta_cor_fundo;
      delete productPayload.alerta_cor_texto;

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

  // 1.8. Dedicated Admin Bulk Update Descriptions Endpoint
  if (url.pathname === "/api/admin/bulk-update-descriptions" && request.method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));
      const updates = body.updates || [];
      const lojaId = body.lojaId;

      if (!Array.isArray(updates) || updates.length === 0) {
        return new Response(JSON.stringify({ successCount: 0, errorCount: 0, errors: [] }), {
          status: 200,
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

      let successCount = 0;
      let errorCount = 0;
      const errors: { ean: string; error: string }[] = [];

      // Process in batches of 200 items for high performance and stability
      const chunkSize = 200;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const batch = updates.slice(i, i + chunkSize);
        const eanList = Array.from(new Set(batch.map((u: any) => String(u.ean || "").trim()).filter(Boolean)));

        if (eanList.length === 0) continue;

        // Fetch products by EAN in bulk from database
        const { data: dbProducts, error: searchErr } = await adminClient
          .from("produtos")
          .select("id, ean, nome")
          .in("ean", eanList);

        if (searchErr || !dbProducts) {
          batch.forEach((u: any) => {
            errorCount++;
            errors.push({ ean: u.ean, error: searchErr?.message || "Erro ao consultar banco" });
          });
          continue;
        }

        const dbByEan = new Map<string, { id: string; ean: string; nome: string }>();
        dbProducts.forEach((p: any) => {
          if (p.ean) dbByEan.set(String(p.ean).trim(), p);
        });

        // Parallel update batch with Promise.all
        const updatePromises = batch.map(async (u: any) => {
          const cleanEan = String(u.ean || "").trim();
          const matched = dbByEan.get(cleanEan);

          if (!matched) {
            errorCount++;
            errors.push({ ean: u.ean, error: "Produto com este EAN não encontrado no catálogo." });
            return;
          }

          try {
            const { error: updErr } = await adminClient
              .from("produtos")
              .update({ descricao: u.descricao })
              .eq("id", matched.id);

            if (updErr) {
              errorCount++;
              errors.push({ ean: u.ean, error: updErr.message });
            } else {
              successCount++;
            }
          } catch (err: any) {
            errorCount++;
            errors.push({ ean: u.ean, error: err.message || "Erro ao atualizar descrição" });
          }
        });

        await Promise.all(updatePromises);
      }

      return new Response(JSON.stringify({ successCount, errorCount, errors }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      console.error("[bulk-update-descriptions error]:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 1.9. Dedicated Admin Save Pharmacy / Logistics Endpoint
  if (url.pathname === "/api/admin/save-pharmacy" && request.method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));
      const { id, payload } = body;
      if (!id || !payload) {
        return new Response(JSON.stringify({ error: "Missing id or payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (!payload.cnpj) {
        delete payload.cnpj;
      }

      const targetBase = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "http://20.7.19.49:3006").replace(/\/$/, "");
      const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_lMKRz-zf_I7AXgFPgB9VWf_J1KIKAYU";
      const adminClient = createClient(targetBase, publishableKey);
      
      await adminClient.auth.signInWithPassword({
        email: "nyckolas.lopes@farmaciasassociadas.com.br",
        password: "Aspro@2026"
      });

      const { data, error } = await adminClient.from('lojas').update(payload).eq('id', id).select();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      console.error("[save-pharmacy error]:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // 2.0. Endpoint público para criar pedidos (bypassa RLS para visitantes anônimos)
  if (url.pathname === "/api/pedidos/create" && request.method === "POST") {
    try {
      const body = await request.json().catch(() => ({}));
      const { order } = body;
      if (!order) {
        return new Response(JSON.stringify({ error: "Missing order payload" }), {
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

      // Inserir pedido principal
      const { data: insertedOrder, error: orderError } = await (adminClient.from('pedidos') as any).insert({
        numero: order.numero || order.id || undefined,
        loja_id: order.lojaId,
        user_id: order.userId || null,
        status: order.status || 'novo',
        total: order.valores?.total || 0,
        subtotal: order.valores?.subtotal || order.valores?.produtos || 0,
        frete: order.valores?.frete || 0,
        desconto: order.valores?.desconto || order.valores?.descontos || 0,
        endereco_entrega: order.cliente?.endereco || null,
        metodo_entrega: order.modalidade || order.envio?.metodo,
        metodo_pagamento: order.pagamento?.metodo,
        observacoes: order.anotacoes || order.observacoes || '',
        nome_cliente: order.cliente?.nome || '',
        telefone_cliente: order.cliente?.telefone || '',
        email_cliente: order.cliente?.email || '',
        cpf_cliente: order.cliente?.cpf || ''
      }).select('id, numero').single();

      if (orderError) {
        return new Response(JSON.stringify({ error: orderError.message, code: orderError.code }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Inserir itens do pedido
      const itens = order.produtos || order.itens || [];
      if (itens.length > 0 && insertedOrder) {
        const productIds = itens.map((i: any) => i.id || i.sku).filter(Boolean);
        const { data: existingProducts } = await adminClient.from('produtos').select('id').in('id', productIds);
        const existingProductIds = new Set(existingProducts?.map((p: any) => p.id) || []);

        const orderItemsRows = itens.map((i: any) => ({
          pedido_id: insertedOrder.id,
          produto_id: (i.id || i.sku) && existingProductIds.has(i.id || i.sku) ? (i.id || i.sku) : null,
          nome: i.nome,
          qty: i.qtd || i.quantidade || 1,
          preco_unit: i.valorUnitario || i.preco || 0
        }));

        await (adminClient.from('pedido_itens') as any).insert(orderItemsRows);
      }

      return new Response(JSON.stringify({ success: true, data: insertedOrder }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      console.error("[pedidos/create error]:", err);
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

  if (url.pathname === "/api/admin/save-app-state" && request.method === "POST") {
    try {
      const body = await request.json();
      const { key, value } = body;
      if (!key) {
        return new Response(JSON.stringify({ error: "Missing key" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const targetBase = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "http://20.7.19.49:3006").replace(/\/$/, "");
      // Usa service_role key para bypassar RLS — publishable key é bloqueada por políticas na tabela app_state
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_lMKRz-zf_I7AXgFPgB9VWf_J1KIKAYU";
      const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
      const apiKey = serviceRoleKey || publishableKey;

      const adminClient = createClient(targetBase, apiKey, {
        global: {
          headers: (!serviceRoleKey && authHeader) ? { Authorization: authHeader } : undefined
        },
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const { data, error } = await (adminClient.from('app_state') as any).upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }).select();

      if (error) {
        return new Response(JSON.stringify({ success: false, warning: error.message }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return null;
}
