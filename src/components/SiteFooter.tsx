import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sand">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md">
          Rewoven — every object here began as something someone threw away.
        </p>
        <nav className="flex flex-wrap gap-5">
          <Link to="/explore">Explore</Link>
          <Link to="/support">Support makers</Link>
          <Link to="/about">About</Link>
        </nav>
      </div>
    </footer>
  );
}
