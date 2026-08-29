import { create } from "zustand";

interface AppInstallState {
  isOpen: boolean;
  deferredPrompt: any;
  open: () => void;
  close: () => void;
  setDeferredPrompt: (prompt: any) => void;
  triggerInstall: () => Promise<boolean>;
}

export const useAppInstallStore = create<AppInstallState>((set, get) => ({
  isOpen: false,
  deferredPrompt: typeof window !== "undefined" ? (window as any).deferredPWAInstallPrompt || null : null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setDeferredPrompt: (prompt: any) => set({ deferredPrompt: prompt }),
  triggerInstall: async () => {
    const prompt = get().deferredPrompt || (typeof window !== "undefined" ? (window as any).deferredPWAInstallPrompt : null);
    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice?.outcome === "accepted") {
          set({ isOpen: false, deferredPrompt: null });
          if (typeof window !== "undefined") {
            (window as any).deferredPWAInstallPrompt = null;
          }
          return true;
        }
      } catch (err) {
        console.warn("PWA install prompt error:", err);
      }
    }
    return false;
  },
}));
