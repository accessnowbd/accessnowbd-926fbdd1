import { defineMcp } from "@lovable.dev/mcp-js";
import listProductsTool from "./tools/list-products";
import getProductTool from "./tools/get-product";
import listCategoriesTool from "./tools/list-categories";

export default defineMcp({
  name: "accessnowbd-mcp",
  title: "AccessNow BD MCP",
  version: "0.1.0",
  instructions:
    "Tools for browsing the AccessNow BD storefront. Use `list_categories` to see product categories, `list_products` to browse (optionally by category), and `get_product` for full details of a single product by slug.",
  tools: [listProductsTool, getProductTool, listCategoriesTool],
});
