import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, uploadCreationImage } from "@/lib/data";
import { generateStoryHelp } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/share")({
  head: () => ({
    meta: [
      { title: "Share your creation — Rewoven" },
      {
        name: "description",
        content: "Post your upcycled product with the story behind it, and let an AI helper polish your words.",
      },
      { property: "og:title", content: "Share your creation — Rewoven" },
      {
        property: "og:description",
        content: "Post your upcycled product with the story behind it on Rewoven.",
      },
    ],
  }),
  component: SharePage,
});

function SharePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const askAi = useServerFn(generateStoryHelp);

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [story, setStory] = useState("");
  const [materials, setMaterials] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [waste, setWaste] = useState("");
  const [price, setPrice] = useState("");
  const [forSale, setForSale] = useState(false);
  const [seekingSupport, setSeekingSupport] = useState(false);
  const [contact, setContact] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  async function runAi(mode: "story" | "tagline" | "impact") {
    setAiBusy(mode);
    try {
      const result = await askAi({
        data: { mode, title, materials, notes: story },
      });
      if (!result.text) throw new Error("Empty response");
      if (mode === "tagline") setTagline(result.text.replace(/^"|"$/g, ""));
      else if (mode === "story") setStory(result.text);
      else setStory((current) => `${current}\n\n${result.text}`.trim());
      toast.success("Draft ready — edit it so it sounds like you.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI helper unavailable");
    } finally {
      setAiBusy(null);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let imageUrl: string | null = null;
      if (file) imageUrl = await uploadCreationImage(user.id, file);

      const { data, error } = await supabase
        .from("creations")
        .insert({
          user_id: user.id,
          title: title.trim(),
          tagline: tagline.trim() || null,
          story: story.trim(),
          materials: materials
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
          category,
          waste_diverted_kg: waste ? Number(waste) : null,
          price: price ? Number(price) : null,
          for_sale: forSale,
          seeking_support: seekingSupport,
          image_url: imageUrl,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (contact.trim()) {
        const { error: contactError } = await supabase
          .from("creation_contacts")
          .insert({ creation_id: data.id, user_id: user.id, contact: contact.trim() });
        if (contactError) throw contactError;
      }
      toast.success("Your creation is live.");
      navigate({ to: "/creation/$id", params: { id: data.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-4xl">Share your creation</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The product matters. The story matters more — it is what makes someone care, buy or back you.
      </p>

      <form onSubmit={submit} className="mt-10 space-y-8">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="title">What did you make?</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lamp from three discarded bottles"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="materials">Waste materials used (comma separated)</Label>
            <Input
              id="materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="glass bottles, jute twine, scrap wire"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">One-line tagline</Label>
            <div className="flex gap-2">
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Light from what the street left behind"
              />
              <Button
                type="button"
                variant="outline"
                disabled={aiBusy !== null}
                onClick={() => runAi("tagline")}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="story">Your story: inspiration to product</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={aiBusy !== null}
                onClick={() => runAi("story")}
              >
                <Sparkles className="h-4 w-4" />
                {aiBusy === "story" ? "Writing…" : "Draft with AI"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={aiBusy !== null}
                onClick={() => runAi("impact")}
              >
                Add impact lines
              </Button>
            </div>
          </div>
          <Textarea
            id="story"
            required
            rows={10}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Where the idea came from, what you rescued, what you struggled with, what you hope this becomes…"
          />
          <p className="text-xs text-muted-foreground">
            Write rough notes and press “Draft with AI” — it turns them into a story you can edit.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="photo">Photo of your creation</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="waste">Waste diverted (kg, approx.)</Label>
              <Input id="waste" type="number" min="0" step="0.1" value={waste} onChange={(e) => setWaste(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (optional)</Label>
              <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Available to buy</p>
              <p className="text-xs text-muted-foreground">Show this as for sale in the marketplace filters.</p>
            </div>
            <Switch checked={forSale} onCheckedChange={setForSale} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Looking for support or funding</p>
              <p className="text-xs text-muted-foreground">Backers and mentors can reach you privately.</p>
            </div>
            <Switch checked={seekingSupport} onCheckedChange={setSeekingSupport} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">How buyers can reach you (optional)</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email, phone or shop link"
            />
          </div>
        </section>

        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Publishing…" : "Publish creation"}
        </Button>
      </form>
    </div>
  );
}
