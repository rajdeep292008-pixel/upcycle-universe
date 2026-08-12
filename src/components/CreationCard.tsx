import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Recycle, Sprout } from "lucide-react";
import type { FeedItem } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export function CreationCard({ item }: { item: FeedItem }) {
  return (
    <Link
      to="/creation/$id"
      params={{ id: item.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="aspect-4/3 overflow-hidden bg-sand">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Recycle className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="capitalize">
            {item.category}
          </Badge>
          {item.for_sale ? <Badge variant="outline">For sale</Badge> : null}
          {item.seeking_support ? (
            <Badge variant="outline" className="border-clay text-clay">
              Seeking support
            </Badge>
          ) : null}
        </div>

        <h3 className="text-xl leading-snug">{item.title}</h3>
        {item.tagline ? <p className="text-sm text-muted-foreground">{item.tagline}</p> : null}
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.story}</p>

        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
          <span className="truncate">by {item.profile?.display_name ?? "a maker"}</span>
          <span className="flex items-center gap-3">
            {item.waste_diverted_kg ? (
              <span className="flex items-center gap-1">
                <Sprout className="h-3.5 w-3.5" />
                {item.waste_diverted_kg} kg
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {item.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {item.comments}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
