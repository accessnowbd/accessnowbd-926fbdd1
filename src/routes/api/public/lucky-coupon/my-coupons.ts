import { createFileRoute } from "@tanstack/react-router";
import { getMyLuckyCoupons } from "@/lib/lucky-coupon.functions";

export const Route = createFileRoute("/api/public/lucky-coupon/my-coupons")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const visitorId = url.searchParams.get("visitorId") || url.searchParams.get("visitor_id") || "";
          const userId = url.searchParams.get("userId") || url.searchParams.get("user_id") || undefined;

          if (!visitorId && !userId) {
            return Response.json([], { status: 200 });
          }

          const coupons = await getMyLuckyCoupons({
            data: {
              visitorId: visitorId || "anon",
              userId: userId || undefined,
            },
          });

          return Response.json(coupons);
        } catch (err: unknown) {
          return Response.json(
            { error: err instanceof Error ? err.message : "Error fetching coupons" },
            { status: 500 }
          );
        }
      },
    },
  },
});
