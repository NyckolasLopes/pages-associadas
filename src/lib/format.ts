import React from "react";

export const brl = (n: number | undefined | null) => {
  if (n === undefined || n === null || isNaN(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const highlightGratis = (text: string | null | undefined): React.ReactNode => {
  if (!text) return text;
  const str = String(text);
  const parts = str.split(/(gr[aá]tis)/gi);
  if (parts.length === 1) return text;
  return parts.map((part, index) => {
    if (/^gr[aá]tis$/i.test(part)) {
      return React.createElement(
        "span",
        {
          key: index,
          style: { color: "#2CFF05" },
          className: "text-[#2CFF05] text-gratis font-bold",
        },
        part
      );
    }
    return part;
  });
};

export const getInstallmentText = (price: number | undefined | null) => {
  return null;
};

export const formatPbmName = (selo: string | undefined | null) => {
  if (!selo) return "";
  const lower = selo.toLowerCase();
  if (lower === "e-pharma") return "E-pharma";
  if (lower === "dermaclub") return "Dermaclub";
  if (lower === "scantech" || lower === "scanntech") return "Scantech";
  return selo; // returns exactly as is if not in the map
};

export const checkIsGenerico = (p: any) => {
  if (!p) return false;
  const name = String(p?.nome || p?.titulo || p?.descricao || p?.name || "").toLowerCase();
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const hasGenericoInTitle = /\bgenerico(s)?\b/i.test(normalized) || normalized.includes("generico");

  return !!p?.generico || 
         p?.tipoMedicamento === "generico" || 
         p?.classificacaoRegistro === "generico" || 
         String(p?.classeTerapeutica || "").toLowerCase().includes("generico") ||
         (Array.isArray(p?.selosIds) && (p.selosIds.includes("gen") || p.selosIds.includes("generico"))) ||
         (Array.isArray(p?.internal_tags) && p.internal_tags.some((t: string) => t.includes("gen") || t.includes("generico"))) ||
         hasGenericoInTitle;
};

export const productImage = (p: any) => {
  if (!p) return "/produtos/sem-imagem.webp";
  if (typeof p === "string") return p;
  if (p.imagens && Array.isArray(p.imagens) && p.imagens.length > 0) {
    const img = p.imagens[0];
    const url = typeof img === 'string' ? img : (img?.caminhoImagem || img?.url);
    if (url) return url;
  }
  if (typeof p.imagens === 'string' && p.imagens.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(p.imagens);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const img = parsed[0];
        const url = typeof img === 'string' ? img : (img?.caminhoImagem || img?.url);
        if (url) return url;
      }
    } catch {}
  } else if (typeof p.imagens === 'string' && (p.imagens.startsWith('http') || p.imagens.startsWith('/'))) {
    return p.imagens;
  }
  if (p.foto && typeof p.foto === 'string') return p.foto;
  if (p.imagem && typeof p.imagem === 'string') return p.imagem;
  if (p.imagemPrincipal && typeof p.imagemPrincipal === 'string') return p.imagemPrincipal;

  if (p.possuiImagem && p.ean) {
    // Return actual image if implemented
    // return `/images/products/${p.ean}.jpg`;
  }

  const name = String(p.nome || "").toLowerCase();
  const tarja = String(p.tarja || "").toLowerCase();
  const retencao = p.retemReceita || p.requiresReceita;

  if (name.includes("aerolin") || name.includes("salbutamol") || name.includes("aerossol") || name.includes("bombinha")) {
    return "/produtos/aerolin.webp";
  }

  if (name.includes("nasal") || name.includes("neosoro") || name.includes("naridrin") || name.includes("soro")) {
    return "/produtos/solucao-nasal.webp";
  }
  
  if (name.includes("caneta") || name.includes("ozempic") || name.includes("saxenda") || name.includes("wegovy") || name.includes("mounjaro")) {
    return "/produtos/caneta-emagrecedora.webp";
  }

  const isGenerico = checkIsGenerico(p);

  if (isGenerico) {
    if (tarja.includes("preta")) {
      return "/produtos/generico-preta.webp";
    }
    if (tarja.includes("vermelha")) {
      return retencao ? "/produtos/generico-vermelha-retencao.webp" : "/produtos/generico-vermelha.webp";
    }
    return "/produtos/generico-sem-tarja.webp";
  }

  if (tarja.includes("preta")) {
    return "/produtos/ref-preta.webp";
  }

  if (tarja.includes("vermelha")) {
    return retencao ? "/produtos/ref-vermelha-retencao.webp" : "/produtos/ref-vermelha.webp";
  }

  // Placeholder for products without an image
  return "/produtos/sem-imagem.webp";
};

export const tarjaColor = (tarja: any) => {
  if (!tarja || typeof tarja !== 'string') return "bg-muted text-muted-foreground";
  if (tarja.toLowerCase().includes("vermelha")) return "bg-red-600 text-white";
  if (tarja.toLowerCase().includes("preta")) return "bg-black text-white";
  if (tarja.toLowerCase().includes("amarela")) return "bg-yellow-400 text-black";
  return "bg-muted text-muted-foreground";
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia ; )";
  if (hour >= 12 && hour < 18) return "Boa tarde ; )";
  return "Boa noite ; )";
};
