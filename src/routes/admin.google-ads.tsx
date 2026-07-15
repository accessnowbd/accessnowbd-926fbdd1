import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/google-ads")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/fb-pixel" });
  },
});
