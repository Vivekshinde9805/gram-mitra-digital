import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, Landmark, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useI18n, type TKey } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const authedLinks: { to: string; k: TKey }[] = [
  { to: "/dashboard", k: "dashboard" },
  { to: "/apply", k: "services" },
  { to: "/applications", k: "applications" },
  { to: "/taxes", k: "taxes" },
  { to: "/complaints", k: "complaints" },
  { to: "/assistant", k: "assistant" },
  { to: "/profile", k: "profile" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = user ? [...authedLinks, ...(isAdmin ? [{ to: "/admin", k: "admin" as TKey }] : [])] : [{ to: "/", k: "home" as TKey }];

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={onClick}
          className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/85 hover:bg-primary-foreground/10"
          activeProps={{ className: "bg-primary-foreground/15 text-primary-foreground" }}
        >
          {t(l.k)}
        </Link>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-1.5 bg-gradient-to-r from-accent via-card to-success" />
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground">
              <Landmark className="h-5 w-5" />
            </span>
            <span className="font-display text-base font-bold leading-tight sm:text-lg">{t("appName")}</span>
          </Link>
          <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
            <NavItems />
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-primary-foreground/30 text-xs">
              {(["en", "mr"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1.5 ${lang === l ? "bg-accent text-accent-foreground" : "text-primary-foreground"}`}
                >
                  {l === "en" ? "EN" : "मराठी"}
                </button>
              ))}
            </div>
            {user ? (
              <Button size="sm" variant="secondary" onClick={signOut} className="hidden sm:inline-flex">
                <LogOut className="h-4 w-4" /> {t("logout")}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" asChild>
                <Link to="/auth">{t("login")}</Link>
              </Button>
            )}
            {user && (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-primary-foreground lg:hidden" aria-label="Menu">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-primary text-primary-foreground">
                  <SheetTitle className="text-primary-foreground">{t("appName")}</SheetTitle>
                  <nav className="mt-4 flex flex-col gap-1">
                    <NavItems onClick={() => setOpen(false)} />
                    <button onClick={signOut} className="mt-4 rounded-md px-3 py-2 text-left text-sm hover:bg-primary-foreground/10">
                      {t("logout")}
                    </button>
                  </nav>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">{children}</main>
      <footer className="border-t bg-card py-6 text-center text-sm text-muted-foreground">
        © 2026 {t("appName")} · Digital India
      </footer>
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-primary sm:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
    </div>
  );
}
