import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { CreationCard } from "@/components/CreationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES, fetchFeed } from "@/lib/data";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore upcycled creations — Rewoven" },
      {
        name: "description",
        content:
          "Browse handmade creations made from rescued waste — furniture, decor, fashion, art — each with the maker's story.",
      },
      { property: "og:title", content: "Explore upcycled creations — Rewoven" },
      {
        property: "og:description",
        content: "Browse handmade creations made from rescued waste, each with the maker's story.",
      },
    ],
  }),
  component: Explore,
});

function Explore() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [filter, setFilter] = useState<"all" | "sale" | "support">("all");

  const feed = useQuery({
    queryKey: ["feed", "explore", search, category, filter],
    queryFn: () =>
      fetchFeed({
        search: search.trim() || undefined,
        category,
        onlyForSale: filter === "sale",
        onlySupport: filter === "support",
      }),
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-4xl">Explore creations</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Every piece here started as waste. Read the story, back the maker, or buy the thing itself.
      </p>

      <div className="mt-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creations, materials or stories"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "sale", "support"] as const).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key)}
            >
              {key === "all" ? "Everything" : key === "sale" ? "For sale" : "Seeking support"}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {["all", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                category === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        {feed.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : feed.data && feed.data.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {feed.data.map((item) => (
              <CreationCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nothing matches that yet. Try another search or category.
          </p>
        )}
      </div>
    </div>
  );
}
