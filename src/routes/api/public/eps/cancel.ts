import { createFileRoute } from "@tanstack/react-router";
import { extractTranId, redirectToOrder } from "@/lib/eps-return";

export const Route = createFileRoute("/api/public/eps/cancel")({
  server: {
    handlers: {
      GET: async ({ request }) => redirectToOrder(await extractTranId(request), "cancel"),
      POST: async ({ request }) => redirectToOrder(await extractTranId(request), "cancel"),
    },
  },
});
