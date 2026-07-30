import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppConfig {
  installed: boolean;
  token?: string;
  waNumber?: string;
  merchantId?: string;
  [key: string]: any;
}

interface AppsState {
  installedApps: Record<string, AppConfig>;
  installApp: (id: string, config: Partial<AppConfig>) => void;
  uninstallApp: (id: string) => void;
}

export const useApps = create<AppsState>()(
  persist(
    (set) => ({
      installedApps: {},
      installApp: (id, config) =>
        set((state) => ({
          installedApps: {
            ...state.installedApps,
            [id]: { installed: true, ...config },
          },
        })),
      uninstallApp: (id) =>
        set((state) => {
          const newApps = { ...state.installedApps };
          delete newApps[id];
          return { installedApps: newApps };
        }),
    }),
    {
      name: "apps-storage",
    }
  )
);
