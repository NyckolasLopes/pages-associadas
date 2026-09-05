export const STORE_THEME_VARS = [
  "--primary",
  "--primary-foreground",
  "--primary-dark",
  "--secondary",
  "--secondary-foreground",
  "--accent",
  "--accent-foreground",
  "--background",
  "--foreground",
  "--ring",
  "--header-bg",
  "--header-icons",
  "--search-bg",
  "--search-icon",
  "--topbar-bg",
  "--topbar-text",
  "--menu-bg",
  "--menu-text",
  "--footer-bg",
  "--footer-text",
  "--footer-bottom-bg",
  "--footer-bottom-text",
  "--social-icons",
  "--social-icons-bg",
  "--institutional-bg",
  "--pwa-banner-bg",
  "--pwa-banner-text",
  "--pwa-banner-btn-bg",
  "--pwa-banner-btn-text",
  "--cart-btn-bg",
  "--cart-btn-text",
  "--cart-badge-bg",
  "--cart-badge-text",
  "--coupon-badge-bg",
  "--coupon-badge-text",
  "--coupon-badge-border",
  "--tarja-bg",
  "--tarja-text",
  "--tarja-icon",
  "--all-cats-text",
  "--all-cats-icon",
  "--news-bg",
  "--news-text",
  "--news-input-bg",
  "--news-input-text",
  "--news-input-border",
  "--news-btn-bg",
  "--news-btn-text",
  "--price-main",
  "--price-old",
  "--price-discount-badge-bg",
  "--price-discount-badge-text",
  "--headings",
  "--section-desc",
  "--sidebar-background",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
];

export function resetStoreTheme() {
  if (typeof document === "undefined") return;
  STORE_THEME_VARS.forEach((v) => {
    document.documentElement.style.removeProperty(v);
    document.body.style.removeProperty(v);
  });
}

export const STORE_STRIPE_LABELS = [
  "Primária",
  "Secundária",
  "Cabeçalho",
  "Barra Superior",
  "Menu",
  "Rodapé",
] as const;

export function getStoreColorStripes(
  pharmacyOrColors?: any,
  networkDefaultTheme?: Record<string, string>
): [string, string, string, string, string, string] {
  if (!pharmacyOrColors) {
    return ["#00B5AD", "#F37021", "#00B5AD", "#F37021", "#008E88", "#00B5AD"];
  }

  // Support directly passing colors Record<string, string> (like in StoreColorManager or presets)
  const isDirectTheme =
    typeof pharmacyOrColors === "object" &&
    (pharmacyOrColors["--primary"] !== undefined ||
      pharmacyOrColors["primary"] !== undefined);

  const p = isDirectTheme ? {} : (pharmacyOrColors || {});
  let t = isDirectTheme ? pharmacyOrColors : (p.themeColors || {});

  if (typeof t === "string") {
    try {
      t = JSON.parse(t);
    } catch {
      t = {};
    }
  }

  const net = networkDefaultTheme || {};
  const isParceiro = p.categoriaAssociado === "Parceiro" || p.isPleno === false;

  const defaultPrimary = isParceiro ? "#705BC2" : "#00B5AD";
  const defaultSecondary = isParceiro ? "#FE509C" : "#F37021";

  const getColor = (key: string, fallback: string) => {
    let val =
      t[key] ||
      t[`--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`] ||
      t[key.replace(/^--/, "")];

    if (!val && key === "--header-bg" && p.headerBgColor) val = p.headerBgColor;
    if (!val && key === "--topbar-bg" && p.topBarBgColor) val = p.topBarBgColor;

    if (!val && net) {
      val =
        net[key] ||
        net[`--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`] ||
        net[key.replace(/^--/, "")];
    }

    return val || fallback;
  };

  const primary = getColor("--primary", defaultPrimary);
  const secondary = getColor("--secondary", defaultSecondary);
  const headerBg = getColor("--header-bg", primary);
  const topbarBg = getColor("--topbar-bg", secondary);
  const defaultMenu = isParceiro
    ? (primary === "#705BC2" ? "#5944B3" : primary)
    : (primary === "#00B5AD" ? "#008E88" : primary);
  const menuBg = getColor("--menu-bg", defaultMenu);
  const footerBg = getColor("--footer-bg", primary);

  return [primary, secondary, headerBg, topbarBg, menuBg, footerBg];
}

