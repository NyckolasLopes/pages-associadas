import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

import { GlobalLoading } from "./components/ui/global-loading";
import { NotFoundComponent } from "./routes/__root";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15 * 1000, // 15 segundos de cache ativo (impede storm de queries em transições rápidas)
        gcTime: 30 * 60 * 1000, // 30 minutos de coleta de lixo
        refetchOnWindowFocus: true, // Recarrega quando voltar para a aba se estiver stale (> 15s)
        refetchOnReconnect: true,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30 * 1000,
    defaultPendingComponent: GlobalLoading,
    defaultNotFoundComponent: NotFoundComponent,
    defaultPendingMinMs: 0,
    defaultPendingMs: 150, // Exibe o loader prontamente nas transições
  });

  return router;
};
