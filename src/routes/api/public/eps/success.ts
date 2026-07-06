import { createFileRoute } from "@tanstack/react-router";
import { extractTranId, redirectToOrder } from "@/lib/eps-return";

/* EPS "success_url" — buyer lands here after paying. IPN handles the
 * authoritative status update; we just bounce to the order page. */

export const Route = createFileRoute("/api/public/eps/success")({
  server: {
    handlers: {
      GET: async ({ request }) => redirectToOrder(await extractTranId(request), "success"),
      POST: async ({ request }) => redirectToOrder(await extractTranId(request), "success"),
    },
  },
});
