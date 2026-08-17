import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Leaf, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchComments, fetchCreation, fetchCreationContact } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/creation/$id")({
  head: () => ({
    meta: [
      { title: "A creation on Rewoven" },
      { name: "description", content: "Read the maker's story behind this upcycled creation on Rewoven." },
      { property: "og:title", content: "A creation on Rewoven" },
      { property: "og:description", content: "Read the maker's story behind this upcycled creation." },
    ],
  }),
  component: CreationPage,
});

function CreationPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportAmount, setSupportAmount] = useState("");

  const creation = useQuery({ queryKey: ["creation", id], queryFn: () => fetchCreation(id) });
  const comments = useQuery({ queryKey: ["comments", id], queryFn: () => fetchComments(id) });
  const contact = useQuery({
    queryKey: ["creation-contact", id, user?.id],
    queryFn: () => fetchCreationContact(id),
    enabled: Boolean(user),
  });
  const liked = useQuery({
    queryKey: ["liked", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("likes")
        .select("creation_id")
        .eq("creation_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      return Boolean(data);
    },
  });

  const item = creation.data;

  async function toggleLike() {
    if (!user) return navigate({ to: "/auth" });
    if (liked.data) {
      await supabase.from("likes").delete().eq("creation_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({ creation_id: id, user_id: user.id });
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["liked", id, user.id] }),
      queryClient.invalidateQueries({ queryKey: ["creation", id] }),
    ]);
  }

  async function postComment(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return navigate({ to: "/auth" });
    const body = comment.trim();
    if (!body) return;
    const { error } = await supabase.from("comments").insert({ creation_id: id, user_id: user.id, body });
    if (error) return toast.error(error.message);
    setComment("");
    queryClient.invalidateQueries({ queryKey: ["comments", id] });
  }

  async function sendSupport(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !item) return navigate({ to: "/auth" });
    const { error } = await supabase.from("support_requests").insert({
      creation_id: item.id,
      maker_id: item.user_id,
      supporter_id: user.id,
      kind: supportAmount ? "funding" : "mentorship",
      message: supportMessage.trim() || null,
      amount: supportAmount ? Number(supportAmount) : null,
    });
    if (error) return toast.error(error.message);
    setSupportMessage("");
    setSupportAmount("");
    toast.success("Your offer was sent privately to the maker.");
  }

  if (creation.isLoading) {
    return <p className="mx-auto max-w-3xl px-5 py-16 text-sm text-muted-foreground">Loading…</p>;
  }
  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl">This creation isn’t here</h1>
        <Link to="/explore" className="mt-4 inline-block text-sm underline">
          Back to explore
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.title}
          className="aspect-[4/3] w-full rounded-3xl object-cover"
          loading="lazy"
        />
      ) : null}

      <div className="mt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.category}</p>
        <h1 className="mt-2 text-4xl">{item.title}</h1>
        {item.tagline ? <p className="mt-2 text-lg text-muted-foreground">{item.tagline}</p> : null}

        {item.profile ? (
          <Link
            to="/maker/$handle"
            params={{ handle: item.profile.handle }}
            className="mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
          >
            by {item.profile.display_name}
          </Link>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        {item.materials.map((material) => (
          <span key={material} className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
            {material}
          </span>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {item.waste_diverted_kg ? (
          <span className="inline-flex items-center gap-1">
            <Leaf className="h-4 w-4" /> {item.waste_diverted_kg} kg diverted
          </span>
        ) : null}
        {item.for_sale && item.price ? (
          <span className="font-medium text-foreground">
            {item.currency} {item.price}
          </span>
        ) : null}
        {contact.data ? (
          <span>Contact: {contact.data}</span>
        ) : user ? null : (
          <Link to="/auth" className="underline underline-offset-4">
            Sign in to see maker contact
          </Link>
        )}
      </div>

      <div className="mt-8 whitespace-pre-line text-base leading-relaxed">{item.story}</div>

      <div className="mt-8 flex items-center gap-3">
        <Button variant={liked.data ? "default" : "outline"} size="sm" onClick={toggleLike}>
          <Heart className="h-4 w-4" /> {item.likes + (liked.data ? 0 : 0)}
        </Button>
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" /> {item.comments}
        </span>
      </div>

      {item.seeking_support ? (
        <section className="mt-12 rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5" /> Back this maker
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Offer funding, materials or mentorship. Only the maker sees your message.
          </p>
          <form onSubmit={sendSupport} className="mt-4 space-y-3">
            <Textarea
              rows={4}
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="How would you like to help?"
            />
            <Input
              type="number"
              min="0"
              value={supportAmount}
              onChange={(e) => setSupportAmount(e.target.value)}
              placeholder="Amount you'd consider funding (optional)"
            />
            <Button type="submit" size="sm">
              Send privately
            </Button>
          </form>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="text-xl">Conversation</h2>
        <form onSubmit={postComment} className="mt-4 space-y-3">
          <Textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Encourage the maker, ask about the process…"
          />
          <Button type="submit" size="sm">
            Post comment
          </Button>
        </form>

        <ul className="mt-8 space-y-6">
          {(comments.data ?? []).map((entry) => (
            <li key={entry.id} className="border-b border-border pb-4 last:border-0">
              <p className="text-sm font-medium">{entry.profile?.display_name ?? "A visitor"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{entry.body}</p>
            </li>
          ))}
          {comments.data && comments.data.length === 0 ? (
            <li className="text-sm text-muted-foreground">Be the first to respond.</li>
          ) : null}
        </ul>
      </section>
    </article>
  );
}
