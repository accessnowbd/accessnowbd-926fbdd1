import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_product",
  title: "Get product",
  description: "Get full details for a single product by slug, including plans and pricing.",
  inputSchema: {
    slug: z.string().min(1).describe("Product slug, e.g. 'netflix-premium'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const { data, error } = await publicClient()
      .from("products")
      .select(
        "slug,name,emoji,category,badge,tagline,description,delivery_time,warranty,features,plans,image_url,short_description",
      )
      .eq("is_active", true)
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No product found for slug: ${slug}` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { product: data },
    };
  },
});
