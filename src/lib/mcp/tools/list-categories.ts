import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_categories",
  title: "List product categories",
  description: "List distinct product categories available in the store.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const { data, error } = await publicClient()
      .from("products")
      .select("category")
      .eq("is_active", true);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const categories = Array.from(new Set((data ?? []).map((r: { category: string }) => r.category).filter(Boolean)));
    return {
      content: [{ type: "text", text: JSON.stringify(categories) }],
      structuredContent: { categories },
    };
  },
});
