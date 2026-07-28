import { Link, useNavigate } from "@tanstack/react-router";
import { Car, LogOut, ShieldCheck, Receipt } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navLinkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Car className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Torque Motors</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className={navLinkClass}>
            Showroom
          </Link>
          {user && (
            <Link to="/purchases" className={navLinkClass}>
              My purchases
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className={navLinkClass}>
              Inventory
            </Link>
          )}
          <Link to="/api-docs" className={navLinkClass}>
            API
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {isAdmin && (
                <Badge variant="outline" className="hidden gap-1 border-primary/40 text-primary sm:flex">
                  <ShieldCheck className="size-3" /> Admin
                </Badge>
              )}
              <span className="hidden max-w-[14rem] truncate text-sm text-muted-foreground lg:inline">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p className="flex items-center gap-2">
          <Receipt className="size-4" /> Torque Motors — dealership inventory system
        </p>
        <p>Built as a TDD kata · REST API + React SPA</p>
      </div>
    </footer>
  );
}
