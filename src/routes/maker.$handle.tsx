import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CreationCard } from "@/components/CreationCard";
import { Button } from "@/components/ui/button";
import { fetchFeed, fetchFollowCounts, fetchProfileByHandle } from "@/lib/data";

export const Route = createFileRoute("/maker/$handle")({
  head: () => ({
    meta: [
      { title: "Maker profile — Rewoven" },
      { name: "description", content: "Meet a maker turning waste into worth, and see everything they've built." },
      { property: "og:title", content: "Maker profile — Rewoven" },
      { property: "og:description", content: "Meet a maker turning waste into worth on Rewoven." },
    ],
  }),
  component: MakerPage,
});

function MakerPage() {
  const { handle } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profile = useQuery({ queryKey: ["profile", handle], queryFn: () => fetchProfileByHandle(handle) });
  const makerId = profile.data?.id;

  const creations = useQuery({
    queryKey: ["feed", "maker", makerId],
    queryFn: () => fetchFeed({ userId: makerId as string }),
    enabled: Boolean(makerId),
  });

  const counts = useQuery({
    queryKey: ["follows", makerId],
    queryFn: () => fetchFollowCounts(makerId as string),
    enabled: Boolean(makerId),
  });

  const following = useQuery({
    queryKey: ["following", makerId, user?.id],
    queryFn: async () => {
      if (!user || !makerId) return false;
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", makerId)
        .maybeSingle();
      return Boolean(data);
    },
    enabled: Boolean(makerId),
  });

  async function toggleFollow() {
    if (!user || !makerId) return;
    if (following.data) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", makerId);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: makerId });
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["following", makerId, user.id] }),
      queryClient.invalidateQueries({ queryKey: ["follows", makerId] }),
    ]);
  }

  if (profile.isLoading) {
    return <p className="mx-auto max-w-5xl px-5 py-16 text-sm text-muted-foreground">Loading…</p>;
  }
  if (!profile.data) {
    return <p className="mx-auto max-w-5xl px-5 py-16 text-sm text-muted-foreground">No maker with that handle.</p>;
  }

  const maker = profile.data;
  const totalWaste = (creations.data ?? []).reduce((sum, c) => sum + Number(c.waste_diverted_kg ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <header className="rounded-3xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl">{maker.display_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">@{maker.handle}</p>
            {maker.location ? (
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {maker.location}
              </p>
            ) : null}
          </div>
          {user && user.id !== maker.id ? (
            <Button variant={following.data ? "outline" : "default"} onClick={toggleFollow}>
              {following.data ? "Following" : "Follow"}
            </Button>
          ) : null}
        </div>

        {maker.bio ? <p className="mt-6 max-w-2xl text-base leading-relaxed">{maker.bio}</p> : null}
        {maker.mission ? (
          <p className="mt-4 max-w-2xl border-l-2 border-primary pl-4 text-base italic text-muted-foreground">
            {maker.mission}
          </p>
        ) : null}

        <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { label: "Creations", value: creations.data?.length ?? 0 },
            { label: "Waste diverted", value: `${Math.round(totalWaste)} kg` },
            { label: "Followers", value: counts.data?.followers ?? 0 },
            { label: "Following", value: counts.data?.following ?? 0 },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</dt>
              <dd className="mt-1 text-2xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(creations.data ?? []).map((item) => (
          <CreationCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
