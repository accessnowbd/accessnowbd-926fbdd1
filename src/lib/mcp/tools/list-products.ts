import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_products",
  title: "List products",
  description: "List all active products in the AccessNow BD store (name, category, tagline, slug).",
  inputSchema: {
    category: z.string().optional().describe("Optional category filter."),
    limit: z.number().int().min(1).optional().describe("Max number of products to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, limit }) => {
    let query = publicClient()
      .from("products")
      .select("slug,name,category,tagline,short_description,badge")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (category) query = query.eq("category", category);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
