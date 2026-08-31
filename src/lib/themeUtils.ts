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
  "--tarja-bg",
  "--tarja-text",
  "--tarja-icon",
  "--all-cats-text",
  "--all-cats-icon",
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
