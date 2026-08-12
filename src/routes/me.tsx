import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchFeed, fetchMyProfile } from "@/lib/data";
import { CreationCard } from "@/components/CreationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Your workshop — Rewoven" },
      { name: "description", content: "Manage your maker profile, creations and the support offers you receive." },
      { property: "og:title", content: "Your workshop — Rewoven" },
      { property: "og:description", content: "Manage your maker profile and creations on Rewoven." },
    ],
  }),
  component: MePage,
});

function MePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [mission, setMission] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const profile = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: () => fetchMyProfile(user!.id),
    enabled: Boolean(user),
  });

  const creations = useQuery({
    queryKey: ["feed", "mine", user?.id],
    queryFn: () => fetchFeed({ userId: user!.id }),
    enabled: Boolean(user),
  });

  const offers = useQuery({
    queryKey: ["support-offers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_requests")
        .select("*")
        .eq("maker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (profile.data) {
      setDisplayName(profile.data.display_name ?? "");
      setHandle(profile.data.handle ?? "");
      setBio(profile.data.bio ?? "");
      setMission(profile.data.mission ?? "");
      setLocation(profile.data.location ?? "");
    }
  }, [profile.data]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        handle: handle.trim().toLowerCase().replace(/\s+/g, "-"),
        bio: bio.trim() || null,
        mission: mission.trim() || null,
        location: location.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated.");
    queryClient.invalidateQueries({ queryKey: ["my-profile", user.id] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("creations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Creation removed.");
    queryClient.invalidateQueries({ queryKey: ["feed", "mine", user?.id] });
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-4xl">Your workshop</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Keep your story current — people back makers they feel they know.
      </p>

      <form onSubmit={save} className="mt-10 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="display">Display name</Label>
          <Input id="display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="handle">Handle</Label>
          <Input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bio">About you</Label>
          <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="mission">Your mission</Label>
          <Textarea id="mission" rows={2} value={mission} onChange={(e) => setMission(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="flex items-end gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
          {profile.data ? (
            <Link
              to="/maker/$handle"
              params={{ handle: profile.data.handle }}
              className="text-sm underline-offset-4 hover:underline"
            >
              View public page
            </Link>
          ) : null}
        </div>
      </form>

      <section className="mt-14">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Your creations</h2>
          <Button asChild size="sm">
            <Link to="/share">Add new</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(creations.data ?? []).map((item) => (
            <div key={item.id} className="space-y-2">
              <CreationCard item={item} />
              <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
        {creations.data && creations.data.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Nothing published yet.</p>
        ) : null}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl">Support offers</h2>
        <ul className="mt-6 space-y-4">
          {(offers.data ?? []).map((offer) => (
            <li key={offer.id} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{offer.kind}</p>
              <p className="mt-2 text-sm">{offer.message ?? "No message"}</p>
              {offer.amount ? <p className="mt-2 text-sm font-medium">Offered: {offer.amount}</p> : null}
            </li>
          ))}
          {offers.data && offers.data.length === 0 ? (
            <li className="text-sm text-muted-foreground">No offers yet. Mark a creation as seeking support.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
