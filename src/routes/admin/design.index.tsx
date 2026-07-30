import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/design/")({
  beforeLoad: () => {
    throw redirect({
      to: "/admin/design/logo",
    });
  },
});
