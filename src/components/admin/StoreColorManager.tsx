import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAdmin } from "@/stores/admin";
import {
  Palette,
  RotateCcw,
  Save,
  Eye,
  Sparkles,
  ChevronDown,
  Monitor,
  Store,
  Search,
  ShoppingCart,
  Check,
  Smartphone,
  LayoutTemplate,
  SlidersHorizontal,
  Share2
} from "lucide-react";
import { StoreSelector } from "@/components/admin/StoreSelector";
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
    id: "violet-magenta",
    name: "Violeta & Magenta Moderno",
    stripes: ["#705BC2", "#FE509C", "#FFFFFF", "#199965", "#666666", "#C92A42"],
    colors: {
      "--primary": "#705BC2",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#FE509C",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#FE509C",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--header-bg": "#705BC2",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#FE509C",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#5F4BB6",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#1E1B4B",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#705BC2",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#705BC2",
      "--pwa-banner-bg": "#705BC2",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#705BC2",
      "primary": "#705BC2",
      "secondary": "#FE509C",
      "accent": "#FE509C",
      "headerBg": "#705BC2",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#FE509C",
      "topbarText": "#FFFFFF",
      "menuBg": "#5F4BB6",
      "menuText": "#FFFFFF",
      "footerBg": "#1E1B4B",
      "footerText": "#FFFFFF",
      "socialIcons": "#705BC2",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#705BC2",
      "pwaBannerBg": "#705BC2",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#705BC2"
    }
  },
  {
    id: "indigo-cyan",
    name: "Índigo & Ciano Elétrico",
    stripes: ["#6366F1", "#EC4899", "#FFFFFF", "#06B6D4", "#4F46E5", "#DB2777"],
    colors: {
      "--primary": "#6366F1",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#06B6D4",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#EC4899",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--header-bg": "#6366F1",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#4F46E5",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#4F46E5",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#1E1B4B",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#6366F1",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#6366F1",
      "--pwa-banner-bg": "#6366F1",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#6366F1",
      "primary": "#6366F1",
      "secondary": "#06B6D4",
      "accent": "#EC4899",
      "headerBg": "#6366F1",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#4F46E5",
      "topbarText": "#FFFFFF",
      "menuBg": "#4F46E5",
      "menuText": "#FFFFFF",
      "footerBg": "#1E1B4B",
      "footerText": "#FFFFFF",
      "socialIcons": "#6366F1",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#6366F1",
      "pwaBannerBg": "#6366F1",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#6366F1"
    }
  },
  {
    id: "rose-lime",
    name: "Rosa & Lima Fresh",
    stripes: ["#F472B6", "#4B5563", "#FFFFFF", "#84CC16", "#F472B6", "#A3E635"],
    colors: {
      "--primary": "#F472B6",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#84CC16",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#DB2777",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1F2937",
      "--header-bg": "#F472B6",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#DB2777",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#EC4899",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#1F2937",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#F472B6",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#F472B6",
      "--pwa-banner-bg": "#F472B6",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#F472B6",
      "primary": "#F472B6",
      "secondary": "#84CC16",
      "accent": "#DB2777",
      "headerBg": "#F472B6",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#DB2777",
      "topbarText": "#FFFFFF",
      "menuBg": "#EC4899",
      "menuText": "#FFFFFF",
      "footerBg": "#1F2937",
      "footerText": "#FFFFFF",
      "socialIcons": "#F472B6",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#F472B6",
      "pwaBannerBg": "#F472B6",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#F472B6"
    }
  },
  {
    id: "slate-emerald-orange",
    name: "Grafite & Esmeralda Laranja",
    stripes: ["#1E293B", "#EF4444", "#FFFFFF", "#10B981", "#64748B", "#F97316"],
    colors: {
      "--primary": "#10B981",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#F97316",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#EF4444",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--header-bg": "#1E293B",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#F97316",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#0F172A",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#0F172A",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#10B981",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#1E293B",
      "--pwa-banner-bg": "#10B981",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#10B981",
      "primary": "#10B981",
      "secondary": "#F97316",
      "accent": "#EF4444",
      "headerBg": "#1E293B",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#F97316",
      "topbarText": "#FFFFFF",
      "menuBg": "#0F172A",
      "menuText": "#FFFFFF",
      "footerBg": "#0F172A",
      "footerText": "#FFFFFF",
      "socialIcons": "#10B981",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#1E293B",
      "pwaBannerBg": "#10B981",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#10B981"
    }
  },
  {
    id: "minimal-black-rose",
    name: "Preto & Rosé Nude",
    stripes: ["#18181B", "#C28871", "#FFFFFF", "#27272A", "#E0A99A", "#F4F4F5"],
    colors: {
      "--primary": "#18181B",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#C28871",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#C28871",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#18181B",
      "--header-bg": "#18181B",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#C28871",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#27272A",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#18181B",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#18181B",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#18181B",
      "--pwa-banner-bg": "#18181B",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#C28871",
      "--pwa-banner-btn-text": "#FFFFFF",
      "primary": "#18181B",
      "secondary": "#C28871",
      "accent": "#C28871",
      "headerBg": "#18181B",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#C28871",
      "topbarText": "#FFFFFF",
      "menuBg": "#27272A",
      "menuText": "#FFFFFF",
      "footerBg": "#18181B",
      "footerText": "#FFFFFF",
      "socialIcons": "#18181B",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#18181B",
      "pwaBannerBg": "#18181B",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#C28871",
      "pwaBannerBtnText": "#FFFFFF"
    }
  },
  {
    id: "navy-terracotta",
    name: "Azul Marinho & Terracota",
    stripes: ["#1E293B", "#475569", "#FFFFFF", "#5B8279", "#C27878", "#E2E8F0"],
    colors: {
      "--primary": "#1E293B",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#5B8279",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#C27878",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--header-bg": "#1E293B",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#5B8279",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#0F172A",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#0F172A",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#5B8279",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#1E293B",
      "--pwa-banner-bg": "#1E293B",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#1E293B",
      "primary": "#1E293B",
      "secondary": "#5B8279",
      "accent": "#C27878",
      "headerBg": "#1E293B",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#5B8279",
      "topbarText": "#FFFFFF",
      "menuBg": "#0F172A",
      "menuText": "#FFFFFF",
      "footerBg": "#0F172A",
      "footerText": "#FFFFFF",
      "socialIcons": "#5B8279",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#1E293B",
      "pwaBannerBg": "#1E293B",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#1E293B"
    }
  },
  {
    id: "warm-amber-olive",
    name: "Âmbar & Oliva Suave",
    stripes: ["#E59866", "#D4AC0D", "#FFFFFF", "#7D9D6C", "#5D6D7E", "#4A4A4A"],
    colors: {
      "--primary": "#E59866",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#7D9D6C",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#D4AC0D",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#4A4A4A",
      "--header-bg": "#E59866",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#D4AC0D",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#CA6F1E",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#4A4A4A",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#E59866",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#E59866",
      "--pwa-banner-bg": "#E59866",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#E59866",
      "primary": "#E59866",
      "secondary": "#7D9D6C",
      "accent": "#D4AC0D",
      "headerBg": "#E59866",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#D4AC0D",
      "topbarText": "#FFFFFF",
      "menuBg": "#CA6F1E",
      "menuText": "#FFFFFF",
      "footerBg": "#4A4A4A",
      "footerText": "#FFFFFF",
      "socialIcons": "#E59866",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#E59866",
      "pwaBannerBg": "#E59866",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#E59866"
    }
  },
  {
    id: "coral-mint-cream",
    name: "Coral & Menta Pastel",
    stripes: ["#F87171", "#FB7185", "#FFFFFF", "#A3B899", "#D8D8C0", "#FDEBD0"],
    colors: {
      "--primary": "#F87171",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#A3B899",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#FB7185",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#334155",
      "--header-bg": "#F87171",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#FB7185",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#EF4444",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#334155",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#F87171",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#F87171",
      "--pwa-banner-bg": "#F87171",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#F87171",
      "primary": "#F87171",
      "secondary": "#A3B899",
      "accent": "#FB7185",
      "headerBg": "#F87171",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#FB7185",
      "topbarText": "#FFFFFF",
      "menuBg": "#EF4444",
      "menuText": "#FFFFFF",
      "footerBg": "#334155",
      "footerText": "#FFFFFF",
      "socialIcons": "#F87171",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#F87171",
      "pwaBannerBg": "#F87171",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#F87171"
    }
  },
  {
    id: "teal-fuchsia-gold",
    name: "Teal Oceânico & Dourado",
    stripes: ["#0D9488", "#1E1B4B", "#FFFFFF", "#E11D48", "#F59E0B", "#A3E635"],
    colors: {
      "--primary": "#0D9488",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#F59E0B",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#E11D48",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--header-bg": "#0D9488",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#1E1B4B",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#0F766E",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#1E1B4B",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#0D9488",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#0D9488",
      "--pwa-banner-bg": "#0D9488",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#0D9488",
      "primary": "#0D9488",
      "secondary": "#F59E0B",
      "accent": "#E11D48",
      "headerBg": "#0D9488",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#1E1B4B",
      "topbarText": "#FFFFFF",
      "menuBg": "#0F766E",
      "menuText": "#FFFFFF",
      "footerBg": "#1E1B4B",
      "footerText": "#FFFFFF",
      "socialIcons": "#0D9488",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#0D9488",
      "pwaBannerBg": "#0D9488",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#0D9488"
    }
  },
  {
    id: "ocean-tangerine",
    name: "Azul Petróleo & Tangerina",
    stripes: ["#1E3A8A", "#0284C7", "#FFFFFF", "#38BDF8", "#EA580C", "#65A30D"],
    colors: {
      "--primary": "#1E3A8A",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#EA580C",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#EA580C",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--header-bg": "#1E3A8A",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#EA580C",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#172554",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#172554",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#1E3A8A",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#1E3A8A",
      "--pwa-banner-bg": "#1E3A8A",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#1E3A8A",
      "primary": "#1E3A8A",
      "secondary": "#EA580C",
      "accent": "#EA580C",
      "headerBg": "#1E3A8A",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#EA580C",
      "topbarText": "#FFFFFF",
      "menuBg": "#172554",
      "menuText": "#FFFFFF",
      "footerBg": "#172554",
      "footerText": "#FFFFFF",
      "socialIcons": "#1E3A8A",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#1E3A8A",
      "pwaBannerBg": "#1E3A8A",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#1E3A8A"
    }
  },
  {
    id: "royal-blue-crimson",
    name: "Azul Royal & Vermelho Vivo",
    stripes: ["#1E293B", "#DC2626", "#FFFFFF", "#2563EB", "#1D4ED8", "#B91C1C"],
    colors: {
      "--primary": "#2563EB",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#DC2626",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#DC2626",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--header-bg": "#2563EB",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#DC2626",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#1D4ED8",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#1E293B",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#2563EB",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#2563EB",
      "--pwa-banner-bg": "#2563EB",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#2563EB",
      "primary": "#2563EB",
      "secondary": "#DC2626",
      "accent": "#DC2626",
      "headerBg": "#2563EB",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#DC2626",
      "topbarText": "#FFFFFF",
      "menuBg": "#1D4ED8",
      "menuText": "#FFFFFF",
      "footerBg": "#1E293B",
      "footerText": "#FFFFFF",
      "socialIcons": "#2563EB",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#2563EB",
      "pwaBannerBg": "#2563EB",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#2563EB"
    }
  },
  {
    id: "cyber-lime-purple",
    name: "Lima Vibrante & Roxo",
    stripes: ["#65A30D", "#EAB308", "#FFFFFF", "#84CC16", "#475569", "#7E22CE"],
    colors: {
      "--primary": "#65A30D",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#7E22CE",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#EAB308",
      "--accent-foreground": "#1E293B",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--header-bg": "#65A30D",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#7E22CE",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#4D7C0F",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#1E293B",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#65A30D",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#65A30D",
      "--pwa-banner-bg": "#65A30D",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#65A30D",
      "primary": "#65A30D",
      "secondary": "#7E22CE",
      "accent": "#EAB308",
      "headerBg": "#65A30D",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#7E22CE",
      "topbarText": "#FFFFFF",
      "menuBg": "#4D7C0F",
      "menuText": "#FFFFFF",
      "footerBg": "#1E293B",
      "footerText": "#FFFFFF",
      "socialIcons": "#65A30D",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#65A30D",
      "pwaBannerBg": "#65A30D",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#65A30D"
    }
  },
  {
    id: "associadas-classic",
    name: "Farmácias Associadas Clássico",
    stripes: ["#00B5AD", "#F37021", "#FFFFFF", "#00A389", "#334155", "#EF4444"],
    colors: {
      "--primary": "#00B5AD",
      "--primary-foreground": "#FFFFFF",
      "--secondary": "#F37021",
      "--secondary-foreground": "#FFFFFF",
      "--accent": "#EF4444",
      "--accent-foreground": "#FFFFFF",
      "--background": "#FFFFFF",
      "--foreground": "#1E293B",
      "--header-bg": "#00B5AD",
      "--header-icons": "#FFFFFF",
      "--search-bg": "#FFFFFF",
      "--topbar-bg": "#F37021",
      "--topbar-text": "#FFFFFF",
      "--menu-bg": "#008E88",
      "--menu-text": "#FFFFFF",
      "--footer-bg": "#00B5AD",
      "--footer-text": "#FFFFFF",
      "--social-icons": "#00B5AD",
      "--social-icons-bg": "#FFFFFF",
      "--institutional-bg": "#F37021",
      "--pwa-banner-bg": "#00B5AD",
      "--pwa-banner-text": "#FFFFFF",
      "--pwa-banner-btn-bg": "#FFFFFF",
      "--pwa-banner-btn-text": "#00B5AD",
      "primary": "#00B5AD",
      "secondary": "#F37021",
      "accent": "#EF4444",
      "headerBg": "#00B5AD",
      "headerIcons": "#FFFFFF",
      "searchBg": "#FFFFFF",
      "topbarBg": "#F37021",
      "topbarText": "#FFFFFF",
      "menuBg": "#008E88",
      "menuText": "#FFFFFF",
      "footerBg": "#00B5AD",
      "footerText": "#FFFFFF",
      "socialIcons": "#00B5AD",
      "socialIconsBg": "#FFFFFF",
      "institutionalBg": "#F37021",
      "pwaBannerBg": "#00B5AD",
      "pwaBannerText": "#FFFFFF",
      "pwaBannerBtnBg": "#FFFFFF",
      "pwaBannerBtnText": "#00B5AD"
    }
  }
];

