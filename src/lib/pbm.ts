import type { Produto } from "@/types";

export type PBMProvider = "epharma" | "scanntech" | "dermaclub";

export const PBM_PROVIDERS: { id: PBMProvider; label: string; desc: string }[] = [
  { id: "epharma", label: "E-Pharma", desc: "Convênios e benefícios farmácia" },
  { id: "scanntech", label: "Scanntech", desc: "Cashback automático" },
  { id: "dermaclub", label: "Dermaclub", desc: "Programa L'Oréal (dermocosméticos)" },
];

export interface PBMCredential {
  provider: PBMProvider;
  cpf: string;
  card: string;
}

export interface PBMDiscount {
  produtoId: string;
  valor: number;
}

// Mock eligibility: any prescription product (Vermelha/Preta) qualifies for PBM
export function isPbmEligible(p: Produto): boolean {
  return /vermelha|preta/i.test(p.tarja);
}

// Mock discount calc — 30% for medicamentos, 15% otherwise
export function pbmDiscountFor(p: Produto, provider: PBMProvider | null): number {
  if (!provider || !isPbmEligible(p)) return 0;
  const pct = provider === "epharma" ? 0.3 : provider === "scanntech" ? 0.2 : 0.15;
  return +(p.precoPor * pct).toFixed(2);
}
