import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Why Rewoven exists — waste, craft and dignity" },
      {
        name: "description",
        content:
          "Rewoven is a community for makers who turn waste into worth: less pollution, more creativity, more income from home.",
      },
      { property: "og:title", content: "Why Rewoven exists" },
      {
        property: "og:description",
        content: "A community for makers turning waste into worth — less pollution, more creativity, more income.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl leading-tight">Waste is only waste until somebody sees it differently.</h1>

      <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
        <p>
          Cities like Paris, Tokyo and Ljubljana proved something simple: when cleanliness becomes a shared habit,
          everything downstream changes — health, tourism, pride, work. But rules alone don’t build livelihoods. People
          do. Somewhere near you, someone is quietly turning bottles into lamps, tyres into chairs, saris into bags.
        </p>
        <p>
          Rewoven exists for those people. Not as another marketplace where a product floats without a past, but as a
          place where the story travels with the object: what sparked it, what was rescued, what it cost, what it hopes
          to become. A story is what makes a stranger care enough to buy, share, mentor or fund.
        </p>
        <p>
          Anyone belongs here — a solo maker at a kitchen table, a women’s collective, a small recycling unit, a factory
          rerouting its offcuts. The scale doesn’t matter. The intent does.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          { value: "Less", label: "waste burned or buried" },
          { value: "More", label: "creativity out of constraint" },
          { value: "More", label: "income earned from home" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-6">
            <p className="text-3xl">{item.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/share">Share your creation</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/support">Back a maker</Link>
        </Button>
      </div>
    </div>
  );
}
