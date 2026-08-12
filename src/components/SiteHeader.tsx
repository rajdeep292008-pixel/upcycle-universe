import { Link, useNavigate } from "@tanstack/react-router";
import { Leaf, Menu, PenLine } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/support", label: "Support makers" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-display text-xl leading-none">Rewoven</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-foreground" }}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button asChild size="sm">
                <Link to="/share">
                  <PenLine className="h-4 w-4" /> Share a creation
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/me">My studio</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth">Join free</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Open menu"
          className="ml-auto rounded-md p-2 text-muted-foreground md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/share" onClick={() => setOpen(false)}>
                  Share a creation
                </Link>
                <Link to="/me" onClick={() => setOpen(false)}>
                  My studio
                </Link>
                <button
                  type="button"
                  className="text-left"
                  onClick={async () => {
                    setOpen(false);
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)}>
                Sign in / Join
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
