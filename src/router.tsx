import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

import { GlobalLoading } from "./components/ui/global-loading";
import { NotFoundComponent } from "./routes/__root";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0, // Sempre verifica por novos dados ao navegar (0 min)
        gcTime: 30 * 60 * 1000, // 30 minutos de coleta de lixo
        refetchOnWindowFocus: true, // Recarrega quando voltar para a aba
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
    defaultPendingMinMs: 500, // Tempo mínimo para mostrar o loader (evita piscar rápido)
    defaultPendingMs: 300, // Só mostra o loader se demorar mais que 300ms
  });

  return router;
};
