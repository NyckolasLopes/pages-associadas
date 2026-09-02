import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAdmin } from "@/stores/admin";
import { useConfig } from "@/stores/config";
import {
  Palette,
  RotateCcw,
  Save,
  Eye,
  Info,
  Sparkles,
  ChevronRight,
  Monitor,
  Store,
  Search,
  ShoppingCart,
  Check,
  Smartphone,
  Tablet,
  SlidersHorizontal,
  Share2,
  Menu,
  MapPin,
  User,
  Heart,
  ShieldCheck,
  Pill,
  Truck,
  Phone,
  Percent,
  Stethoscope,
  Baby,
  Leaf,
  Battery,
  Tag,
  Clock,
  ArrowRight,
  CreditCard,
  Mail,
  Send,
  Lock,
  ExternalLink,
  Copy,
  Layers,
  ShoppingBag,
  Flame,
  Zap,
  LayoutTemplate,
  Globe,
  Network,
  AlertTriangle,
  Ticket,
} from "lucide-react";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { MotorcycleIcon } from "@/components/ui/motorcycle-icon";
import { safeSlugify } from "@/hooks/useActivePharmacy";

export interface ColorPreset {
  id: string;
  name: string;
  category?: string;
  stripes: [string, string, string, string, string, string];
  colors: Record<string, string>;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "associadas-oficial",
    name: "Associadas Oficial (Teal & Laranja)",
    category: "Oficial",
    stripes: ["#00B5AD", "#F37021", "#FFFFFF", "#008E88", "#0F172A", "#F43F5E"],
    colors: {
      "--primary": "#00B5AD",
      "--primary-foreground": "#FFFFFF",
      "--btn-primary-bg": "#00B5AD",
      "--btn-primary-text": "#FFFFFF",
      "--secondary": "#F37021",
      "--secondary-foreground": "#FFFFFF",
      "--btn-secondary-bg": "#F37021",
      "--btn-secondary-text": "#FFFFFF",
      "--accent": "#F43F5E",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--headings": "#0F172A",
      "--section-desc": "#64748B",
      "--header-bg": "#00B5AD",
      "--header-icons": "#F37021",
      "--header-text": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--search-text": "#334155",
      "--search-icon": "#94A3B8",
      "--search-border": "#E2E8F0",
      "--cart-btn-bg": "#FFFFFF",
      "--cart-btn-text": "#00B5AD",
      "--cart-badge-bg": "#F43F5E",
      "--cart-badge-text": "#FFFFFF",
      "--topbar-bg": "#F37021",
      "--topbar-icon": "#FFFFFF",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#008E88",
      "--menu-text": "#FFFFFF",
      "--all-cats-icon": "#FFFFFF",
      "--all-cats-text": "#FFFFFF",
      "--price-main": "#00B5AD",
      "--price-old": "#94A3B8",
      "--price-discount-badge-bg": "#F43F5E",
      "--price-discount-badge-text": "#FFFFFF",
      "--tarja-bg": "#FFFFFF",
      "--tarja-icon": "#00B5AD",
      "--tarja-text": "#0F172A",
      "--news-bg": "#F8FAFC",
      "--news-text": "#0F172A",
      "--news-input-bg": "#FFFFFF",
      "--news-input-text": "#1E293B",
      "--news-input-border": "#CBD5E1",
      "--news-btn-bg": "#00B5AD",
      "--news-btn-text": "#FFFFFF",
      "--footer-bg": "#00B5AD",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#00B5AD",
      "--social-icons-bg": "#FFFFFF",
      "--footer-bottom-bg": "#008E88",
      "--footer-bottom-text": "#E2E8F0",
      "--institutional-bg": "#F97316",
      "--pwa-banner-bg": "#00B5AD",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#00B5AD",
    }
  },
  {
    id: "ocean-blue",
    name: "Azul Oceano & Dourado (Premium)",
    category: "Saúde & Confiança",
    stripes: ["#0284C7", "#F59E0B", "#FFFFFF", "#0369A1", "#0F172A", "#EF4444"],
    colors: {
      "--primary": "#0284C7",
      "--primary-foreground": "#FFFFFF",
      "--btn-primary-bg": "#0284C7",
      "--btn-primary-text": "#FFFFFF",
      "--secondary": "#F59E0B",
      "--secondary-foreground": "#FFFFFF",
      "--btn-secondary-bg": "#F59E0B",
      "--btn-secondary-text": "#FFFFFF",
      "--accent": "#EF4444",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--headings": "#0F172A",
      "--section-desc": "#64748B",
      "--header-bg": "#0284C7",
      "--header-icons": "#FFFFFF",
      "--header-text": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--search-text": "#334155",
      "--search-icon": "#0284C7",
      "--search-border": "#E0F2FE",
      "--cart-btn-bg": "#FFFFFF",
      "--cart-btn-text": "#0284C7",
      "--cart-badge-bg": "#EF4444",
      "--cart-badge-text": "#FFFFFF",
      "--topbar-bg": "#0369A1",
      "--topbar-icon": "#F59E0B",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#0369A1",
      "--menu-text": "#FFFFFF",
      "--all-cats-icon": "#F59E0B",
      "--all-cats-text": "#FFFFFF",
      "--price-main": "#0284C7",
      "--price-old": "#94A3B8",
      "--price-discount-badge-bg": "#EF4444",
      "--price-discount-badge-text": "#FFFFFF",
      "--tarja-bg": "#F0F9FF",
      "--tarja-icon": "#0284C7",
      "--tarja-text": "#0C4A6E",
      "--news-bg": "#F0F9FF",
      "--news-text": "#0C4A6E",
      "--news-input-bg": "#FFFFFF",
      "--news-input-text": "#1E293B",
      "--news-input-border": "#BAE6FD",
      "--news-btn-bg": "#0284C7",
      "--news-btn-text": "#FFFFFF",
      "--footer-bg": "#0C4A6E",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#0284C7",
      "--social-icons-bg": "#FFFFFF",
      "--footer-bottom-bg": "#082F49",
      "--footer-bottom-text": "#BAE6FD",
      "--institutional-bg": "#0284C7",
      "--pwa-banner-bg": "#0284C7",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#0284C7",
    }
  },
  {
    id: "emerald-mint",
    name: "Esmeralda & Menta Natural (Bem-Estar)",
    category: "Natural & Fitoterapia",
    stripes: ["#059669", "#10B981", "#FFFFFF", "#047857", "#064E3B", "#F59E0B"],
    colors: {
      "--primary": "#059669",
      "--primary-foreground": "#FFFFFF",
      "--btn-primary-bg": "#059669",
      "--btn-primary-text": "#FFFFFF",
      "--secondary": "#10B981",
      "--secondary-foreground": "#FFFFFF",
      "--btn-secondary-bg": "#10B981",
      "--btn-secondary-text": "#FFFFFF",
      "--accent": "#F59E0B",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--headings": "#064E3B",
      "--section-desc": "#64748B",
      "--header-bg": "#059669",
      "--header-icons": "#FFFFFF",
      "--header-text": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--search-text": "#334155",
      "--search-icon": "#059669",
      "--search-border": "#D1FAE5",
      "--cart-btn-bg": "#FFFFFF",
      "--cart-btn-text": "#059669",
      "--cart-badge-bg": "#F59E0B",
      "--cart-badge-text": "#FFFFFF",
      "--topbar-bg": "#047857",
      "--topbar-icon": "#34D399",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#047857",
      "--menu-text": "#FFFFFF",
      "--all-cats-icon": "#34D399",
      "--all-cats-text": "#FFFFFF",
      "--price-main": "#059669",
      "--price-old": "#94A3B8",
      "--price-discount-badge-bg": "#F59E0B",
      "--price-discount-badge-text": "#FFFFFF",
      "--tarja-bg": "#ECFDF5",
      "--tarja-icon": "#059669",
      "--tarja-text": "#064E3B",
      "--news-bg": "#ECFDF5",
      "--news-text": "#064E3B",
      "--news-input-bg": "#FFFFFF",
      "--news-input-text": "#1E293B",
      "--news-input-border": "#A7F3D0",
      "--news-btn-bg": "#059669",
      "--news-btn-text": "#FFFFFF",
      "--footer-bg": "#064E3B",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#059669",
      "--social-icons-bg": "#FFFFFF",
      "--footer-bottom-bg": "#022C22",
      "--footer-bottom-text": "#A7F3D0",
      "--institutional-bg": "#059669",
      "--pwa-banner-bg": "#059669",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#059669",
    }
  },
  {
    id: "violet-magenta",
    name: "Violeta & Magenta (Dermocosméticos)",
    category: "Beleza & Cuidados",
    stripes: ["#705BC2", "#FE509C", "#FFFFFF", "#5F4BB6", "#1E1B4B", "#10B981"],
    colors: {
      "--primary": "#705BC2",
      "--primary-foreground": "#FFFFFF",
      "--btn-primary-bg": "#705BC2",
      "--btn-primary-text": "#FFFFFF",
      "--secondary": "#FE509C",
      "--secondary-foreground": "#FFFFFF",
      "--btn-secondary-bg": "#FE509C",
      "--btn-secondary-text": "#FFFFFF",
      "--accent": "#FE509C",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--headings": "#1E1B4B",
      "--section-desc": "#64748B",
      "--header-bg": "#705BC2",
      "--header-icons": "#FFFFFF",
      "--header-text": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--search-text": "#334155",
      "--search-icon": "#705BC2",
      "--search-border": "#E2E8F0",
      "--cart-btn-bg": "#FE509C",
      "--cart-btn-text": "#FFFFFF",
      "--cart-badge-bg": "#10B981",
      "--cart-badge-text": "#FFFFFF",
      "--topbar-bg": "#FE509C",
      "--topbar-icon": "#FFFFFF",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#5F4BB6",
      "--menu-text": "#FFFFFF",
      "--all-cats-icon": "#FE509C",
      "--all-cats-text": "#FFFFFF",
      "--price-main": "#705BC2",
      "--price-old": "#94A3B8",
      "--price-discount-badge-bg": "#FE509C",
      "--price-discount-badge-text": "#FFFFFF",
      "--tarja-bg": "#FAF5FF",
      "--tarja-icon": "#705BC2",
      "--tarja-text": "#1E1B4B",
      "--news-bg": "#F5F3FF",
      "--news-text": "#1E1B4B",
      "--news-input-bg": "#FFFFFF",
      "--news-input-text": "#1E293B",
      "--news-input-border": "#DDD6FE",
      "--news-btn-bg": "#705BC2",
      "--news-btn-text": "#FFFFFF",
      "--footer-bg": "#1E1B4B",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#705BC2",
      "--social-icons-bg": "#FFFFFF",
      "--footer-bottom-bg": "#0F0E2A",
      "--footer-bottom-text": "#DDD6FE",
      "--institutional-bg": "#705BC2",
      "--pwa-banner-bg": "#705BC2",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#705BC2",
    }
  },
  {
    id: "ruby-red",
    name: "Rubi & Laranja Energia",
    category: "Varejo & Destaque",
    stripes: ["#DC2626", "#F97316", "#FFFFFF", "#B91C1C", "#7F1D1D", "#F97316"],
    colors: {
      "--primary": "#DC2626",
      "--primary-foreground": "#FFFFFF",
      "--btn-primary-bg": "#DC2626",
      "--btn-primary-text": "#FFFFFF",
      "--secondary": "#F97316",
      "--secondary-foreground": "#FFFFFF",
      "--btn-secondary-bg": "#F97316",
      "--btn-secondary-text": "#FFFFFF",
      "--accent": "#F97316",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--headings": "#7F1D1D",
      "--section-desc": "#64748B",
      "--header-bg": "#DC2626",
      "--header-icons": "#FFFFFF",
      "--header-text": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--search-text": "#334155",
      "--search-icon": "#DC2626",
      "--search-border": "#FEE2E2",
      "--cart-btn-bg": "#FFFFFF",
      "--cart-btn-text": "#DC2626",
      "--cart-badge-bg": "#F97316",
      "--cart-badge-text": "#FFFFFF",
      "--topbar-bg": "#B91C1C",
      "--topbar-icon": "#FCA5A5",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#B91C1C",
      "--menu-text": "#FFFFFF",
      "--all-cats-icon": "#FCA5A5",
      "--all-cats-text": "#FFFFFF",
      "--price-main": "#DC2626",
      "--price-old": "#94A3B8",
      "--price-discount-badge-bg": "#F97316",
      "--price-discount-badge-text": "#FFFFFF",
      "--tarja-bg": "#FEF2F2",
      "--tarja-icon": "#DC2626",
      "--tarja-text": "#7F1D1D",
      "--news-bg": "#FEF2F2",
      "--news-text": "#7F1D1D",
      "--news-input-bg": "#FFFFFF",
      "--news-input-text": "#1E293B",
      "--news-input-border": "#FECACA",
      "--news-btn-bg": "#DC2626",
      "--news-btn-text": "#FFFFFF",
      "--footer-bg": "#7F1D1D",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#DC2626",
      "--social-icons-bg": "#FFFFFF",
      "--footer-bottom-bg": "#450A0A",
      "--footer-bottom-text": "#FECACA",
      "--institutional-bg": "#DC2626",
      "--pwa-banner-bg": "#DC2626",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#DC2626",
    }
  }
];

