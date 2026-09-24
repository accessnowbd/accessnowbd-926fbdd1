import { createFileRoute } from "@tanstack/react-router";
import { checkLuckyEligibility } from "@/lib/lucky-coupon.functions";

export const Route = createFileRoute("/api/public/lucky-coupon/campaign")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const visitorId = url.searchParams.get("visitorId") || url.searchParams.get("visitor_id") || "anonymous";
          const userId = url.searchParams.get("userId") || url.searchParams.get("user_id") || undefined;

          const result = await checkLuckyEligibility({
            data: {
              visitorId,
              userId: userId || undefined,
            },
          });

          return Response.json(result);
        } catch (err: unknown) {
          return Response.json(
            { error: err instanceof Error ? err.message : "Error checking campaign" },
            { status: 500 }
          );
        }
      },
    },
  },
});
