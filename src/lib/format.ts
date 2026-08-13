export const brl = (n: number | undefined | null) => {
  if (n === undefined || n === null || isNaN(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const getInstallmentText = (price: number | undefined | null) => {
  if (!price || price < 30) return null;
  const maxInstallments = Math.min(6, Math.floor(price / 30));
  if (maxInstallments <= 1) return null;
  return `em até ${maxInstallments}x de ${brl(price / maxInstallments)} sem juros`;
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
  const name = String(p?.nome || "").toLowerCase();
  return !!p?.generico || 
         p?.tipoMedicamento === "generico" || 
         p?.classificacaoRegistro === "generico" || 
         String(p?.classeTerapeutica || "").toLowerCase().includes("generico") ||
         name.includes("genérico") || 
         name.includes("generico");
};

export const productImage = (p: any) => {
  if (!p) return "/produtos/generico.webp";
  if (typeof p === "string") return p;
  if (p.imagens && p.imagens.length > 0) {
    return p.imagens[0];
  }

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

  if (name.includes("energy") || name.includes("energia") || name.includes("energético")) {
    return "/produtos/energy.webp";
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
