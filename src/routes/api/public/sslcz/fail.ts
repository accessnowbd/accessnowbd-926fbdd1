import { createFileRoute } from "@tanstack/react-router";
import { extractTranId, redirectToOrder } from "@/lib/sslcz-return";

export const Route = createFileRoute("/api/public/sslcz/fail")({
  server: {
    handlers: {
      GET: async ({ request }) => redirectToOrder(await extractTranId(request), "fail"),
      POST: async ({ request }) => redirectToOrder(await extractTranId(request), "fail"),
    },
  },
});
