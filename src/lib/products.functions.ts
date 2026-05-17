import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { rowToProduct, type Product } from "@/data/products";

export const listProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(
        "slug,name,emoji,gradient,category,badge,tagline,description,delivery_time,warranty,features,plans,image_url",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error("Products could not be loaded");
    return (data ?? []).map((row) => rowToProduct(row as never));
  },
);

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }): Promise<Product | null> => {
    const { data: rows, error } = await supabaseAdmin
      .from("products")
      .select(
        "slug,name,emoji,gradient,category,badge,tagline,description,delivery_time,warranty,features,plans,image_url",
      )
      .eq("is_active", true)
      .eq("slug", data.slug)
      .limit(1);
    if (error) throw new Error("Product could not be loaded");
    const row = rows?.[0];
    return row ? rowToProduct(row as never) : null;
  });
