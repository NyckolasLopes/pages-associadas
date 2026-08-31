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
  ChevronDown,
  ChevronRight,
  Monitor,
  Store,
  Search,
  ShoppingCart,
  Check,
  Smartphone,
  LayoutTemplate,
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
  Tag,
  Clock,
  ArrowRight,
  CreditCard,
  Mail,
  Send,
  Lock,
} from "lucide-react";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { MotorcycleIcon } from "@/components/ui/motorcycle-icon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { safeSlugify } from "@/hooks/useActivePharmacy";

export interface ColorPreset {
  id: string;
  name: string;
  stripes: [string, string, string, string, string, string];
  colors: Record<string, string>;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "associadas-oficial",
    name: "Associadas Oficial (Teal & Laranja)",
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
      "--header-icons": "#FFFFFF",
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
    id: "violet-magenta",
    name: "Violeta & Magenta Moderno",
    stripes: ["#705BC2", "#FE509C", "#FFFFFF", "#5F4BB6", "#1E1B4B", "#199965"],
    colors: {
      "--primary": "#705BC2",
      "--primary-foreground": "#FFFFFF",
      "--btn-primary-bg": "#199965",
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
      "--cart-badge-bg": "#199965",
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
    id: "indigo-cyan",
    name: "Índigo & Ciano Elétrico",
    stripes: ["#6366F1", "#06B6D4", "#FFFFFF", "#4F46E5", "#1E1B4B", "#EC4899"],
    colors: {
      "--primary": "#6366F1",
      "--primary-foreground": "#FFFFFF",
      "--btn-primary-bg": "#6366F1",
      "--btn-primary-text": "#FFFFFF",
      "--secondary": "#06B6D4",
      "--secondary-foreground": "#FFFFFF",
      "--btn-secondary-bg": "#06B6D4",
      "--btn-secondary-text": "#FFFFFF",
      "--accent": "#EC4899",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--headings": "#1E1B4B",
      "--section-desc": "#64748B",
      "--header-bg": "#6366F1",
      "--header-icons": "#FFFFFF",
      "--header-text": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--search-text": "#334155",
      "--search-icon": "#6366F1",
      "--search-border": "#E0E7FF",
      "--cart-btn-bg": "#06B6D4",
      "--cart-btn-text": "#FFFFFF",
      "--cart-badge-bg": "#EC4899",
      "--cart-badge-text": "#FFFFFF",
      "--topbar-bg": "#4F46E5",
      "--topbar-icon": "#06B6D4",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#4F46E5",
      "--menu-text": "#FFFFFF",
      "--all-cats-icon": "#06B6D4",
      "--all-cats-text": "#FFFFFF",
      "--price-main": "#6366F1",
      "--price-old": "#94A3B8",
      "--price-discount-badge-bg": "#EC4899",
      "--price-discount-badge-text": "#FFFFFF",
      "--tarja-bg": "#EEF2FF",
      "--tarja-icon": "#6366F1",
      "--tarja-text": "#1E1B4B",
      "--news-bg": "#EEF2FF",
      "--news-text": "#1E1B4B",
      "--news-input-bg": "#FFFFFF",
      "--news-input-text": "#1E293B",
      "--news-input-border": "#C7D2FE",
      "--news-btn-bg": "#6366F1",
      "--news-btn-text": "#FFFFFF",
      "--footer-bg": "#1E1B4B",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#6366F1",
      "--social-icons-bg": "#FFFFFF",
      "--footer-bottom-bg": "#0F0E2A",
      "--footer-bottom-text": "#C7D2FE",
      "--institutional-bg": "#6366F1",
      "--pwa-banner-bg": "#6366F1",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#6366F1",
    }
  },
  {
    id: "emerald-mint",
    name: "Esmeralda & Menta Natural",
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
    id: "ruby-red",
    name: "Rubi & Vermelho Saúde",
    stripes: ["#DC2626", "#EF4444", "#FFFFFF", "#B91C1C", "#7F1D1D", "#F97316"],
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
  const { saveConfig } = useConfig();
  const effectiveStoreId = storeId || admin.activeStoreId;
  const currentPharmacy = admin.pharmacies.find((p) => p.id === effectiveStoreId);

  const isGlobal = admin.currentUser?.proprietario || 
    admin.grupos?.find(g => g.id === admin.currentUser?.grupoId)?.permissao_total || 
    admin.currentUser?.lojasVinculadas === undefined || false;

  const isPleno = currentPharmacy?.categoriaAssociado === 'Pleno' || currentPharmacy?.isPleno === true;

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
    "--header-icons": "#FFFFFF",
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
    if (isPleno) return defaultTheme;
    const savedColors = currentPharmacy?.themeColors;
    if (savedColors && typeof savedColors === 'object' && Object.keys(savedColors).length > 0) {
      return { ...defaultTheme, ...savedColors };
    }
    return defaultTheme;
  });

  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [showPresets, setShowPresets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isPleno) {
      setColors(defaultTheme);
    } else if (currentPharmacy?.themeColors && Object.keys(currentPharmacy.themeColors).length > 0) {
      setColors({ ...defaultTheme, ...currentPharmacy.themeColors });
    } else {
      setColors(defaultTheme);
    }
  }, [currentPharmacy, defaultTheme, isPleno]);

  const getColor = (key: string, fallback: string) => {
    return colors[key] || colors[`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] || colors[key.replace(/^--/, '')] || fallback;
  };

  const updateColor = (key: string, value: string) => {
    if (isPleno) return;
    setColors(prev => {
      const updated = { ...prev, [key]: value };
      if (key.startsWith('--')) {
        const camel = key.replace(/^--/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        updated[camel] = value;
      } else {
        const kebab = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        updated[kebab] = value;
      }
      return updated;
    });
  };

  const applyPreset = (preset: ColorPreset) => {
    if (isPleno) return;
    setColors(prev => ({
      ...prev,
      ...preset.colors
    }));
    toast.success(`Paleta "${preset.name}" selecionada! Clique em Salvar para aplicar.`);
  };

  const handleResetToDefault = () => {
    if (isPleno) return;
    setColors(defaultTheme);
    toast.info("Cores restauradas para o padrão oficial das Farmácias Associadas.");
  };

  const handleSave = async () => {
    if (!effectiveStoreId) {
      toast.error("Nenhuma farmácia selecionada.");
      return;
    }

    if (isPleno) {
      toast.info("Lojas da categoria Pleno utilizam exclusivamente as cores oficiais da rede.");
      return;
    }

    setIsSaving(true);
    try {
      if (currentPharmacy) {
        await admin.updatePharmacy(effectiveStoreId, {
          ...currentPharmacy,
          themeColors: colors,
        });
      }

      toast.success("Cores salvas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar cores: " + (err.message || "Tente novamente"));
    } finally {
      setIsSaving(false);
    }
  };

  const currentStripes = useMemo(() => [
    getColor("--primary", "#00B5AD"),
    getColor("--secondary", "#F37021"),
    getColor("--header-bg", "#00B5AD"),
    getColor("--topbar-bg", "#F37021"),
    getColor("--menu-bg", "#008E88"),
    getColor("--footer-bg", "#00B5AD"),
  ], [colors]);

  const ColorRow = ({
    label,
    description,
    value,
    onChange,
  }: {
    label: string;
    description: string;
    value: string;
    onChange: (val: string) => void;
  }) => {
    return (
      <div className={`flex items-start justify-between gap-4 p-2 rounded-lg transition ${isPleno ? 'opacity-70 bg-slate-50/50 cursor-not-allowed' : 'hover:bg-slate-50/80'}`}>
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-full border border-slate-300 shadow-sm shrink-0 mt-0.5 transition-colors"
            style={{ backgroundColor: value || "#000000" }}
          />
          <div className="min-w-0 flex-1">
            <Label className="text-xs font-bold text-slate-800 block">{label}</Label>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Input
            type="color"
            disabled={isPleno}
            className="w-9 h-8 p-0.5 cursor-pointer rounded-md border-slate-200 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            value={value || "#000000"}
            onChange={(e) => !isPleno && onChange(e.target.value)}
          />
          <Input
            type="text"
            disabled={isPleno}
            className="font-mono uppercase w-24 h-8 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            value={value || "#000000"}
            onChange={(e) => !isPleno && onChange(e.target.value)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {showStoreSelector && !storeId && <StoreSelector hidePlenoForNonAdmin={true} />}

      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-600" />
            {title}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isPleno ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3.5 py-2 rounded-lg shadow-sm">
              <Lock className="w-4 h-4 text-amber-700" />
              Somente Visualização (Cores da Rede)
            </span>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleResetToDefault}
                size="sm"
                className="text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrão
              </Button>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </>
          )}
        </div>
      </div>

      {isPleno && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950 shadow-sm">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Farmácia Categoria Pleno — Visualização das Cores da Rede</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Esta filial pertence à categoria Pleno e utiliza exclusivamente a identidade visual oficial da rede Farmácias Associadas. As cores estão disponíveis somente para visualização.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-200 text-amber-900 text-xs font-black uppercase rounded-full shrink-0 w-fit">
            Somente Leitura
          </span>
        </div>
      )}

      {/* Main Grid: Controls + Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Preset Strip + Granular Accordions (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Card 1: Paleta Atual & Predefinições */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Paleta de Cores
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Visão geral das cores principais em uso</p>
              </div>
              {!isPleno && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-xs"
                  onClick={() => setShowPresets(!showPresets)}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                  {showPresets ? "Ocultar predefinições" : "Escolher outra paleta"}
                </Button>
              )}
            </div>

            {/* Current Palette Stripe Bar */}

            {/* Current Palette Stripe Bar */}
            <div className="h-14 w-full rounded-xl overflow-hidden shadow-inner flex border border-slate-200">
              {currentStripes.map((color, index) => (
                <div
                  key={index}
                  className="flex-1 h-full transition-colors relative group cursor-default"
                  style={{ backgroundColor: color }}
                  title={`Cor ${index + 1}: ${color}`}
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow-md">
                    {color}
                  </span>
                </div>
              ))}
            </div>

            {/* Presets Grid Dropdown */}
            {showPresets && (
              <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                  Outras Predefinições (Clique para aplicar)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="flex flex-col p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all bg-slate-50/50 hover:bg-white text-left group"
                    >
                      <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition truncate mb-2">
                        {preset.name}
                      </span>
                      <div className="h-8 w-full rounded-lg overflow-hidden flex shadow-inner border border-slate-200">
                        {preset.stripes.map((hex, sIndex) => (
                          <div key={sIndex} className="flex-1 h-full" style={{ backgroundColor: hex }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Accordions de Edição Granular */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" /> Configuração Granular de Cores
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Altere valores individuais de cada elemento da loja em tempo real.
              </p>
            </div>

            <Accordion type="multiple" defaultValue={["gerais-fundo", "informacao-destaque", "cabecalho", "carrinho-cesta", "produtos-botoes"]} className="w-full">
              
              {/* 1. Fundo da Loja e Estrutura Geral */}
              <AccordionItem value="gerais-fundo" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--background", "#FFFFFF") }} />
                    Fundo da Loja e Estrutura Geral
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo da loja"
                    description="Cor de fundo principal do site (Geralmente branco #FFFFFF ou cinza bem claro)."
                    value={getColor("--background", "#FFFFFF")}
                    onChange={(v) => updateColor("--background", v)}
                  />
                  <ColorRow
                    label="Texto Base"
                    description="Cor principal para os textos gerais e parágrafos do site."
                    value={getColor("--foreground", "#1E293B")}
                    onChange={(v) => updateColor("--foreground", v)}
                  />
                  <ColorRow
                    label="Títulos"
                    description="Cor dos títulos das seções, vitrines e blocos principais (ex: 'Compre por categoria', 'Super Ofertas')."
                    value={getColor("--headings", "#0F172A")}
                    onChange={(v) => updateColor("--headings", v)}
                  />
                  <ColorRow
                    label="Título da descrição"
                    description="Cor de subtítulos, descrições secundárias e textos informativos das seções."
                    value={getColor("--section-desc", "#64748B")}
                    onChange={(v) => updateColor("--section-desc", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 2. Informação Destaque (Topo da Página) */}
              <AccordionItem value="informacao-destaque" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--topbar-bg", "#F37021") }} />
                    Informação Destaque (Topo da Página)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo da informação destaque"
                    description="Cor de fundo da barra de avisos/cupons no topo da página."
                    value={getColor("--topbar-bg", "#F37021")}
                    onChange={(v) => updateColor("--topbar-bg", v)}
                  />
                  <ColorRow
                    label="Ícone da informação"
                    description="Cor do ícone de entrega/motoqueiro na barra de destaque do topo."
                    value={getColor("--topbar-icon", "#FFFFFF")}
                    onChange={(v) => updateColor("--topbar-icon", v)}
                  />
                  <ColorRow
                    label="Texto da informação"
                    description="Cor do texto com o cupom ou aviso no topo da página."
                    value={getColor("--topbar-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--topbar-text", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 3. Cabeçalho da Loja */}
              <AccordionItem value="cabecalho" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--header-bg", "#00B5AD") }} />
                    Cabeçalho da Loja
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo do cabeçalho"
                    description="Cor de fundo da barra principal do cabeçalho."
                    value={getColor("--header-bg", "#00B5AD")}
                    onChange={(v) => updateColor("--header-bg", v)}
                  />
                  <ColorRow
                    label="Ícones do cabeçalho"
                    description="Cor dos ícones de usuário, localização e favoritos no cabeçalho."
                    value={getColor("--header-icons", "#FFFFFF")}
                    onChange={(v) => updateColor("--header-icons", v)}
                  />
                  <ColorRow
                    label="Texto do cabeçalho"
                    description="Cor dos textos e rótulos de informações dentro do cabeçalho."
                    value={getColor("--header-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--header-text", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 4. Busca */}
              <AccordionItem value="busca" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--search-bg", "#FFFFFF") }} />
                    Barra de Busca
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo da busca"
                    description="Cor de fundo do campo de busca de produtos."
                    value={getColor("--search-bg", "#FFFFFF")}
                    onChange={(v) => updateColor("--search-bg", v)}
                  />
                  <ColorRow
                    label="Texto da busca"
                    description="Cor do texto digitado e do placeholder no campo de pesquisa."
                    value={getColor("--search-text", "#334155")}
                    onChange={(v) => updateColor("--search-text", v)}
                  />
                  <ColorRow
                    label="Ícone da busca"
                    description="Cor do ícone da lupa dentro do campo de busca."
                    value={getColor("--search-icon", "#94A3B8")}
                    onChange={(v) => updateColor("--search-icon", v)}
                  />
                  <ColorRow
                    label="Borda da busca"
                    description="Cor da borda do campo de busca."
                    value={getColor("--search-border", "#E2E8F0")}
                    onChange={(v) => updateColor("--search-border", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 5. Carrinho / CESTA */}
              <AccordionItem value="carrinho-cesta" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--cart-badge-bg", "#F43F5E") }} />
                    Botão CESTA e Quantidade do Carrinho
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Cor do botão CESTA"
                    description="Cor de fundo do botão da Cesta / Carrinho no cabeçalho."
                    value={getColor("--cart-btn-bg", "#FFFFFF")}
                    onChange={(v) => updateColor("--cart-btn-bg", v)}
                  />
                  <ColorRow
                    label="Texto/Ícone do botão CESTA"
                    description="Cor do ícone da cesta e do texto 'Cesta' no botão."
                    value={getColor("--cart-btn-text", "#00B5AD")}
                    onChange={(v) => updateColor("--cart-btn-text", v)}
                  />
                  <ColorRow
                    label="Quantidade do carrinho (Fundo do badge)"
                    description="Cor de fundo do selo com a quantidade de itens no carrinho."
                    value={getColor("--cart-badge-bg", "#F43F5E")}
                    onChange={(v) => updateColor("--cart-badge-bg", v)}
                  />
                  <ColorRow
                    label="Número quantidade do carrinho"
                    description="Cor do número indicativo da quantidade de itens dentro do selo."
                    value={getColor("--cart-badge-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--cart-badge-text", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 6. Menu e Navegação */}
              <AccordionItem value="menu-navegacao" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--menu-bg", "#008E88") }} />
                    Menu e Categorias
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo do menu"
                    description="Cor da barra de categorias principal do site."
                    value={getColor("--menu-bg", "#008E88")}
                    onChange={(v) => updateColor("--menu-bg", v)}
                  />
                  <ColorRow
                    label="Texto do menu (incluído ícones)"
                    description="Cor dos títulos de categorias e seus ícones na barra de navegação."
                    value={getColor("--menu-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--menu-text", v)}
                  />
                  <ColorRow
                    label="Ícone todas as categorias"
                    description="Cor do ícone do menu 'Todas as categorias'."
                    value={getColor("--all-cats-icon", "#FFFFFF")}
                    onChange={(v) => updateColor("--all-cats-icon", v)}
                  />
                  <ColorRow
                    label="Texto todas as categorias"
                    description="Cor do texto 'Todas as categorias' no início do menu."
                    value={getColor("--all-cats-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--all-cats-text", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 7. Produtos, Preços e Botões */}
              <AccordionItem value="produtos-botoes" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--btn-primary-bg", "#00B5AD") }} />
                    Produtos, Preços e Botões
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Botões (Fundo do botão Comprar)"
                    description="Cor de fundo dos botões principais de compra nos cards de produtos."
                    value={getColor("--btn-primary-bg", getColor("--primary", "#00B5AD"))}
                    onChange={(v) => {
                      updateColor("--btn-primary-bg", v);
                      updateColor("--primary", v);
                    }}
                  />
                  <ColorRow
                    label="Texto dos botões"
                    description="Cor do texto 'COMPRAR' e ícone dentro dos botões de compra."
                    value={getColor("--btn-primary-text", getColor("--primary-foreground", "#FFFFFF"))}
                    onChange={(v) => {
                      updateColor("--btn-primary-text", v);
                      updateColor("--primary-foreground", v);
                    }}
                  />
                  <ColorRow
                    label="Preço principal"
                    description="Cor do valor promocional de venda dos produtos em destaque."
                    value={getColor("--price-main", "#00B5AD")}
                    onChange={(v) => updateColor("--price-main", v)}
                  />
                  <ColorRow
                    label="Preço 'De:' (Riscado)"
                    description="Cor do preço original riscado antes do desconto."
                    value={getColor("--price-old", "#94A3B8")}
                    onChange={(v) => updateColor("--price-old", v)}
                  />
                  <ColorRow
                    label="Selo de Desconto (Fundo)"
                    description="Cor de fundo da tag com percentual de desconto (-30%)."
                    value={getColor("--price-discount-badge-bg", "#F43F5E")}
                    onChange={(v) => updateColor("--price-discount-badge-bg", v)}
                  />
                  <ColorRow
                    label="Selo de Desconto (Texto)"
                    description="Cor do texto dentro da tag de desconto."
                    value={getColor("--price-discount-badge-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--price-discount-badge-text", v)}
                  />
                  <ColorRow
                    label="Botões Secundários (Fundo)"
                    description="Cor de fundo de botões secundários (filtros, detalhes, voltar)."
                    value={getColor("--btn-secondary-bg", getColor("--secondary", "#F37021"))}
                    onChange={(v) => {
                      updateColor("--btn-secondary-bg", v);
                      updateColor("--secondary", v);
                    }}
                  />
                  <ColorRow
                    label="Texto dos botões secundários"
                    description="Cor do texto dentro dos botões secundários."
                    value={getColor("--btn-secondary-text", getColor("--secondary-foreground", "#FFFFFF"))}
                    onChange={(v) => {
                      updateColor("--btn-secondary-text", v);
                      updateColor("--secondary-foreground", v);
                    }}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 8. Banners de Tarja (Diferenciais) */}
              <AccordionItem value="banners-tarja" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--tarja-icon", "#00B5AD") }} />
                    Banners de Tarja (Diferenciais da Loja)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo do banner de tarja"
                    description="Cor de fundo da seção de diferenciais da loja."
                    value={getColor("--tarja-bg", "#FFFFFF")}
                    onChange={(v) => updateColor("--tarja-bg", v)}
                  />
                  <ColorRow
                    label="Cor dos ícones dos banners de tarja"
                    description="Cor dos ícones representativos (entrega, retirada, procedência, ofertas)."
                    value={getColor("--tarja-icon", "#00B5AD")}
                    onChange={(v) => updateColor("--tarja-icon", v)}
                  />
                  <ColorRow
                    label="Texto do banner de tarja"
                    description="Cor dos títulos e descrições dos diferenciais da loja."
                    value={getColor("--tarja-text", "#0F172A")}
                    onChange={(v) => updateColor("--tarja-text", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 9. Newsletter */}
              <AccordionItem value="newsletter" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--news-bg", "#F8FAFC") }} />
                    Newsletter
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo da newsletter"
                    description="Cor de fundo do bloco de captura de e-mails da newsletter."
                    value={getColor("--news-bg", "#F8FAFC")}
                    onChange={(v) => updateColor("--news-bg", v)}
                  />
                  <ColorRow
                    label="Texto da newsletter"
                    description="Cor do título e texto de chamada da newsletter."
                    value={getColor("--news-text", "#0F172A")}
                    onChange={(v) => updateColor("--news-text", v)}
                  />
                  <ColorRow
                    label="Caixa newsletter (Fundo)"
                    description="Cor de fundo do campo de digitação do e-mail."
                    value={getColor("--news-input-bg", "#FFFFFF")}
                    onChange={(v) => updateColor("--news-input-bg", v)}
                  />
                  <ColorRow
                    label="Texto caixa newsletter"
                    description="Cor do texto digitado e do placeholder no campo da newsletter."
                    value={getColor("--news-input-text", "#1E293B")}
                    onChange={(v) => updateColor("--news-input-text", v)}
                  />
                  <ColorRow
                    label="Borda caixa newsletter"
                    description="Cor da borda do campo de digitação do e-mail."
                    value={getColor("--news-input-border", "#CBD5E1")}
                    onChange={(v) => updateColor("--news-input-border", v)}
                  />
                  <ColorRow
                    label="Botão newsletter (Fundo)"
                    description="Cor de fundo do botão 'Cadastrar' da newsletter."
                    value={getColor("--news-btn-bg", "#00B5AD")}
                    onChange={(v) => updateColor("--news-btn-bg", v)}
                  />
                  <ColorRow
                    label="Texto botão newsletter"
                    description="Cor do texto do botão 'Cadastrar' da newsletter."
                    value={getColor("--news-btn-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--news-btn-text", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 10. Rodapé Principal */}
              <AccordionItem value="rodape" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--footer-bg", "#00B5AD") }} />
                    Rodapé Principal e Redes Sociais
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo do rodapé"
                    description="Cor de fundo da área principal do rodapé."
                    value={getColor("--footer-bg", "#00B5AD")}
                    onChange={(v) => updateColor("--footer-bg", v)}
                  />
                  <ColorRow
                    label="Texto do rodapé"
                    description="Cor dos textos informativos, links e títulos no rodapé."
                    value={getColor("--footer-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--footer-text", v)}
                  />
                  <ColorRow
                    label="Social do rodapé (Fundo dos ícones)"
                    description="Cor do círculo de fundo dos ícones de redes sociais."
                    value={getColor("--social-icons-bg", "#FFFFFF")}
                    onChange={(v) => updateColor("--social-icons-bg", v)}
                  />
                  <ColorRow
                    label="Ícones do social do rodapé"
                    description="Cor dos ícones de redes sociais (Instagram, Facebook, WhatsApp)."
                    value={getColor("--social-icons", "#00B5AD")}
                    onChange={(v) => updateColor("--social-icons", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 11. Rodapé Inferior */}
              <AccordionItem value="rodape-inferior" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--footer-bottom-bg", "#008E88") }} />
                    Rodapé Inferior (Dados da Loja & Copyright)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo do rodapé inferior"
                    description="Cor de fundo da faixa inferior com CNPJ, endereço e direitos reservados."
                    value={getColor("--footer-bottom-bg", "#008E88")}
                    onChange={(v) => updateColor("--footer-bottom-bg", v)}
                  />
                  <ColorRow
                    label="Texto do rodapé inferior"
                    description="Cor do texto com os dados da empresa e direitos autorais."
                    value={getColor("--footer-bottom-text", "#E2E8F0")}
                    onChange={(v) => updateColor("--footer-bottom-text", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 12. Balão PWA */}
              <AccordionItem value="balao-pwa" className="px-6">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    Balão de Instalar Aplicativo (PWA)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo do Balão do App"
                    description="Cor de fundo do card flutuante de instalação do app no celular."
                    value={getColor("--pwa-banner-bg", "#00B5AD")}
                    onChange={(v) => updateColor("--pwa-banner-bg", v)}
                  />
                  <ColorRow
                    label="Texto do Balão do App"
                    description="Cor do texto explicativo dentro do balão."
                    value={getColor("--pwa-banner-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--pwa-banner-text", v)}
                  />
                  <ColorRow
                    label="Fundo do Botão de Instalar"
                    description="Cor de fundo do botão de ação de instalar."
                    value={getColor("--pwa-banner-btn-bg", "#FFFFFF")}
                    onChange={(v) => updateColor("--pwa-banner-btn-bg", v)}
                  />
                  <ColorRow
                    label="Texto do Botão de Instalar"
                    description="Cor do texto dentro do botão de instalar."
                    value={getColor("--pwa-banner-btn-text", "#00B5AD")}
                    onChange={(v) => updateColor("--pwa-banner-btn-text", v)}
                  />
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        </div>

        {/* Right Column: Live Mockup Preview (5 Cols) */}
        <div className="xl:col-span-5 sticky top-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-600" /> Demonstração na Loja em Tempo Real
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Visualização fiel e correspondente com todos os elementos da sua loja.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
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
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    previewDevice === "mobile"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            </div>

            {/* Storefront Mockup Container */}
            <div className="bg-slate-900/5 rounded-2xl p-2.5 md:p-3 border border-slate-200/80 shadow-inner">
              
              {/* Browser Window Chrome */}
              <div className="bg-slate-200/80 rounded-t-xl px-3 py-1.5 flex items-center gap-2 border-b border-slate-300/60">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
                <div className="bg-white rounded-md px-3 py-0.5 text-[10px] text-slate-500 font-mono flex-1 text-center truncate shadow-2xs">
                  https://farmaciasassociadas.com.br/{safeSlugify(currentPharmacy?.nome || "loja")}
                </div>
              </div>

              {/* Scrollable Store Canvas */}
              <div
                className={`overflow-hidden shadow-lg border border-slate-200 flex flex-col transition-all duration-300 max-h-[640px] overflow-y-auto scrollbar-thin ${
                  previewDevice === "mobile" ? "max-w-[360px] mx-auto rounded-b-xl" : "w-full rounded-b-xl"
                }`}
                style={{ backgroundColor: getColor("--background", "#FFFFFF") }}
              >
                {/* 1. TOP ANNOUNCEMENT BAR */}
                <div
                  className="py-1 px-3 text-center text-[10px] font-bold transition-colors flex items-center justify-between gap-2 shadow-2xs"
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
                    <span>RECEBER EM CASA: Entrega Expressa | Cupom: 10OFF</span>
                  </span>
                </div>

                {/* 2. MAIN HEADER */}
                <div
                  className="px-3.5 py-2.5 flex flex-col gap-2 transition-colors border-b border-black/5"
                  style={{ backgroundColor: getColor("--header-bg", "#00B5AD") }}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Brand / Store Logo */}
                    <div className="flex items-center gap-2 shrink-0">
                      {currentPharmacy?.logoUrl ? (
                        <img src={currentPharmacy.logoUrl} alt="Logo" className="h-6 max-w-[120px] object-contain" />
                      ) : (
                        <div
                          className="font-black text-xs tracking-tight flex items-center gap-1.5 py-0.5 px-2 rounded-md bg-black/10"
                          style={{ color: getColor("--header-text", "#FFFFFF") }}
                        >
                          <Store className="w-3.5 h-3.5" style={{ color: getColor("--header-icons", "#FFFFFF") }} />
                          <span className="uppercase truncate max-w-[140px]">{currentPharmacy?.nome || "FARMÁCIAS ASSOCIADAS"}</span>
                        </div>
                      )}
                    </div>

                    {/* Desktop Search Bar */}
                    {previewDevice === "desktop" && (
                      <div
                        className="h-8 flex-1 max-w-sm rounded-full flex items-center px-3 text-xs shadow-xs transition-colors border"
                        style={{
                          backgroundColor: getColor("--search-bg", "#FFFFFF"),
                          borderColor: getColor("--search-border", "#E2E8F0"),
                        }}
                      >
                        <Search 
                          className="w-3.5 h-3.5 mr-2 shrink-0" 
                          style={{ color: getColor("--search-icon", "#94A3B8") }}
                        />
                        <span 
                          className="text-[11px] truncate"
                          style={{ color: getColor("--search-text", "#334155") }}
                        >
                          Buscar medicamentos e cosméticos...
                        </span>
                      </div>
                    )}

                    {/* Store Header Actions */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {previewDevice === "desktop" && (
                        <div
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-white/15"
                          style={{ color: getColor("--header-text", "#FFFFFF") }}
                        >
                          <MapPin className="w-3 h-3" style={{ color: getColor("--header-icons", "#FFFFFF") }} />
                          <span className="truncate max-w-[90px]">Filial Matriz</span>
                        </div>
                      )}
                      
                      <div
                        className="p-1 rounded-full hover:bg-white/10 cursor-pointer"
                        style={{ color: getColor("--header-icons", "#FFFFFF") }}
                      >
                        <User className="w-4 h-4" />
                      </div>

                      {/* Botão CESTA com Quantidade */}
                      <button
                        type="button"
                        className="relative px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold transition shadow-xs"
                        style={{
                          backgroundColor: getColor("--cart-btn-bg", "#FFFFFF"),
                          color: getColor("--cart-btn-text", "#00B5AD"),
                        }}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cesta</span>
                        <span
                          className="text-[8px] min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center font-black ml-0.5"
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

                  {/* Mobile Search Bar */}
                  {previewDevice === "mobile" && (
                    <div
                      className="h-7 rounded-full flex items-center px-3 text-xs shadow-xs transition-colors border"
                      style={{
                        backgroundColor: getColor("--search-bg", "#FFFFFF"),
                        borderColor: getColor("--search-border", "#E2E8F0"),
                      }}
                    >
                      <Search 
                        className="w-3.5 h-3.5 mr-2 shrink-0" 
                        style={{ color: getColor("--search-icon", "#94A3B8") }}
                      />
                      <span 
                        className="text-[10px] truncate"
                        style={{ color: getColor("--search-text", "#334155") }}
                      >
                        Buscar medicamentos, genéricos...
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. CATEGORY NAVIGATION MENU */}
                <div
                  className="px-3 py-1.5 flex items-center gap-4 overflow-x-auto text-[10px] font-bold whitespace-nowrap scrollbar-none transition-colors shadow-xs"
                  style={{
                    backgroundColor: getColor("--menu-bg", "#008E88"),
                    color: getColor("--menu-text", "#FFFFFF")
                  }}
                >
                  <span 
                    className="flex items-center gap-1 opacity-100 font-extrabold border-b-2 border-white pb-0.5 cursor-pointer"
                    style={{ color: getColor("--all-cats-text", "#FFFFFF") }}
                  >
                    <Menu className="w-3 h-3" style={{ color: getColor("--all-cats-icon", "#FFFFFF") }} />
                    Todas as Categorias
                  </span>
                  <span className="opacity-90 hover:opacity-100 cursor-pointer flex items-center gap-1">
                    <Pill className="w-2.5 h-2.5" /> Medicamentos
                  </span>
                  <span className="opacity-90 hover:opacity-100 cursor-pointer flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Beleza & Higiene
                  </span>
                  <span className="opacity-90 hover:opacity-100 cursor-pointer flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5" /> Vitaminas
                  </span>
                  <span className="opacity-90 hover:opacity-100 cursor-pointer flex items-center gap-1">
                    <Baby className="w-2.5 h-2.5" /> Mamãe & Bebê
                  </span>
                </div>

                {/* 4. MAIN STORE BODY */}
                <div className="p-3 space-y-4">
                  
                  {/* Hero Banner Slide */}
                  <div
                    className="rounded-xl p-4 text-white relative overflow-hidden shadow-xs flex flex-col justify-between min-h-[90px] transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${getColor("--primary", "#00B5AD")} 0%, ${getColor("--secondary", "#F37021")} 100%)`
                    }}
                  >
                    <div className="space-y-1 relative z-10">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide shadow-xs"
                        style={{
                          backgroundColor: getColor("--btn-secondary-bg", "#F37021"),
                          color: getColor("--btn-secondary-text", "#FFFFFF")
                        }}
                      >
                        Encarte da Semana
                      </span>
                      <div className="text-sm font-black leading-tight drop-shadow-xs">
                        Descontos Especiais em Medicamentos
                      </div>
                      <div className="text-[10px] opacity-90">
                        Economize até 50% em genéricos e similares
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20 relative z-10">
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded text-[9px] font-extrabold uppercase shadow-xs transition hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: getColor("--btn-secondary-bg", "#F37021"),
                          color: getColor("--btn-secondary-text", "#FFFFFF")
                        }}
                      >
                        Aproveitar Ofertas
                      </button>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                      </div>
                    </div>
                  </div>

                  {/* Banner Tarja (Diferenciais) */}
                  <div 
                    className="border border-slate-200/80 rounded-xl p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 shadow-xs text-left transition-colors"
                    style={{ backgroundColor: getColor("--tarja-bg", "#FFFFFF") }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"
                        style={{ color: getColor("--tarja-icon", "#00B5AD") }}
                      >
                        <MotorcycleIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[9px] font-extrabold leading-tight" style={{ color: getColor("--tarja-text", "#0F172A") }}>Receber em casa</div>
                        <div className="text-[8px] opacity-75" style={{ color: getColor("--tarja-text", "#0F172A") }}>Entrega rápida</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"
                        style={{ color: getColor("--tarja-icon", "#00B5AD") }}
                      >
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[9px] font-extrabold leading-tight" style={{ color: getColor("--tarja-text", "#0F172A") }}>Retirar na Loja</div>
                        <div className="text-[8px] opacity-75" style={{ color: getColor("--tarja-text", "#0F172A") }}>Grátis em 1h</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"
                        style={{ color: getColor("--tarja-icon", "#00B5AD") }}
                      >
                        <Percent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[9px] font-extrabold leading-tight" style={{ color: getColor("--tarja-text", "#0F172A") }}>Melhores Ofertas</div>
                        <div className="text-[8px] opacity-75" style={{ color: getColor("--tarja-text", "#0F172A") }}>Encarte do mês</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"
                        style={{ color: getColor("--tarja-icon", "#00B5AD") }}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[9px] font-extrabold leading-tight" style={{ color: getColor("--tarja-text", "#0F172A") }}>Procedência</div>
                        <div className="text-[8px] opacity-75" style={{ color: getColor("--tarja-text", "#0F172A") }}>100% Garantida</div>
                      </div>
                    </div>
                  </div>

                  {/* Compre por Categoria (Carrossel Circular) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold" style={{ color: getColor("--headings", "#0F172A") }}>
                        Compre por categoria
                      </span>
                      <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: getColor("--primary", "#00B5AD") }}>
                        Ver todas <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                      {[
                        { name: "Medicamentos", icon: Pill },
                        { name: "Beleza", icon: Sparkles },
                        { name: "Higiene", icon: Heart },
                        { name: "Vitaminas", icon: Percent },
                        { name: "Bebê", icon: Baby },
                      ].map((cat, idx) => {
                        const IconComponent = cat.icon;
                        return (
                          <div key={idx} className="flex flex-col items-center gap-1 shrink-0 w-14 group cursor-pointer">
                            <div 
                              className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-2xs hover:scale-105 transition-all"
                              style={{ color: getColor("--primary", "#00B5AD") }}
                            >
                              <IconComponent className="w-5 h-5 stroke-[1.75]" />
                            </div>
                            <span className="text-[9px] font-bold text-slate-700 text-center truncate w-full">{cat.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Product Cards Showcase Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-bold block" style={{ color: getColor("--headings", "#0F172A") }}>
                          Super Ofertas da Loja
                        </span>
                        <span className="text-[9px] block" style={{ color: getColor("--section-desc", "#64748B") }}>
                          Confira os produtos com os melhores descontos do dia
                        </span>
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: getColor("--primary", "#00B5AD") }}>
                        Ver mais
                      </span>
                    </div>

                    <div className={`grid gap-2.5 ${previewDevice === "desktop" ? "grid-cols-3" : "grid-cols-2"}`}>
                      {[
                        {
                          name: "Dipirona Monoidratada 500mg 10 Comprimidos",
                          tag: "Tarja Vermelha",
                          oldPrice: "R$ 14,90",
                          price: "R$ 8,94",
                          discount: "-40%",
                          colorTag: "bg-red-500"
                        },
                        {
                          name: "Protetor Solar Facial FPS 60 Toque Seco 50g",
                          tag: "Dermocosmético",
                          oldPrice: "R$ 64,90",
                          price: "R$ 45,43",
                          discount: "-30%",
                          colorTag: "bg-amber-500"
                        },
                        {
                          name: "Vitamina C 1000mg + Zinco 30 Comprimidos",
                          tag: "Suplemento",
                          oldPrice: "R$ 49,90",
                          price: "R$ 37,42",
                          discount: "-25%",
                          colorTag: "bg-blue-500"
                        },
                      ].slice(0, previewDevice === "desktop" ? 3 : 2).map((prod, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-col justify-between relative hover:border-slate-300 transition-all group"
                        >
                          {/* Discount Badge */}
                          <span
                            className="absolute top-2 left-2 text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs"
                            style={{
                              backgroundColor: getColor("--price-discount-badge-bg", "#F43F5E"),
                              color: getColor("--price-discount-badge-text", "#FFFFFF")
                            }}
                          >
                            {prod.discount}
                          </span>

                          {/* Product Image Placeholder */}
                          <div className="w-full h-20 bg-slate-50 rounded-lg flex flex-col items-center justify-center relative mb-2 p-1 border border-slate-100">
                            <Pill className="w-7 h-7 text-slate-300 mb-1" />
                            <span className={`text-[7px] text-white font-extrabold px-1 py-0.2 rounded uppercase ${prod.colorTag}`}>
                              {prod.tag}
                            </span>
                          </div>

                          {/* Product Info */}
                          <div className="space-y-0.5">
                            <div 
                              className="text-[10px] font-bold line-clamp-2 leading-tight min-h-[26px]"
                              style={{ color: getColor("--headings", "#0F172A") }}
                            >
                              {prod.name}
                            </div>
                            <div 
                              className="text-[9px] line-through"
                              style={{ color: getColor("--price-old", "#94A3B8") }}
                            >
                              {prod.oldPrice}
                            </div>
                            <div
                              className="text-xs font-black"
                              style={{ color: getColor("--price-main", "#00B5AD") }}
                            >
                              {prod.price}
                            </div>
                          </div>

                          {/* Buy Button */}
                          <button
                            type="button"
                            className="w-full mt-2 py-1.5 rounded-lg text-[10px] font-extrabold uppercase shadow-xs transition hover:opacity-90 active:scale-98 flex items-center justify-center gap-1"
                            style={{
                              backgroundColor: getColor("--btn-primary-bg", "#00B5AD"),
                              color: getColor("--btn-primary-text", "#FFFFFF")
                            }}
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Comprar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Newsletter Box */}
                  <div
                    className="p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-2 transition-colors"
                    style={{ backgroundColor: getColor("--news-bg", "#F8FAFC") }}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 shrink-0" style={{ color: getColor("--primary", "#00B5AD") }} />
                      <div>
                        <div className="text-[11px] font-bold leading-tight" style={{ color: getColor("--news-text", "#0F172A") }}>
                          Receba Nossas Ofertas Exclusivas
                        </div>
                        <div className="text-[9px] opacity-80" style={{ color: getColor("--news-text", "#0F172A") }}>
                          Cadastre-se e ganhe cupons direto no seu e-mail
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      <div
                        className="flex-1 h-7 rounded-lg border px-2.5 flex items-center shadow-inner text-[10px]"
                        style={{
                          backgroundColor: getColor("--news-input-bg", "#FFFFFF"),
                          color: getColor("--news-input-text", "#1E293B"),
                          borderColor: getColor("--news-input-border", "#CBD5E1"),
                        }}
                      >
                        seu-email@exemplo.com
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase shrink-0 shadow-xs transition hover:opacity-90 flex items-center gap-1"
                        style={{
                          backgroundColor: getColor("--news-btn-bg", "#00B5AD"),
                          color: getColor("--news-btn-text", "#FFFFFF"),
                        }}
                      >
                        <Send className="w-2.5 h-2.5" />
                        Cadastrar
                      </button>
                    </div>
                  </div>

                  {/* PWA App Banner Mock */}
                  <div
                    className="p-3 rounded-xl shadow-xs flex items-center justify-between gap-3 border border-white/20 transition-colors"
                    style={{
                      backgroundColor: getColor("--pwa-banner-bg", "#00B5AD"),
                      color: getColor("--pwa-banner-text", "#FFFFFF")
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="text-[10px] leading-tight min-w-0">
                        <div className="font-extrabold truncate">Baixe o App Associadas</div>
                        <div className="text-[9px] opacity-90 truncate">Ofertas e cupons na palma da mão</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase shrink-0 shadow-xs hover:scale-105 transition"
                      style={{
                        backgroundColor: getColor("--pwa-banner-btn-bg", "#FFFFFF"),
                        color: getColor("--pwa-banner-btn-text", "#00B5AD")
                      }}
                    >
                      Instalar
                    </button>
                  </div>
                </div>

                {/* 5. MAIN FOOTER */}
                <div
                  className="p-4 border-t border-black/10 flex flex-col gap-3 transition-colors mt-auto text-center"
                  style={{
                    backgroundColor: getColor("--footer-bg", "#00B5AD"),
                    color: getColor("--footer-text", "#FFFFFF")
                  }}
                >
                  {/* Social Icons */}
                  <div className="flex items-center justify-center gap-2">
                    {["Instagram", "Facebook", "WhatsApp"].map((social, idx) => (
                      <span
                        key={idx}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs hover:scale-110 transition cursor-pointer"
                        style={{
                          backgroundColor: getColor("--social-icons-bg", "#FFFFFF"),
                          color: getColor("--social-icons", "#00B5AD")
                        }}
                      >
                        {social.charAt(0)}
                      </span>
                    ))}
                  </div>

                  <div className="text-[9px] opacity-90 leading-tight space-y-0.5">
                    <div className="font-bold">{currentPharmacy?.razaoSocial || currentPharmacy?.nome || "Farmácias Associadas"}</div>
                    <div>CNPJ: {currentPharmacy?.cnpj || "00.000.000/0001-00"} • CRF: {currentPharmacy?.inscricaoFarmaceutico || "12345/RS"}</div>
                    <div>{currentPharmacy?.endereco || "Av. Principal"}, Nº {currentPharmacy?.numero || "100"} - {currentPharmacy?.cidade || "Porto Alegre"}/{currentPharmacy?.uf || "RS"}</div>
                  </div>
                </div>

                {/* 6. FOOTER BOTTOM */}
                <div
                  className="px-4 py-2.5 text-center text-[8px] transition-colors border-t border-black/5"
                  style={{
                    backgroundColor: getColor("--footer-bottom-bg", "#008E88"),
                    color: getColor("--footer-bottom-text", "#E2E8F0")
                  }}
                >
                  © {new Date().getFullYear()} {currentPharmacy?.nome || "Farmácias Associadas"}. Todos os direitos reservados.
                </div>

              </div>
            </div>

            {isPleno ? (
              <div className="w-full mt-4 bg-slate-100 border border-slate-300 text-slate-600 font-bold h-11 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm">
                <Lock className="w-4 h-4 text-amber-600" />
                Loja Plena — Visualização das Cores Oficiais da Rede
              </div>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando cores..." : "Salvar e Aplicar Cores na Loja"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
