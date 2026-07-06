import { createFileRoute } from "@tanstack/react-router";
import { extractTranId, redirectToOrder } from "@/lib/sslcz-return";

export const Route = createFileRoute("/api/public/sslcz/cancel")({
  server: {
    handlers: {
      GET: async ({ request }) => redirectToOrder(await extractTranId(request), "cancel"),
      POST: async ({ request }) => redirectToOrder(await extractTranId(request), "cancel"),
    },
  },
});
