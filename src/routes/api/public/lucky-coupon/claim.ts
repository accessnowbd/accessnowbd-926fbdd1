import { createFileRoute } from "@tanstack/react-router";
import { claimLuckyCoupon } from "@/lib/lucky-coupon.functions";

export const Route = createFileRoute("/api/public/lucky-coupon/claim")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const result = await claimLuckyCoupon({
            data: {
              visitorId: body.visitorId || body.visitor_id || "anonymous",
              userId: body.userId || body.user_id || undefined,
              userEmail: body.userEmail || body.user_email || undefined,
            },
          });
          return Response.json(result);
        } catch (err: unknown) {
          return Response.json(
            { success: false, reason: err instanceof Error ? err.message : "Internal error" },
            { status: 400 }
          );
        }
      },
    },
  },
});
