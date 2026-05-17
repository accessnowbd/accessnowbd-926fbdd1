import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Categories — AccessNow BD" },
      { name: "description", content: "Browse all product categories on AccessNow BD." },
      { property: "og:title", content: "All Categories — AccessNow BD" },
      { property: "og:description", content: "Browse all product categories." },
    ],
  }),
  component: () => (
    <CategoryPage
      title="সব ক্যাটাগরি"
      subtitle="আপনার পছন্দের ক্যাটাগরি বেছে নিন — প্রতিটি ক্যাটাগরিতে সব verified প্রোডাক্ট পাবেন।"
      showFilters
    />
  ),
});
