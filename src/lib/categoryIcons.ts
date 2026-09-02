import React from "react";
import {
  Pill, Sparkles, Leaf, Stethoscope, Baby, Flower2, ShoppingBag,
  HeartPulse, ShieldCheck, Eye, Smile, User, Scale, Activity,
  BriefcaseMedical, Coffee, Thermometer, Battery, Wind, Droplets,
  Dumbbell, Tag, Flame, Percent, Heart, Sun, Glasses, Apple,
  Package, Brush, Footprints, Syringe, Home
} from "lucide-react";
import { MENU_ICON_MAP } from "@/components/admin/CategoryMenuIconModal";

export const ROOT_CAT_DEFAULT_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  "142": Pill,               // Medicamentos
  "143": Droplets,           // Higiene e Cuidados
  "144": Baby,               // Mamãe e Bebê
  "145": Sparkles,           // Dermocosméticos e Beleza
  "146": Battery,            // Vitaminas e Suplementos
  "147": BriefcaseMedical,   // Saúde e Aparelhos
  "148": ShoppingBag,        // Conveniência
  "200": HeartPulse,         // Serviços
  "300": ShieldCheck,        // Nossas Marcas
};

export function getCategoryIconByName(name: string): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
  const n = String(name || "").toLowerCase();
  if (n.includes("higiene") || n.includes("banho") || n.includes("sabonete") || n.includes("cabelo") || n.includes("tintura") || n.includes("oral")) return Droplets;
  if (n.includes("medicamento") || n.includes("remedio") || n.includes("farmacia") || n.includes("comprimido") || n.includes("pílula") || n.includes("pilula")) return Pill;
  if (n.includes("vitamina") || n.includes("multivitam") || n.includes("mineral") || n.includes("energia") || n.includes("disposição")) return Battery;
  if (n.includes("suplemento") || n.includes("whey") || n.includes("proteina") || n.includes("colágeno") || n.includes("colageno") || n.includes("creatina")) return Dumbbell;
  if (n.includes("marca") || n.includes("nossas marcas") || n.includes("exclusiv") || n.includes("associadas")) return ShieldCheck;
  if (n.includes("serviço") || n.includes("servico") || n.includes("atendimento") || n.includes("farmacêutico") || n.includes("aplicação") || n.includes("pressão")) return HeartPulse;
  if (n.includes("bebê") || n.includes("bebe") || n.includes("infantil") || n.includes("mamadeira") || n.includes("chupeta") || n.includes("fralda") || n.includes("maternidade")) return Baby;
  if (n.includes("aparelho") || n.includes("saúde") || n.includes("saude") || n.includes("medidor") || n.includes("médico") || n.includes("hospitalar") || n.includes("oxímetro") || n.includes("inalador") || n.includes("nebulizador")) return BriefcaseMedical;
  if (n.includes("dermo") || n.includes("beleza") || n.includes("maquiagem") || n.includes("cosmético") || n.includes("cosmetico") || n.includes("creme") || n.includes("pele") || n.includes("rosto") || n.includes("facial") || n.includes("estética")) return Sparkles;
  if (n.includes("conveniência") || n.includes("conveniencia") || n.includes("alimento") || n.includes("bomboniere") || n.includes("snack") || n.includes("bala") || n.includes("chocolate")) return ShoppingBag;
  if (n.includes("solar") || n.includes("protetor") || n.includes("bronze") || n.includes("sol")) return Sun;
  if (n.includes("coração") || n.includes("cardio")) return HeartPulse;
  if (n.includes("olho") || n.includes("colírio") || n.includes("colirio") || n.includes("ocular") || n.includes("visão")) return Eye;
  if (n.includes("dente") || n.includes("bucal") || n.includes("boca") || n.includes("dental") || n.includes("escova")) return Smile;
  if (n.includes("mulher") || n.includes("ginecologia") || n.includes("gestante") || n.includes("íntima") || n.includes("intima") || n.includes("absorvente")) return Flower2;
  if (n.includes("homem") || n.includes("urologia") || n.includes("barba") || n.includes("lâmina") || n.includes("lamina") || n.includes("depilação")) return User;
  if (n.includes("emagrecer") || n.includes("peso") || n.includes("termogênico") || n.includes("termogenico") || n.includes("dieta")) return Scale;
  if (n.includes("diabetes") || n.includes("glicose") || n.includes("insulina")) return Activity;
  if (n.includes("nervoso") || n.includes("calmante") || n.includes("fitoterápico") || n.includes("fitoterapico") || n.includes("natural") || n.includes("chá") || n.includes("cha")) return Leaf;
  if (n.includes("vacina") || n.includes("teste") || n.includes("exame")) return Stethoscope;
  if (n.includes("desodorante") || n.includes("antitranspirante") || n.includes("perfume") || n.includes("colônia")) return Wind;
  if (n.includes("dor") || n.includes("febre") || n.includes("termômetro") || n.includes("termometro") || n.includes("gripe") || n.includes("resfriado") || n.includes("alergia") || n.includes("infecção") || n.includes("estômago") || n.includes("digestão")) return Thermometer;
  if (n.includes("imunidade") || n.includes("proteção") || n.includes("defesa")) return ShieldCheck;
  if (n.includes("pé") || n.includes("pes") || n.includes("podologia") || n.includes("palmilha")) return Footprints;
  if (n.includes("cabelo") || n.includes("escova") || n.includes("pente") || n.includes("secador")) return Brush;
  if (n.includes("óculos") || n.includes("oculos") || n.includes("leitura")) return Glasses;
  if (n.includes("oferta") || n.includes("promoção") || n.includes("promocao") || n.includes("desconto")) return Tag;

  return Tag;
}

export function resolveCategoryIcon(
  cat: { id?: string | number; nome?: string; icone?: string },
  customIcons?: {
    storeCategoryIcons?: Record<string, Record<string, string>>;
    categoryIcons?: Record<string, string>;
    storeId?: string | null;
  }
): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
  const catId = String(cat?.id || "");
  const storeId = customIcons?.storeId;

  // 1. Ícone customizado por loja
  if (storeId && customIcons?.storeCategoryIcons?.[storeId]?.[catId]) {
    const key = customIcons.storeCategoryIcons[storeId][catId];
    if (MENU_ICON_MAP[key]) return MENU_ICON_MAP[key];
  }

  // 2. Ícone customizado global
  if (customIcons?.categoryIcons?.[catId]) {
    const key = customIcons.categoryIcons[catId];
    if (MENU_ICON_MAP[key]) return MENU_ICON_MAP[key];
  }

  // 3. Campo icone da categoria
  if (cat?.icone && MENU_ICON_MAP[cat.icone]) {
    return MENU_ICON_MAP[cat.icone];
  }

  // 4. Mapeamento padrão por ID de categoria raiz
  if (catId && ROOT_CAT_DEFAULT_ICONS[catId]) {
    return ROOT_CAT_DEFAULT_ICONS[catId];
  }

  // 5. Mapeamento semântico pelo nome da categoria/subcategoria
  if (cat?.nome) {
    return getCategoryIconByName(cat.nome);
  }

  return Tag;
}
