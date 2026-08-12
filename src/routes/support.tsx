import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HandHeart, Handshake, Sprout } from "lucide-react";
import { CreationCard } from "@/components/CreationCard";
import { fetchFeed } from "@/lib/data";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Back a maker — Rewoven" },
      {
        name: "description",
        content:
          "Fund, mentor or supply the makers turning waste into livelihoods. Every offer goes privately to the maker.",
      },
      { property: "og:title", content: "Back a maker — Rewoven" },
      { property: "og:description", content: "Fund, mentor or supply makers turning waste into livelihoods." },
    ],
  }),
  component: SupportPage,
});

const WAYS = [
  {
    icon: HandHeart,
    title: "Fund a batch",
    body: "Small, direct money for tools, transport or raw stock. Enough to turn one good week into a business.",
  },
  {
    icon: Handshake,
    title: "Mentor a maker",
    body: "Pricing, photography, packaging, shipping. An hour of your experience can change a maker's year.",
  },
  {
    icon: Sprout,
    title: "Send your waste",
    body: "Workshops, hotels and factories: route offcuts and discards to a maker instead of a landfill.",
  },
];

function SupportPage() {
  const feed = useQuery({ queryKey: ["feed", "support"], queryFn: () => fetchFeed({ onlySupport: true }) });

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-4xl">Back a maker</h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">
        The makers here already do the hard part. What they usually lack is the small push — money for materials, a
        mentor, or a steady supply of the waste they rebuild. Choose one and reach them directly.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {WAYS.map((way) => (
          <div key={way.title} className="rounded-2xl border border-border bg-card p-6">
            <way.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-lg">{way.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{way.body}</p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-2xl">Makers seeking support right now</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(feed.data ?? []).map((item) => (
            <CreationCard key={item.id} item={item} />
          ))}
        </div>
        {feed.data && feed.data.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No open requests today.{" "}
            <Link to="/explore" className="underline">
              Explore creations
            </Link>{" "}
            instead.
          </p>
        ) : null}
      </section>
    </div>
  );
}
