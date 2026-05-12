import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { rowToProduct } from "@/data/products";

export const Route = createFileRoute("/api/public/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug");

        let query = supabaseAdmin
          .from("products")
          .select(
            "slug,name,emoji,gradient,category,badge,tagline,description,delivery_time,warranty,features,plans,image_url",
          )
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (slug) query = query.eq("slug", slug).limit(1);

        const { data, error } = await query;
        if (error) {
          return Response.json(
            { error: "Products could not be loaded" },
            { status: 500 },
          );
        }

        const products = (data ?? []).map((row) => rowToProduct(row as never));
        return Response.json(slug ? (products[0] ?? null) : products, {
          headers: {
            "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
          },
        });
      },
    },
  },
});