export function StoreColorManager({
  storeId,
  showStoreSelector = true,
  title = "Personalizar Cores da Loja",
  description = "Escolha as cores que representarão a sua marca no site e no aplicativo.",
}: {
  storeId?: string;
  showStoreSelector?: boolean;
  title?: string;
  description?: string;
}) {
  const admin = useAdmin();
  const effectiveStoreId = storeId || admin.activeStoreId;
  const currentPharmacy = admin.pharmacies.find((p) => p.id === effectiveStoreId);

  const defaultTheme: Record<string, string> = useMemo(() => ({
    "--primary": "#00B5AD",
    "--primary-foreground": "#FFFFFF",
    "--secondary": "#F37021",
    "--secondary-foreground": "#FFFFFF",
    "--accent": "#F43F5E",
    "--accent-foreground": "#FFFFFF",
    "--background": "#FFFFFF",
    "--foreground": "#1E293B",
    "--header-bg": "#00B5AD",
    "--header-icons": "#FFFFFF",
    "--search-bg": "#FFFFFF",
    "--topbar-bg": "#F37021",
    "--topbar-text": "#FFFFFF",
    "--menu-bg": "#008E88",
    "--menu-text": "#FFFFFF",
    "--footer-bg": "#00B5AD",
    "--footer-text": "#FFFFFF",
    "--social-icons": "#00B5AD",
    "--social-icons-bg": "#FFFFFF",
    "--institutional-bg": "#F97316",
    "--pwa-banner-bg": "#00B5AD",
    "--pwa-banner-text": "#FFFFFF",
    "--pwa-banner-btn-bg": "#FFFFFF",
    "--pwa-banner-btn-text": "#00B5AD",
    "primary": "#00B5AD",
    "secondary": "#F37021",
    "accent": "#F43F5E",
    "headerBg": "#00B5AD",
    "headerIcons": "#FFFFFF",
    "searchBg": "#FFFFFF",
    "topbarBg": "#F37021",
    "topbarText": "#FFFFFF",
    "menuBg": "#008E88",
    "menuText": "#FFFFFF",
    "footerBg": "#00B5AD",
    "footerText": "#FFFFFF",
    "socialIcons": "#00B5AD",
    "socialIconsBg": "#FFFFFF",
    "institutionalBg": "#F97316",
    "pwaBannerBg": "#00B5AD",
    "pwaBannerText": "#FFFFFF",
    "pwaBannerBtnBg": "#FFFFFF",
    "pwaBannerBtnText": "#00B5AD"
  }), []);

  const [colors, setColors] = useState<Record<string, string>>({
    ...defaultTheme,
    ...(currentPharmacy?.themeColors || {})
  });

  const [showPresets, setShowPresets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentPharmacy) {
      setColors({
        ...defaultTheme,
        ...(currentPharmacy.themeColors || {})
      });
    }
  }, [currentPharmacy, defaultTheme]);

  const getColor = (key: string, fallback: string) => {
    return colors[key] || colors[`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] || colors[key.replace(/^--/, '')] || fallback;
  };

  const updateColor = (key: string, value: string) => {
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
    setColors(prev => ({
      ...prev,
      ...preset.colors
    }));
    toast.success(`Paleta "${preset.name}" aplicada!`);
  };

  const handleSave = async () => {
    if (!effectiveStoreId || !currentPharmacy) {
      toast.error("Selecione uma loja primeiro para salvar as cores.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Salvando paleta de cores...");
    try {
      await admin.updatePharmacy(effectiveStoreId, {
        ...currentPharmacy,
        themeColors: colors
      } as any);

      await admin.saveConfig("cores", colors, effectiveStoreId);
      toast.success("Cores atualizadas e aplicadas na loja com sucesso!", { id: toastId });
    } catch (e) {
      console.error("Erro ao salvar cores:", e);
      toast.error("Erro ao salvar as cores no banco de dados.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setColors(defaultTheme);
    if (effectiveStoreId && currentPharmacy) {
      try {
        await admin.updatePharmacy(effectiveStoreId, {
          ...currentPharmacy,
          themeColors: {}
        } as any);
        await admin.saveConfig("cores", {}, effectiveStoreId);
        toast.success("Cores restauradas para o padrão com sucesso!");
      } catch (e) {
        toast.error("Erro ao resetar cores.");
      }
    }
  };

  // Cores ativas para a barra de listras da paleta atual
  const currentStripes: [string, string, string, string, string, string] = useMemo(() => [
    getColor("--primary", "#705BC2"),
    getColor("--secondary", "#FE509C"),
    getColor("--background", "#FFFFFF"),
    getColor("--accent", "#199965"),
    getColor("--foreground", "#666666"),
    getColor("--topbar-bg", "#C92A42"),
  ], [colors]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Palette className="w-6 h-6 text-emerald-600" />
            {title} {currentPharmacy?.nome ? `- ${currentPharmacy.nome}` : ""}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {showStoreSelector && <StoreSelector className="mb-0" />}

          {currentPharmacy && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white"
              onClick={() => {
                const targetSlug = currentPharmacy.slug || safeSlugify(currentPharmacy.nome || currentPharmacy.id);
                window.open(`/${targetSlug}`, "_blank");
              }}
            >
              <Eye className="w-4 h-4" /> Ver na minha loja
            </Button>
          )}

          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {/* Main Grid: Controls + Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Preset Strip + Accordions (7 Cols) */}
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
              <Button
                variant="ghost"
                size="sm"
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-xs"
                onClick={() => setShowPresets(!showPresets)}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                {showPresets ? "Ocultar predefinições" : "Escolher outra paleta"}
              </Button>
            </div>

            {/* Current Palette Stripe Bar (As requested in image 1) */}
            <div className="h-14 w-full rounded-xl overflow-hidden shadow-inner flex border border-slate-200">
              {currentStripes.map((color, index) => (
                <div
                  key={index}
                  className="flex-1 h-full transition-colors relative group"
                  style={{ backgroundColor: color }}
                  title={`Cor ${index + 1}: ${color}`}
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow-md">
                    {color}
                  </span>
                </div>
              ))}
            </div>

            {/* Presets Grid Dropdown (As requested in image 2) */}
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

          {/* Card 2: Accordions de Edição Minuciosa (As requested in images 3, 4, 5) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" /> Configuração Granular de Cores
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Altere valores individuais de cada elemento do seu site e aplicativo.
              </p>
            </div>

            <Accordion type="multiple" defaultValue={["cores-gerais", "botoes-primarios", "botoes-secundarios"]} className="w-full">
              
              {/* 1. Cores Gerais */}
              <AccordionItem value="cores-gerais" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--primary", "#705BC2") }} />
                    Cores Gerais (Marca e Fundo)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Cor primária"
                    description="A cor principal da marca (botões principais, links ativos, destaques)."
                    value={getColor("--primary", "#705BC2")}
                    onChange={(v) => updateColor("--primary", v)}
                  />
                  <ColorRow
                    label="Cor secundária"
                    description="Usada em botões secundários, ícones de menu e rodapé."
                    value={getColor("--secondary", "#FE509C")}
                    onChange={(v) => updateColor("--secondary", v)}
                  />
                  <ColorRow
                    label="Cor de Destaque (Accent)"
                    description="Usada para chamar atenção: descontos, preços promocionais, tags."
                    value={getColor("--accent", "#FE509C")}
                    onChange={(v) => updateColor("--accent", v)}
                  />
                  <ColorRow
                    label="Fundo da loja"
                    description="Cor de fundo principal do site (Geralmente branco ou cinza claro)."
                    value={getColor("--background", "#FFFFFF")}
                    onChange={(v) => updateColor("--background", v)}
                  />
                  <ColorRow
                    label="Texto Base"
                    description="Cor principal para os textos e parágrafos do site."
                    value={getColor("--foreground", "#1E293B")}
                    onChange={(v) => updateColor("--foreground", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 2. Botões Primários */}
              <AccordionItem value="botoes-primarios" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--primary", "#199965") }} />
                    Botões Primários (Comprar / Finalizar)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Cor do botão"
                    description="Cor de fundo dos botões principais de compra e chamada de ação."
                    value={getColor("--primary", "#199965")}
                    onChange={(v) => updateColor("--primary", v)}
                  />
                  <ColorRow
                    label="Cor do texto"
                    description="Cor do texto e ícones dentro dos botões principais."
                    value={getColor("--primary-foreground", "#FFFFFF")}
                    onChange={(v) => updateColor("--primary-foreground", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 3. Botões Secundários */}
              <AccordionItem value="botoes-secundarios" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--secondary", "#666666") }} />
                    Botões Secundários
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Cor do botão"
                    description="Cor de fundo de botões secundários (filtros, detalhes, voltar)."
                    value={getColor("--secondary", "#666666")}
                    onChange={(v) => updateColor("--secondary", v)}
                  />
                  <ColorRow
                    label="Cor do texto"
                    description="Cor do texto dentro dos botões secundários."
                    value={getColor("--secondary-foreground", "#FFFFFF")}
                    onChange={(v) => updateColor("--secondary-foreground", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 4. Estrutura e Cabeçalho */}
              <AccordionItem value="estrutura-cabecalho" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--header-bg", "#705BC2") }} />
                    Estrutura, Cabeçalho e Faixa Superior
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo da Faixa Superior"
                    description="Cor de fundo da barra de avisos/cupons no topo."
                    value={getColor("--topbar-bg", "#FE509C")}
                    onChange={(v) => updateColor("--topbar-bg", v)}
                  />
                  <ColorRow
                    label="Texto da Faixa Superior"
                    description="Cor do texto de avisos e cupons no topo."
                    value={getColor("--topbar-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--topbar-text", v)}
                  />
                  <ColorRow
                    label="Fundo do Cabeçalho"
                    description="Cor de fundo principal da área de logo e busca."
                    value={getColor("--header-bg", "#705BC2")}
                    onChange={(v) => updateColor("--header-bg", v)}
                  />
                  <ColorRow
                    label="Ícones do Cabeçalho"
                    description="Cor dos ícones de carrinho, usuário, menu e busca."
                    value={getColor("--header-icons", "#FFFFFF")}
                    onChange={(v) => updateColor("--header-icons", v)}
                  />
                  <ColorRow
                    label="Barra de Pesquisa (Fundo)"
                    description="Cor de fundo do campo de busca de produtos."
                    value={getColor("--search-bg", "#FFFFFF")}
                    onChange={(v) => updateColor("--search-bg", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 5. Menu e Navegação */}
              <AccordionItem value="menu-navegacao" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--menu-bg", "#5F4BB6") }} />
                    Menu e Navegação de Categorias
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo do Menu"
                    description="Cor da barra de categorias principal."
                    value={getColor("--menu-bg", "#5F4BB6")}
                    onChange={(v) => updateColor("--menu-bg", v)}
                  />
                  <ColorRow
                    label="Texto do Menu"
                    description="Cor dos títulos de categorias no menu."
                    value={getColor("--menu-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--menu-text", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 6. Rodapé e Redes Sociais */}
              <AccordionItem value="rodape-sociais" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--footer-bg", "#1E1B4B") }} />
                    Rodapé, Footer e Ícones de Redes Sociais
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo do Rodapé"
                    description="Cor de fundo da área inferior do site."
                    value={getColor("--footer-bg", "#1E1B4B")}
                    onChange={(v) => updateColor("--footer-bg", v)}
                  />
                  <ColorRow
                    label="Texto do Rodapé"
                    description="Cor dos textos informativos, links e títulos do rodapé."
                    value={getColor("--footer-text", "#FFFFFF")}
                    onChange={(v) => updateColor("--footer-text", v)}
                  />
                  <ColorRow
                    label="Ícones de Redes Sociais"
                    description="Cor dos ícones do Instagram, Facebook, WhatsApp no rodapé."
                    value={getColor("--social-icons", "#705BC2")}
                    onChange={(v) => updateColor("--social-icons", v)}
                  />
                  <ColorRow
                    label="Fundo dos Ícones de Redes Sociais"
                    description="Cor do círculo de fundo dos ícones de redes sociais."
                    value={getColor("--social-icons-bg", "#FFFFFF")}
                    onChange={(v) => updateColor("--social-icons-bg", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 7. Sessões Institucionais */}
              <AccordionItem value="sessoes-institucionais" className="px-6 border-b border-slate-100">
                <AccordionTrigger className="hover:no-underline py-4 font-bold text-slate-800 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor("--institutional-bg", "#705BC2") }} />
                    Sessões Institucionais
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6 space-y-4">
                  <ColorRow
                    label="Fundo das Sessões Institucionais"
                    description="Cor de fundo das seções institucionais (Serviços de Saúde e Diferenciais)."
                    value={getColor("--institutional-bg", "#705BC2")}
                    onChange={(v) => updateColor("--institutional-bg", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* 8. Balão PWA */}
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
                    value={getColor("--pwa-banner-bg", "#705BC2")}
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
                    description="Cor do texto e ícone dentro do botão de instalar."
                    value={getColor("--pwa-banner-btn-text", "#705BC2")}
                    onChange={(v) => updateColor("--pwa-banner-btn-text", v)}
                  />
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        </div>

        {/* Right Column: Live Mockup Preview (5 Cols) */}
        <div className="xl:col-span-5 sticky top-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-600" /> Demonstração na Loja em Tempo Real
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Ao Vivo
              </span>
            </div>

            {/* Mobile / Web Storefront Mockup */}
            <div className="bg-slate-100 rounded-2xl p-3 border border-slate-200 shadow-inner">
              <div
                className="rounded-xl overflow-hidden shadow-lg border border-slate-200 flex flex-col transition-all duration-300"
                style={{ backgroundColor: getColor("--background", "#FFFFFF") }}
              >
                {/* Top Announcement Bar */}
                <div
                  className="py-1.5 px-3 text-center text-[10px] font-bold transition-colors"
                  style={{
                    backgroundColor: getColor("--topbar-bg", "#FE509C"),
                    color: getColor("--topbar-text", "#FFFFFF")
                  }}
                >
                  Cupom de primeira compra: use 10OFF em compras acima de R$ 100,00
                </div>

                {/* Header */}
                <div
                  className="p-3.5 flex flex-col gap-2.5 transition-colors"
                  style={{ backgroundColor: getColor("--header-bg", "#705BC2") }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="font-black text-sm tracking-tight flex items-center gap-1.5"
                      style={{ color: getColor("--header-icons", "#FFFFFF") }}
                    >
                      {currentPharmacy?.logoUrl ? (
                        <img src={currentPharmacy.logoUrl} alt="Logo" className="h-5 w-auto object-contain" />
                      ) : (
                        <><Store className="w-4 h-4" /> {currentPharmacy?.nome || "LOJA PARCEIRA"}</>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4" style={{ color: getColor("--header-icons", "#FFFFFF") }} />
                      <div className="relative">
                        <ShoppingCart className="w-4 h-4" style={{ color: getColor("--header-icons", "#FFFFFF") }} />
                        <span
                          className="absolute -top-1.5 -right-2 text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold text-white"
                          style={{ backgroundColor: getColor("--accent", "#FE509C") }}
                        >
                          2
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div
                    className="h-8 rounded-full flex items-center px-3 text-xs shadow-sm transition-colors"
                    style={{ backgroundColor: getColor("--search-bg", "#FFFFFF") }}
                  >
                    <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                    <span className="text-[11px] text-slate-400">Buscar medicamentos e cosméticos...</span>
                  </div>
                </div>

                {/* Navigation Menu */}
                <div
                  className="px-3 py-2 flex items-center gap-3 overflow-x-auto text-[10px] font-bold whitespace-nowrap scrollbar-none transition-colors border-t border-black/5"
                  style={{
                    backgroundColor: getColor("--menu-bg", "#5F4BB6"),
                    color: getColor("--menu-text", "#FFFFFF")
                  }}
                >
                  <span className="opacity-100 border-b-2 border-white pb-0.5">Medicamentos</span>
                  <span className="opacity-80">Beleza & Higiene</span>
                  <span className="opacity-80">Vitaminas</span>
                  <span className="opacity-80">Ofertas</span>
                </div>

                {/* Store Body Mock */}
                <div className="p-3.5 space-y-3">
                  
                  {/* Hero Banner Mock */}
                  <div
                    className="h-20 rounded-xl flex items-center justify-center p-3 text-center shadow-sm relative overflow-hidden transition-colors"
                    style={{ backgroundColor: (getColor("--secondary", "#FE509C")) + "20" }}
                  >
                    <div className="space-y-0.5 z-10">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase text-white shadow-sm"
                        style={{ backgroundColor: getColor("--secondary", "#FE509C") }}
                      >
                        Super Oferta
                      </span>
                      <div className="text-xs font-bold" style={{ color: getColor("--foreground", "#1E293B") }}>
                        Cuidados Diários e Dermocosméticos
                      </div>
                    </div>
                  </div>

                  {/* Product Cards Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm flex flex-col justify-between">
                        <div className="w-full h-16 bg-slate-50 rounded-lg flex items-center justify-center relative mb-2">
                          <span
                            className="absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded text-white"
                            style={{ backgroundColor: getColor("--accent", "#FE509C") }}
                          >
                            -30%
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">Produto {i}</span>
                        </div>
                        <div className="text-[10px] font-bold truncate" style={{ color: getColor("--foreground", "#1E293B") }}>
                          {i === 1 ? "Vitamina C 1000mg" : "Protetor Solar FPS 50"}
                        </div>
                        <div className="text-[9px] text-slate-400 line-through mt-0.5">R$ 49,90</div>
                        <div className="text-xs font-extrabold mb-2" style={{ color: getColor("--accent", "#FE509C") }}>
                          R$ 34,90
                        </div>
                        <button
                          type="button"
                          className="w-full py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition hover:opacity-90 flex items-center justify-center gap-1"
                          style={{
                            backgroundColor: getColor("--primary", "#199965"),
                            color: getColor("--primary-foreground", "#FFFFFF")
                          }}
                        >
                          Comprar
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* PWA App Banner Mock */}
                  <div
                    className="p-3 rounded-xl shadow-sm flex items-center justify-between gap-2 border border-white/20 transition-colors"
                    style={{
                      backgroundColor: getColor("--pwa-banner-bg", "#705BC2"),
                      color: getColor("--pwa-banner-text", "#FFFFFF")
                    }}
                  >
                    <div className="text-[10px] leading-tight">
                      <div className="font-bold">Baixe nosso App</div>
                      <div className="text-[9px] opacity-90">Ofertas exclusivas na palma da mão</div>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 shadow-sm"
                      style={{
                        backgroundColor: getColor("--pwa-banner-btn-bg", "#FFFFFF"),
                        color: getColor("--pwa-banner-btn-text", "#705BC2")
                      }}
                    >
                      Instalar
                    </button>
                  </div>
                </div>

                {/* Footer Mock */}
                <div
                  className="p-3.5 border-t border-black/10 flex flex-col gap-2 transition-colors mt-auto text-center"
                  style={{
                    backgroundColor: getColor("--footer-bg", "#1E1B4B"),
                    color: getColor("--footer-text", "#FFFFFF")
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    {["Instagram", "Facebook", "WhatsApp"].map((social, idx) => (
                      <span
                        key={idx}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm"
                        style={{
                          backgroundColor: getColor("--social-icons-bg", "#FFFFFF"),
                          color: getColor("--social-icons", "#705BC2")
                        }}
                      >
                        {social.charAt(0)}
                      </span>
                    ))}
                  </div>
                  <div className="text-[9px] opacity-80">
                    © {new Date().getFullYear()} {currentPharmacy?.nome || "Loja Parceira"}
                  </div>
                </div>

              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Salvando cores..." : "Salvar e Aplicar Cores na Loja"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-2 rounded-lg hover:bg-slate-50/80 transition">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className="w-8 h-8 rounded-full border border-slate-300 shadow-sm shrink-0 mt-0.5 transition-colors"
          style={{ backgroundColor: value || "#000000" }}
        />
        <div className="min-w-0 flex-1">
          <Label className="text-xs font-bold text-slate-800 block cursor-pointer">{label}</Label>
          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Input
          type="color"
          className="w-9 h-8 p-0.5 cursor-pointer rounded-md border-slate-200 shrink-0"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
        />
        <Input
          type="text"
          className="font-mono uppercase w-24 h-8 text-xs font-bold"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
