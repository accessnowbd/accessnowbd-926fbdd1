import { createFileRoute } from "@tanstack/react-router";
import { validateCouponServer } from "@/lib/lucky-coupon.functions";

export const Route = createFileRoute("/api/public/lucky-coupon/validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const result = await validateCouponServer({
            data: {
              code: body.code || "",
              subtotal: Number(body.subtotal || 0),
            },
          });
          return Response.json(result);
        } catch (err: unknown) {
          return Response.json(
            { valid: false, reason: err instanceof Error ? err.message : "Validation failed" },
            { status: 400 }
          );
        }
      },
    },
  },
});
