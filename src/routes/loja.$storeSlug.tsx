import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/loja/$storeSlug")({
  beforeLoad: ({ params }) => {
    const slug = params.storeSlug;
    throw redirect({
      to: "/$storeSlug",
      params: { storeSlug: slug },
      replace: true,
    });
  },
});
