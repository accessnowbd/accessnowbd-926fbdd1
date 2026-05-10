import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/streaming")({
  component: () => (
    <CategoryPage
      title="🎬 Streaming Services"
      subtitle="Netflix, Prime Video, HBO Max, Disney+, Apple TV+, Hoichoi, Chorki — সব এক জায়গায়।"
      filter={(c) => c === "Streaming"}
    />
  ),
  head: () => ({
    meta: [
      { title: "Streaming Subscriptions — AccessNow BD" },
      { name: "description", content: "Premium streaming subscriptions: Netflix, Prime Video, HBO Max, Disney+, Apple TV+, Hoichoi, Chorki." },
      { property: "og:title", content: "Streaming Subscriptions — AccessNow BD" },
      { property: "og:description", content: "All major streaming platforms at the best prices in Bangladesh." },
    ],
  }),
});