// Helper to sanitize and format valid HEX strings (#RRGGBB)
function sanitizeHex(val: string, fallback = "#000000"): string {
  if (!val || typeof val !== "string") return fallback;
  let clean = val.trim();
  if (!clean.startsWith("#")) clean = "#" + clean;
  if (/^#[0-9A-Fa-f]{6}$/.test(clean)) return clean.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(clean)) {
    const r = clean[1], g = clean[2], b = clean[3];
    return (`#${r}${r}${g}${g}${b}${b}`).toUpperCase();
  }
  return fallback;
}

export function StoreColorManager({
  storeId,
  showStoreSelector = true,
  title = "Cores e Identidade Visual",
  description = "Defina a paleta de cores completa da sua loja. As alterações são refletidas em tempo real no simulador.",
}: {
  storeId?: string;
  showStoreSelector?: boolean;
  title?: string;
  description?: string;
}) {
  const admin = useAdmin();
  const effectiveStoreId = storeId || admin.activeStoreId;
  const currentPharmacy = admin.pharmacies.find((p) => p.id === effectiveStoreId);

  // Global admin detection
  const currentUser = admin.currentUser;
  const isGlobalAdmin = !!(currentUser?.proprietario ||
    admin.grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total);

  // Network theme mode: global admin + no specific store selected
  const isNetworkMode = isGlobalAdmin && !effectiveStoreId;

  const defaultTheme: Record<string, string> = useMemo(() => ({
    "--primary": "#00B5AD",
    "--primary-foreground": "#FFFFFF",
    "--btn-primary-bg": "#00B5AD",
    "--btn-primary-text": "#FFFFFF",
    "--secondary": "#F37021",
    "--secondary-foreground": "#FFFFFF",
    "--btn-secondary-bg": "#F37021",
    "--btn-secondary-text": "#FFFFFF",
    "--accent": "#F43F5E",
    "--accent-foreground": "#FFFFFF",
    "--background": "#FFFFFF",
    "--foreground": "#1E293B",
    "--headings": "#0F172A",
    "--section-desc": "#64748B",
    "--header-bg": "#00B5AD",
    "--header-icons": "#F37021",
    "--header-text": "#FFFFFF",
    "--search-bg": "#FFFFFF",
    "--search-text": "#334155",
    "--search-icon": "#94A3B8",
    "--search-border": "#E2E8F0",
    "--cart-btn-bg": "#FFFFFF",
    "--cart-btn-text": "#00B5AD",
    "--cart-badge-bg": "#F43F5E",
    "--cart-badge-text": "#FFFFFF",
    "--topbar-bg": "#F37021",
    "--topbar-icon": "#FFFFFF",
    "--topbar-text": "#FFFFFF",
    "--menu-bg": "#008E88",
    "--menu-text": "#FFFFFF",
    "--all-cats-icon": "#FFFFFF",
    "--all-cats-text": "#FFFFFF",
    "--price-main": "#00B5AD",
    "--price-old": "#94A3B8",
    "--price-discount-badge-bg": "#F43F5E",
    "--price-discount-badge-text": "#FFFFFF",
    "--tarja-bg": "#FFFFFF",
    "--tarja-icon": "#00B5AD",
    "--tarja-text": "#0F172A",
    "--news-bg": "#F8FAFC",
    "--news-text": "#0F172A",
    "--news-input-bg": "#FFFFFF",
    "--news-input-text": "#1E293B",
    "--news-input-border": "#CBD5E1",
    "--news-btn-bg": "#00B5AD",
    "--news-btn-text": "#FFFFFF",
    "--footer-bg": "#00B5AD",
    "--footer-text": "#FFFFFF",
    "--social-icons": "#00B5AD",
    "--social-icons-bg": "#FFFFFF",
    "--footer-bottom-bg": "#008E88",
    "--footer-bottom-text": "#E2E8F0",
    "--institutional-bg": "#F97316",
    "--pwa-banner-bg": "#00B5AD",
    "--pwa-banner-text": "#FFFFFF",
    "--pwa-banner-btn-bg": "#FFFFFF",
    "--pwa-banner-btn-text": "#00B5AD",
  }), []);

  const [colors, setColors] = useState<Record<string, string>>(() => {
    const savedColors = currentPharmacy?.themeColors;
    if (savedColors && typeof savedColors === 'object' && Object.keys(savedColors).length > 0) {
      return { ...defaultTheme, ...savedColors };
    }
    return defaultTheme;
  });

  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"presets" | "general" | "header" | "buttons" | "prices" | "footer">("general");
  const [previewPage, setPreviewPage] = useState<"home" | "product" | "cart">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Network theme state
  const [networkColors, setNetworkColors] = useState<Record<string, string>>(() => admin.networkDefaultTheme || defaultTheme);
  const [isNetworkSaving, setIsNetworkSaving] = useState(false);
  const [isApplyingAll, setIsApplyingAll] = useState(false);

  useEffect(() => {
    // Load network theme on mount
    admin.loadNetworkTheme();
  }, []);

  useEffect(() => {
    if (isNetworkMode) {
      setColors({ ...defaultTheme, ...(admin.networkDefaultTheme || {}) });
    } else if (currentPharmacy?.themeColors && Object.keys(currentPharmacy.themeColors).length > 0) {
      setColors({ ...defaultTheme, ...currentPharmacy.themeColors });
    } else {
      setColors({ ...defaultTheme, ...(admin.networkDefaultTheme || {}) });
    }
  }, [isNetworkMode, currentPharmacy?.id, defaultTheme, admin.networkDefaultTheme]);

  const getColor = (key: string, fallback: string) => {
    return colors[key] || colors[`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] || colors[key.replace(/^--/, '')] || fallback;
  };

  const updateColor = (key: string, rawValue: string) => {
    let formatted = rawValue.trim();
    if (!formatted.startsWith("#") && /^[0-9A-Fa-f]{3,6}$/.test(formatted)) {
      formatted = "#" + formatted;
    }

    setColors(prev => {
      const updated = { ...prev, [key]: formatted };
      if (key.startsWith('--')) {
        const camel = key.replace(/^--/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        updated[camel] = formatted;
      } else {
        const kebab = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        updated[kebab] = formatted;
      }
      return updated;
    });
  };

  const applyPreset = (preset: ColorPreset) => {
    setColors(prev => ({
      ...prev,
      ...preset.colors
    }));
    toast.success(`Paleta "${preset.name}" aplicada no simulador! Clique em Salvar para publicar.`);
  };

  const handleApplyToAllPleno = async () => {
    if (!window.confirm("Isso vai sobrescrever as cores de TODAS as lojas Pleno com as cores definidas nesta tela. Confirmar?")) return;
    setIsApplyingAll(true);
    try {
      await admin.saveNetworkTheme(colors);
      const { updated } = await admin.applyNetworkThemeToAllPleno();
      toast.success(`Tema padrão da rede aplicado em ${updated} loja(s) Pleno com sucesso!`);
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Tente novamente"));
    } finally {
      setIsApplyingAll(false);
    }
  };

  const handleImportNetworkTheme = () => {
    if (!admin.networkDefaultTheme) {
      toast.error("Tema da rede não encontrado. Configure-o primeiro.");
      return;
    }
    setColors(prev => ({ ...prev, ...admin.networkDefaultTheme }));
    toast.success("Tema da rede importado! Clique em Salvar para aplicar nesta loja.");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isNetworkMode || !effectiveStoreId) {
        await admin.saveNetworkTheme(colors);
        toast.success("Cores padrão da rede salvas com sucesso! Todas as configurações foram salvas como padrão da rede.");
      } else {
        if (currentPharmacy) {
          await admin.updatePharmacy(effectiveStoreId, {
            ...currentPharmacy,
            themeColors: colors,
          });
        }
        toast.success("Cores salvas com sucesso! Sua loja já está com a nova identidade visual.");
      }
    } catch (err: any) {
      toast.error("Erro ao salvar cores: " + (err.message || "Tente novamente"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCss = () => {
    const cssVars = Object.entries(colors)
      .filter(([k]) => k.startsWith('--'))
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    const fullCss = `:root {\n${cssVars}\n}`;
    navigator.clipboard.writeText(fullCss);
    toast.success("Variáveis CSS copiadas para a área de transferência!");
  };

  const currentStripes = useMemo(() => {
    const p = getColor("--primary", "#00B5AD");
    const s = getColor("--secondary", "#F37021");
    return [
      p,
      s,
      getColor("--header-bg", p),
      getColor("--topbar-bg", s),
      getColor("--menu-bg", p === "#00B5AD" ? "#008E88" : p),
      getColor("--footer-bg", p),
    ];
  }, [colors]);

  // Quick Swatches palette for fast coloring
  const quickSwatches = [
    getColor("--primary", "#00B5AD"),
    getColor("--secondary", "#F37021"),
    "#FFFFFF",
    "#0F172A",
    "#64748B",
    "#00B5AD",
    "#0284C7",
    "#059669",
    "#705BC2",
    "#F43F5E",
  ];

  // Enhanced Color Field Component
  const ColorField = ({
    nameKey,
    label,
    description,
    fallback,
  }: {
    nameKey: string;
    label: string;
    description: string;
    fallback: string;
  }) => {
    const val = getColor(nameKey, fallback);
    const safeHex = sanitizeHex(val, fallback);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = label.toLowerCase().includes(q) || description.toLowerCase().includes(q) || nameKey.toLowerCase().includes(q);
      if (!match) return null;
    }

    return (
      <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative group shrink-0">
              <label
                htmlFor={`color-input-${nameKey}`}
                className="w-8 h-8 rounded-lg border-2 border-white shadow-md block cursor-pointer transition-transform group-hover:scale-105"
                style={{ backgroundColor: val }}
                title="Clique para escolher no círculo de cores"
              >
                <span className="sr-only">Escolher cor {label}</span>
              </label>
              <input
                id={`color-input-${nameKey}`}
                type="color"
                className="sr-only"
                value={safeHex}
                onChange={(e) => updateColor(nameKey, e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 block truncate">{label}</span>
              <span className="text-[11px] text-slate-500 line-clamp-1">{description}</span>
            </div>
          </div>

          {/* Hex Input */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Input
              type="text"
              value={val}
              onChange={(e) => updateColor(nameKey, e.target.value)}
              placeholder="#000000"
              className="w-24 h-8 text-xs font-mono font-bold uppercase text-center border-slate-200 bg-slate-50/60 focus:bg-white"
            />
          </div>
        </div>

        {/* Quick color chips */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-semibold text-slate-400 mr-1">Rápidas:</span>
          {quickSwatches.slice(0, 7).map((hex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => updateColor(nameKey, hex)}
              className={`w-4 h-4 rounded-full border border-slate-300 shrink-0 hover:scale-125 transition-transform ${
                val.toUpperCase() === hex.toUpperCase() ? "ring-2 ring-emerald-500 ring-offset-1" : ""
              }`}
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
      </div>
    );
  };

  const storeSlug = currentPharmacy?.slug 
    ? safeSlugify(currentPharmacy.slug) 
    : safeSlugify(currentPharmacy?.nome || "loja");

  return (
    <div className="space-y-6">
      {showStoreSelector && !storeId && <StoreSelector hidePlenoForNonAdmin={false} />}

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Palette className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-800">{title}</h2>
              <p className="text-xs md:text-sm text-slate-500">{description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleCopyCss}
            size="sm"
            className="text-slate-600 border-slate-200 hover:bg-slate-50 font-semibold"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Copiar CSS
          </Button>

          {isNetworkMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyToAllPleno}
              disabled={isApplyingAll}
              className="border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold"
            >
              <Network className="w-3.5 h-3.5 mr-1.5" />
              {isApplyingAll ? "Aplicando..." : "Aplicar a Todas as Lojas Pleno"}
            </Button>
          )}

          {isGlobalAdmin && effectiveStoreId && admin.networkDefaultTheme && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportNetworkTheme}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
            >
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              ↓ Importar Tema da Rede
            </Button>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {isSaving ? "Salvando..." : (isNetworkMode ? "Salvar Padrão da Rede" : "Salvar Cores da Loja")}
          </Button>
        </div>
      </div>

      {/* Main Grid: Controls (Left) + Live Simulation (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls & Pickers (7 Cols) */}
        <div className="xl:col-span-6 2xl:col-span-6 space-y-5">
          
          {/* Quick Stripe Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Paleta Ativa
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {currentPharmacy?.nome || "Farmácia Selecionada"}
              </span>
            </div>

            <div className="h-10 w-full rounded-xl overflow-hidden shadow-inner flex border border-slate-200">
              {currentStripes.map((color, index) => (
                <div
                  key={index}
                  className="flex-1 h-full transition-colors relative group cursor-default"
                  style={{ backgroundColor: color }}
                  title={`Cor ${index + 1}: ${color}`}
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white drop-shadow-md">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "general", label: "Marca & Fundo", icon: Layers },
                { id: "header", label: "Cabeçalho & Menu", icon: LayoutTemplate },
                { id: "buttons", label: "Botões & Ações", icon: ShoppingBag },
                { id: "prices", label: "Preços & Ofertas", icon: Percent },
                { id: "footer", label: "Rodapé & PWA", icon: Store },
                { id: "presets", label: "Paletas Prontas", icon: Sparkles },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      active
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Field Search */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-5" />
              <Input
                type="text"
                placeholder="Filtrar campos (ex: botão, fundo, busca, cesta, texto)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 rounded-lg bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* Color Fields Container */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            
            {/* TAB: PRESETS */}
            {activeTab === "presets" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Paletas Predefinidas Recomendadas
                  </h4>
                  <span className="text-[11px] text-slate-500">Clique para testar</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all bg-slate-50/50 hover:bg-white text-left group flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                            {p.name}
                          </span>
                          {p.category && (
                            <span className="text-[9px] bg-slate-200/70 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                              {p.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-6 w-full rounded-lg overflow-hidden flex shadow-inner border border-slate-200">
                        {p.stripes.map((hex, sIdx) => (
                          <div key={sIdx} className="flex-1 h-full" style={{ backgroundColor: hex }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <ColorField
                  nameKey="--primary"
                  label="Cor Primária da Marca"
                  description="Cor principal dos destaques e elementos principais da loja."
                  fallback="#00B5AD"
                />
                <ColorField
                  nameKey="--secondary"
                  label="Cor Secundária"
                  description="Cor secundária para contraste, promoções e faixas de aviso."
                  fallback="#F37021"
                />
                <ColorField
                  nameKey="--accent"
                  label="Cor de Destaque / Acentos"
                  description="Usada em alertas, badges pulsantes e ofertas especiais."
                  fallback="#F43F5E"
                />
                <ColorField
                  nameKey="--background"
                  label="Fundo da Loja"
                  description="Fundo geral da página do site (Normalmente #FFFFFF)."
                  fallback="#FFFFFF"
                />
                <ColorField
                  nameKey="--foreground"
                  label="Texto Geral"
                  description="Cor dos textos normais, parágrafos e legendas."
                  fallback="#1E293B"
                />
                <ColorField
                  nameKey="--headings"
                  label="Títulos das Seções"
                  description="Cor dos títulos principais (ex: 'Super Ofertas', 'Mais Vendidos')."
                  fallback="#0F172A"
                />
              </div>
            )}

            {/* TAB: HEADER & MENU */}
            {activeTab === "header" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <ColorField
                  nameKey="--topbar-bg"
                  label="Fundo da Faixa Superior (Avisos/Cupons)"
                  description="Barra informativa no topo da tela com cupons e frete."
                  fallback="#F37021"
                />
                <ColorField
                  nameKey="--topbar-text"
                  label="Texto da Faixa Superior"
                  description="Cor do texto com o cupom ou aviso no topo."
                  fallback="#FFFFFF"
                />
                <ColorField
                  nameKey="--header-bg"
                  label="Fundo do Cabeçalho Principal"
                  description="Barra principal onde ficam logotipo, busca e ações."
                  fallback="#00B5AD"
                />
                <ColorField
                  nameKey="--header-icons"
                  label="Ícones do Cabeçalho"
                  description="Cor dos ícones de usuário, favoritos e localização."
                  fallback="#F37021"
                />
                <ColorField
                  nameKey="--header-text"
                  label="Textos do Cabeçalho"
                  description="Cor dos nomes e textos dentro do cabeçalho."
                  fallback="#FFFFFF"
                />
                <ColorField
                  nameKey="--search-bg"
                  label="Fundo da Barra de Busca"
                  description="Cor de fundo do campo de pesquisa de produtos."
                  fallback="#FFFFFF"
                />
                <ColorField
                  nameKey="--search-text"
                  label="Texto da Barra de Busca"
                  description="Cor do texto digitado no campo de busca."
                  fallback="#334155"
                />
                <ColorField
                  nameKey="--search-icon"
                  label="Ícone da Lupa na Busca"
                  description="Cor do ícone de busca dentro do campo."
                  fallback="#94A3B8"
                />
                <ColorField
                  nameKey="--menu-bg"
                  label="Fundo do Menu de Categorias"
                  description="Barra horizontal de navegação das categorias."
                  fallback="#008E88"
                />
                <ColorField
                  nameKey="--menu-text"
                  label="Texto dos Itens do Menu"
                  description="Cor dos links das categorias na barra de menu."
                  fallback="#FFFFFF"
                />
              </div>
            )}

            {/* TAB: BUTTONS & CART */}
            {activeTab === "buttons" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <ColorField
                  nameKey="--btn-primary-bg"
                  label="Fundo do Botão Primário (Comprar)"
                  description="Cor dos botões principais de compra e adição à cesta."
                  fallback="#00B5AD"
                />
                <ColorField
                  nameKey="--btn-primary-text"
                  label="Texto do Botão Primário"
                  description="Cor do texto ou ícone dentro do botão principal."
                  fallback="#FFFFFF"
                />
                <ColorField
                  nameKey="--cart-btn-bg"
                  label="Fundo do Botão da Cesta no Topo"
                  description="Cor do botão da Cesta localizado no cabeçalho."
                  fallback="#FFFFFF"
                />
                <ColorField
                  nameKey="--cart-btn-text"
                  label="Texto e Ícone do Botão da Cesta"
                  description="Cor da palavra 'Cesta' e do ícone no cabeçalho."
                  fallback="#00B5AD"
                />
                <ColorField
                  nameKey="--cart-badge-bg"
                  label="Fundo do Badge de Quantidade da Cesta"
                  description="Bolinha com o número de itens na cesta."
                  fallback="#F43F5E"
                />
                <ColorField
                  nameKey="--cart-badge-text"
                  label="Número do Badge da Cesta"
                  description="Cor do número exibido dentro da bolinha de quantidade."
                  fallback="#FFFFFF"
                />
              </div>
            )}

            {/* TAB: PRICES & BADGES */}
            {activeTab === "prices" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <ColorField
                  nameKey="--price-main"
                  label="Preço Principal (Por)"
                  description="Cor do valor final do produto em destaque."
                  fallback="#00B5AD"
                />
                <ColorField
                  nameKey="--price-old"
                  label="Preço Riscado (De)"
                  description="Cor do preço original antes do desconto."
                  fallback="#94A3B8"
                />
                <ColorField
                  nameKey="--price-discount-badge-bg"
                  label="Fundo do Selo de Desconto %"
                  description="Badge que indica percentual de economia (-15%, -20%)."
                  fallback="#F43F5E"
                />
                <ColorField
                  nameKey="--price-discount-badge-text"
                  label="Texto do Selo de Desconto %"
                  description="Cor do texto '-20%' no selo de desconto."
                  fallback="#FFFFFF"
                />
                <ColorField
                  nameKey="--coupon-badge-bg"
                  label="Fundo do Destaque 'Com Cupom'"
                  description="Cor de fundo do badge de preço com cupom da loja (ex: R$ 15,19 com Cupom)."
                  fallback="#EBF3FE"
                />
                <ColorField
                  nameKey="--coupon-badge-text"
                  label="Texto do Destaque 'Com Cupom'"
                  description="Cor do texto e valor dentro do badge de cupom da loja."
                  fallback="#1a73e8"
                />
                <ColorField
                  nameKey="--coupon-badge-border"
                  label="Borda do Destaque 'Com Cupom'"
                  description="Cor da borda do badge de cupom da loja."
                  fallback="#d2e3fc"
                />
                <ColorField
                  nameKey="--tarja-bg"
                  label="Fundo da Faixa de Benefícios"
                  description="Barra com 'Entrega Rápida', 'Farmacêutico Online', etc."
                  fallback="#FFFFFF"
                />
                <ColorField
                  nameKey="--tarja-icon"
                  label="Ícones da Faixa de Benefícios"
                  description="Cor dos ícones de benefícios."
                  fallback="#00B5AD"
                />
              </div>
            )}

            {/* TAB: FOOTER & PWA */}
            {activeTab === "footer" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <ColorField
                  nameKey="--footer-bg"
                  label="Fundo do Rodapé Principal"
                  description="Cor de fundo da seção de links e informações no rodapé."
                  fallback="#00B5AD"
                />
                <ColorField
                  nameKey="--footer-text"
                  label="Textos do Rodapé"
                  description="Cor dos links e títulos institucionais do rodapé."
                  fallback="#FFFFFF"
                />
                <ColorField
                  nameKey="--social-icons"
                  label="Ícones das Redes Sociais"
                  description="Cor dos ícones do Instagram, Facebook, WhatsApp."
                  fallback="#00B5AD"
                />
                <ColorField
                  nameKey="--social-icons-bg"
                  label="Fundo dos Ícones Sociais"
                  description="Cor da bolinha atrás dos ícones das redes sociais."
                  fallback="#FFFFFF"
                />
                <ColorField
                  nameKey="--news-btn-bg"
                  label="Botão da Newsletter"
                  description="Botão de cadastrar e-mail no rodapé."
                  fallback="#00B5AD"
                />
                <ColorField
                  nameKey="--footer-bottom-bg"
                  label="Fundo do Rodapé Inferior (Legal)"
                  description="Faixa inferior com aviso legal, ANVISA e copyright."
                  fallback="#008E88"
                />
                <ColorField
                  nameKey="--footer-bottom-text"
                  label="Texto do Rodapé Inferior"
                  description="Cor do texto de aviso legal, CNPJ e copyright."
                  fallback="#E2E8F0"
                />
                <ColorField
                  nameKey="--pwa-banner-bg"
                  label="Fundo do Banner do App (PWA)"
                  description="Faixa que convida o cliente a instalar o aplicativo."
                  fallback="#00B5AD"
                />
              </div>
            )}

          </div>

        </div>

        {/* RIGHT COLUMN: LIVE REAL-TIME STORE SIMULATOR (6 Cols) */}
        <div className="xl:col-span-6 2xl:col-span-6 sticky top-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
            
            {/* Header Controls for Live Simulator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Demonstração na Loja em Tempo Real
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Reflete instantaneamente cada ajuste de cor aplicado.
                </p>
              </div>

              {/* View Switchers */}
              <div className="flex items-center gap-2">
                {/* Device Selector */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    title="Visualização Desktop"
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      previewDevice === "desktop"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    title="Visualização Celular"
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      previewDevice === "mobile"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile
                  </button>
                </div>

                {/* Open Real Store Button */}
                <a
                  href={`/${storeSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Abrir Loja Real em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Page View Tabs */}
            <div className="flex items-center gap-1.5 mb-3 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setPreviewPage("home")}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                  previewPage === "home" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🏠 Página Inicial
              </button>
              <button
                type="button"
                onClick={() => setPreviewPage("product")}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                  previewPage === "product" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🛍️ Card / Oferta
              </button>
              <button
                type="button"
                onClick={() => setPreviewPage("cart")}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${
                  previewPage === "cart" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🛒 Cesta & Checkout
              </button>
            </div>

            {/* Mockup Frame Canvas */}
            <div className="bg-slate-900/5 rounded-2xl p-2 md:p-3 border border-slate-200/80 shadow-inner">
              
              {/* Browser Window Bar */}
              <div className="bg-slate-200/90 rounded-t-xl px-3 py-1.5 flex items-center gap-2 border-b border-slate-300/70">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
                <div className="bg-white rounded-md px-3 py-0.5 text-[10px] text-slate-600 font-mono flex-1 text-center truncate shadow-2xs font-semibold">
                  farmaciasassociadas.com.br/{storeSlug}
                </div>
              </div>

              {/* Scrollable Canvas */}
              <div
                className={`overflow-hidden shadow-lg border border-slate-200 flex flex-col transition-all duration-300 max-h-[640px] overflow-y-auto scrollbar-thin relative ${
                  previewDevice === "mobile" ? "max-w-[340px] mx-auto rounded-b-xl" : "w-full rounded-b-xl"
                }`}
                style={{ backgroundColor: getColor("--background", "#FFFFFF") }}
              >
                
                {/* 1. TOP ANNOUNCEMENT BAR */}
                <div
                  className="py-1 px-3 text-center text-[10px] font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs"
                  style={{
                    backgroundColor: getColor("--topbar-bg", "#F37021"),
                    color: getColor("--topbar-text", "#FFFFFF")
                  }}
                >
                  <span className="truncate flex items-center gap-1.5 mx-auto">
                    <MotorcycleIcon 
                      className="w-3.5 h-3.5 shrink-0" 
                      style={{ color: getColor("--topbar-icon", "#FFFFFF") }}
                    />
                    <span>RECEBA EM CASA: Entrega Expressa | Cupom: 10OFF</span>
                  </span>
                </div>

                {/* 2. MAIN HEADER */}
                <div
                  className="px-3.5 py-2.5 flex flex-col gap-2 transition-colors border-b border-black/5"
                  style={{ backgroundColor: getColor("--header-bg", "#00B5AD") }}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-2 shrink-0">
                      {currentPharmacy?.logoUrl ? (
                        <img src={currentPharmacy.logoUrl} alt="Logo" className="h-6 max-w-[120px] object-contain" />
                      ) : (
                        <div
                          className="font-black text-[11px] tracking-tight flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-black/10 shadow-xs"
                          style={{ color: getColor("--header-text", "#FFFFFF") }}
                        >
                          <Store className="w-3.5 h-3.5" style={{ color: getColor("--header-icons", "#F37021") }} />
                          <span className="uppercase truncate max-w-[130px] font-black">
                            {currentPharmacy?.nome || "FARMÁCIAS ASSOCIADAS"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Desktop Search Bar */}
                    {previewDevice === "desktop" && (
                      <div
                        className="h-7 flex-1 max-w-xs rounded-full flex items-center px-3 text-xs shadow-xs transition-colors border bg-white"
                        style={{
                          backgroundColor: getColor("--search-bg", "#FFFFFF"),
                          borderColor: getColor("--search-border", "#E2E8F0"),
                        }}
                      >
                        <Search 
                          className="w-3 h-3 mr-2 shrink-0" 
                          style={{ color: getColor("--search-icon", "#94A3B8") }}
                        />
                        <span 
                          className="text-[10px] truncate flex-1"
                          style={{ color: getColor("--search-text", "#334155") }}
                        >
                          O que você procura hoje?
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {previewDevice === "desktop" && (
                        <div className="flex items-center gap-1 text-[9.5px] font-bold px-2 py-1 rounded-md bg-black/10" style={{ color: getColor("--header-text", "#FFFFFF") }}>
                          <User className="w-3.5 h-3.5" style={{ color: getColor("--header-icons", "#F37021") }} />
                          <span>Entrar</span>
                        </div>
                      )}

                      {/* Botão Cesta */}
                      <button
                        type="button"
                        className="relative px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10.5px] font-bold transition shadow-xs"
                        style={{
                          backgroundColor: getColor("--cart-btn-bg", "#FFFFFF"),
                          color: getColor("--cart-btn-text", "#00B5AD"),
                        }}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cesta</span>
                        <span
                          className="text-[9px] min-w-[15px] h-3.5 px-1 rounded-full flex items-center justify-center font-black"
                          style={{
                            backgroundColor: getColor("--cart-badge-bg", "#F43F5E"),
                            color: getColor("--cart-badge-text", "#FFFFFF")
                          }}
                        >
                          2
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Search */}
                  {previewDevice === "mobile" && (
                    <div
                      className="h-6 rounded-full flex items-center px-2.5 text-[10px] shadow-xs border bg-white"
                      style={{
                        backgroundColor: getColor("--search-bg", "#FFFFFF"),
                        borderColor: getColor("--search-border", "#E2E8F0"),
                      }}
                    >
                      <Search className="w-3 h-3 mr-1.5 shrink-0" style={{ color: getColor("--search-icon", "#94A3B8") }} />
                      <span className="truncate" style={{ color: getColor("--search-text", "#334155") }}>
                        Buscar medicamentos, dermocosméticos...
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. MENU CATEGORIAS */}
                <div
                  className="px-3 py-1.5 flex items-center gap-3 text-[10.5px] font-bold overflow-x-auto scrollbar-none shadow-xs border-b border-black/5"
                  style={{
                    backgroundColor: getColor("--menu-bg", "#008E88"),
                    color: getColor("--menu-text", "#FFFFFF"),
                  }}
                >
                  <div className="flex items-center gap-1 shrink-0 font-extrabold cursor-pointer">
                    <Menu className="w-3.5 h-3.5" style={{ color: getColor("--all-cats-icon", "#FFFFFF") }} />
                    <span style={{ color: getColor("--all-cats-text", "#FFFFFF") }}>Todas as Categorias</span>
                  </div>
                  <span className="opacity-40">|</span>
                  <span className="shrink-0 opacity-90 hover:opacity-100 cursor-pointer">Medicamentos</span>
                  <span className="shrink-0 opacity-90 hover:opacity-100 cursor-pointer">Dermocosméticos</span>
                  <span className="shrink-0 opacity-90 hover:opacity-100 cursor-pointer">Higiene & Beleza</span>
                  <span className="shrink-0 opacity-90 hover:opacity-100 cursor-pointer">Infantil</span>
                  <span className="shrink-0 font-extrabold flex items-center gap-1 text-amber-300">
                    <Flame className="w-3 h-3" /> Ofertas
                  </span>
                </div>

                {/* SIMULATOR BODY: PAGE SWITCHER */}
                {previewPage === "home" && (
                  <div className="p-3 space-y-4">
                    {/* Hero Promo Banner */}
                    <div
                      className="rounded-xl p-3.5 text-white flex items-center justify-between shadow-xs relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${getColor("--primary", "#00B5AD")} 0%, ${getColor("--secondary", "#F37021")} 100%)`
                      }}
                    >
                      <div className="space-y-1 z-10">
                        <span className="text-[9px] uppercase font-black tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                          Festival de Cuidados
                        </span>
                        <h4 className="text-sm font-black leading-tight">Até 40% OFF em Vitaminas</h4>
                        <button
                          type="button"
                          className="text-[10px] font-bold px-3 py-1 rounded-full shadow-sm mt-1"
                          style={{
                            backgroundColor: getColor("--btn-secondary-bg", "#F37021"),
                            color: getColor("--btn-secondary-text", "#FFFFFF")
                          }}
                        >
                          Aproveitar Oferta
                        </button>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Zap className="w-8 h-8 text-white/80" />
                      </div>
                    </div>

                    {/* Section Titles */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wide" style={{ color: getColor("--headings", "#0F172A") }}>
                          🔥 Super Ofertas da Semana
                        </h3>
                        <p className="text-[10px]" style={{ color: getColor("--section-desc", "#64748B") }}>
                          Os melhores preços selecionados pela sua filial
                        </p>
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: getColor("--primary", "#00B5AD") }}>
                        Ver todas &rarr;
                      </span>
                    </div>

                    {/* Product Cards Grid */}
                    <div className={`grid gap-2.5 ${previewDevice === "mobile" ? "grid-cols-2" : "grid-cols-3"}`}>
                      {[
                        {
                          nome: "Vitamina C 1000mg Efervescente",
                          marca: "Revigore",
                          de: 34.90,
                          por: 19.90,
                          desconto: 43,
                          tarja: "Sem Tarja",
                        },
                        {
                          nome: "Protetor Solar FPS 50 Facial",
                          marca: "Revitart Solar",
                          de: 69.90,
                          por: 49.90,
                          desconto: 28,
                          tarja: "Sem Tarja",
                        },
                        {
                          nome: "Dipirona Monoidratada 500mg",
                          marca: "Genérico",
                          de: 12.90,
                          por: 7.90,
                          desconto: 38,
                          tarja: "Sem Tarja",
                        }
                      ].slice(0, previewDevice === "mobile" ? 2 : 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white border rounded-xl p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-sm transition"
                        >
                          <div className="relative aspect-square bg-slate-50 rounded-lg p-2 flex items-center justify-center mb-1.5">
                            <span
                              className="absolute top-1 left-1 text-[8.5px] font-black px-1.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: getColor("--price-discount-badge-bg", "#F43F5E") }}
                            >
                              -{item.desconto}%
                            </span>
                            <Pill className="w-8 h-8 text-slate-300" />
                          </div>

                          <span className="text-[9px] font-bold text-slate-400 uppercase truncate">{item.marca}</span>
                          <span className="text-[11px] font-bold leading-snug line-clamp-2 text-slate-800 h-7" style={{ color: getColor("--foreground", "#1E293B") }}>
                            {item.nome}
                          </span>

                          <div className="mt-2">
                            <span className="text-[9px] line-through block" style={{ color: getColor("--price-old", "#94A3B8") }}>
                              R$ {item.de.toFixed(2)}
                            </span>
                            <span className="text-sm font-black block" style={{ color: getColor("--price-main", "#00B5AD") }}>
                              R$ {item.por.toFixed(2)}
                            </span>
                            <div 
                              className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border shadow-2xs"
                              style={{
                                backgroundColor: getColor("--coupon-badge-bg", "#EBF3FE"),
                                color: getColor("--coupon-badge-text", "#1a73e8"),
                                borderColor: getColor("--coupon-badge-border", "#d2e3fc"),
                              }}
                            >
                              <Ticket className="w-2.5 h-2.5 shrink-0" />
                              <span>R$ {(item.por * 0.9).toFixed(2)} com Cupom</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="w-full mt-2 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs"
                            style={{
                              backgroundColor: getColor("--btn-primary-bg", "#00B5AD"),
                              color: getColor("--btn-primary-text", "#FFFFFF")
                            }}
                          >
                            <ShoppingCart className="w-3 h-3" /> Adicionar
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Tarjas de Benefícios */}
                    <div
                      className="rounded-xl p-3 border grid grid-cols-3 gap-2 text-center"
                      style={{
                        backgroundColor: getColor("--tarja-bg", "#FFFFFF"),
                        color: getColor("--tarja-text", "#0F172A")
                      }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Truck className="w-4 h-4" style={{ color: getColor("--tarja-icon", "#00B5AD") }} />
                        <span className="text-[9px] font-bold leading-tight">Entrega Rápida</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Stethoscope className="w-4 h-4" style={{ color: getColor("--tarja-icon", "#00B5AD") }} />
                        <span className="text-[9px] font-bold leading-tight">Atenção Farmacêutica</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <ShieldCheck className="w-4 h-4" style={{ color: getColor("--tarja-icon", "#00B5AD") }} />
                        <span className="text-[9px] font-bold leading-tight">Compra Segura</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIMULATOR BODY: PRODUCT DETAIL */}
                {previewPage === "product" && (
                  <div className="p-3 space-y-3">
                    <div className="bg-white border rounded-xl p-3 space-y-3">
                      <div className="aspect-video bg-slate-50 rounded-lg flex items-center justify-center relative">
                        <span
                          className="absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: getColor("--price-discount-badge-bg", "#F43F5E") }}
                        >
                          OFERTA DA FILIAL
                        </span>
                        <Pill className="w-12 h-12 text-slate-300" />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">REVITART DERMO</span>
                        <h3 className="text-sm font-extrabold text-slate-900" style={{ color: getColor("--headings", "#0F172A") }}>
                          Sérum Facial Vitamina C Pura 30ml
                        </h3>
                      </div>

                      {/* Caixa de Leve + Pague */}
                      <div
                        className="p-2.5 rounded-xl border-l-4 flex items-center justify-between"
                        style={{
                          borderColor: getColor("--primary", "#00B5AD"),
                          backgroundColor: `${getColor("--primary", "#00B5AD")}10`
                        }}
                      >
                        <div>
                          <span className="text-[10px] font-black text-emerald-800 block">PROMOÇÃO LEVE + POR -</span>
                          <span className="text-xs font-black">Leve 2 por R$ 39,90 cada</span>
                        </div>
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: getColor("--secondary", "#F37021") }}
                        >
                          ECONOMIZE R$ 20
                        </span>
                      </div>

                      <div className="pt-2 border-t">
                        <span className="text-xs line-through" style={{ color: getColor("--price-old", "#94A3B8") }}>
                          R$ 59,90
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black" style={{ color: getColor("--price-main", "#00B5AD") }}>
                            R$ 44,90
                          </span>
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: getColor("--price-discount-badge-bg", "#F43F5E") }}
                          >
                            -25% OFF
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm"
                        style={{
                          backgroundColor: getColor("--btn-primary-bg", "#00B5AD"),
                          color: getColor("--btn-primary-text", "#FFFFFF")
                        }}
                      >
                        <ShoppingBag className="w-4 h-4" /> Comprar Agora
                      </button>
                    </div>
                  </div>
                )}

                {/* SIMULATOR BODY: CART */}
                {previewPage === "cart" && (
                  <div className="p-3 space-y-3">
                    <div className="bg-white border rounded-xl p-3 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <h4 className="text-xs font-black uppercase text-slate-800">Sua Cesta (2 itens)</h4>
                        <span className="text-[10px] font-bold text-slate-500">Filial Associadas</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">Subtotal</span>
                          <span className="font-bold">R$ 64,80</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">Descontos da Loja</span>
                          <span className="font-bold text-emerald-600">- R$ 15,00</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-black pt-2 border-t">
                          <span>Total</span>
                          <span className="text-sm font-black" style={{ color: getColor("--price-main", "#00B5AD") }}>
                            R$ 49,80
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm"
                        style={{
                          backgroundColor: getColor("--btn-primary-bg", "#00B5AD"),
                          color: getColor("--btn-primary-text", "#FFFFFF")
                        }}
                      >
                        Finalizar Pedido na Loja
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. FOOTER SIMULATION */}
                <div
                  className="p-3.5 space-y-3 text-white text-[10px]"
                  style={{
                    backgroundColor: getColor("--footer-bg", "#00B5AD"),
                    color: getColor("--footer-text", "#FFFFFF")
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs">{currentPharmacy?.nome || "FARMÁCIAS ASSOCIADAS"}</span>
                    <div className="flex items-center gap-1.5">
                      {["IG", "FB", "WA"].map((s, idx) => (
                        <span
                          key={idx}
                          className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[8px]"
                          style={{
                            backgroundColor: getColor("--social-icons-bg", "#FFFFFF"),
                            color: getColor("--social-icons", "#00B5AD")
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* PWA App Banner inside Footer */}
                  <div
                    className="p-2 rounded-lg flex items-center justify-between gap-2 shadow-xs"
                    style={{
                      backgroundColor: `${getColor("--footer-bottom-bg", "#008E88")}`,
                      color: getColor("--footer-text", "#FFFFFF")
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span className="font-bold text-[9.5px]">Instale o App da Loja</span>
                    </div>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded text-[9px] font-black"
                      style={{
                        backgroundColor: getColor("--pwa-banner-btn-bg", "#FFFFFF"),
                        color: getColor("--pwa-banner-btn-text", "#00B5AD")
                      }}
                    >
                      Instalar
                    </button>
                  </div>

                  <div className="text-[9px] opacity-75 text-center border-t border-white/10 pt-2">
                    &copy; 2026 {currentPharmacy?.nome || "Farmácias Associadas"}. Todos os direitos reservados.
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
