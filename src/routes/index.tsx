import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, HeartHandshake, Recycle, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-makers.jpg";
import { Button } from "@/components/ui/button";
import { CreationCard } from "@/components/CreationCard";
import { fetchFeed, fetchImpact } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rewoven — Best out of waste, told story by story" },
      {
        name: "description",
        content:
          "Share upcycled creations with the full story behind them. Meet makers turning waste into income, find buyers and find people who will back your mission.",
      },
      { property: "og:title", content: "Rewoven — Best out of waste, told story by story" },
      {
        property: "og:description",
        content: "A social home for makers turning waste into worth — stories, products and support.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const feed = useQuery({ queryKey: ["feed", "home"], queryFn: () => fetchFeed({ limit: 6 }) });
  const impact = useQuery({ queryKey: ["impact"], queryFn: fetchImpact });

  return (
    <div>
      <section className="paper-grid border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Recycle className="h-3.5 w-3.5" /> best out of waste, made at home
            </p>
            <h1 className="text-5xl leading-[1.05] md:text-6xl">
              Every discarded thing has a second story.
              <em className="block text-primary">Tell yours here.</em>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground">
              Rewoven is a community for people who make something worth keeping out of what others
              throw away. Post the product, but also the story — the spark, the struggle, the
              mission. That story is what earns a buyer, a mentor or a backer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/share">
                  Share your creation <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/explore">Explore the community</Link>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border">
            <img
              src={heroImage}
              alt="Handmade lamp, basket and planter made from bottles, fabric scraps and tin cans"
              width={1600}
              height={1104}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-sand">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:grid-cols-3">
          {[
            { label: "Creations shared", value: impact.data?.creations ?? 0 },
            { label: "Makers in the community", value: impact.data?.makers ?? 0 },
            { label: "Kg of waste given a new life", value: impact.data?.wasteKg ?? 0 },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-4xl text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl">Fresh from the workshop</h2>
            <p className="text-sm text-muted-foreground">The newest creations and the stories behind them.</p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/explore">
              See everything <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {feed.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading creations…</p>
        ) : feed.data && feed.data.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {feed.data.map((item) => (
              <CreationCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <h3 className="text-2xl">No creations yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first maker here. Your story sets the tone for everyone who follows.
            </p>
            <Button asChild className="mt-5">
              <Link to="/share">Share the first creation</Link>
            </Button>
          </div>
        )}
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Story-first listings",
              body: "An AI writing helper turns your rough notes into a story people actually read — in your own honest voice.",
            },
            {
              icon: Recycle,
              title: "Product and purpose together",
              body: "Show the materials rescued, the waste diverted and the price, so buyers know exactly what they are supporting.",
            },
            {
              icon: HeartHandshake,
              title: "Reach the right hands",
              body: "Backers, mentors and buyers can follow your work and send support directly to the makers who need it.",
            },
          ].map((card) => (
            <div key={card.title}>
              <card.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-2xl">{card.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
