import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Droplets, Zap, Receipt, MessageSquareWarning, Phone, Mail, MapPin, Clock, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gram Panchayat Shivpur — Digital Services Portal" },
      { name: "description", content: "Apply for water & electricity connections, pay village taxes, track applications and raise complaints online." },
      { property: "og:title", content: "Gram Panchayat Shivpur — Digital Services Portal" },
      { property: "og:description", content: "Village services online in English and Marathi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

export function usePanchayat() {
  return useQuery({
    queryKey: ["panchayat"],
    queryFn: async () => {
      const [info, members, notices] = await Promise.all([
        supabase.from("panchayat_info").select("*").eq("id", 1).maybeSingle(),
        supabase.from("panchayat_members").select("*").order("sort_order"),
        supabase.from("notices").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      return { info: info.data, members: members.data ?? [], notices: notices.data ?? [] };
    },
  });
}

function Index() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { data } = usePanchayat();
  const info = data?.info;
  const mr = lang === "mr";

  const services = [
    { icon: Droplets, k: "water" as const },
    { icon: Zap, k: "electricity" as const },
    { icon: Receipt, k: "taxes" as const },
    { icon: MessageSquareWarning, k: "complaints" as const },
  ];

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/30 blur-2xl" />
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">
          {mr ? info?.name_mr : info?.name} · {info?.district}, {info?.state}
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">{t("heroTitle")}</h1>
        <p className="mt-4 max-w-2xl text-primary-foreground/85">{t("heroSub")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
            <Link to={user ? "/dashboard" : "/auth"}>{t("getStarted")}</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link to={user ? "/assistant" : "/auth"}>
              <Bot className="h-4 w-4" /> {t("assistant")}
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {services.map((s) => (
          <Link key={s.k} to={user ? "/apply" : "/auth"} className="group rounded-xl border bg-card p-4 transition hover:border-primary">
            <s.icon className="h-7 w-7 text-accent" />
            <p className="mt-2 font-semibold">{t(s.k)}</p>
          </Link>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{mr ? info?.name_mr : info?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{mr ? info?.about_mr : info?.about}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                [t("population"), info?.population],
                [t("households"), info?.households],
                [t("area"), info?.area_sq_km],
              ].map(([l, v]) => (
                <div key={String(l)} className="rounded-lg bg-muted p-3">
                  <p className="text-xl font-bold text-primary">{v ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("contact")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-accent" />{info?.address}</p>
            <p className="flex gap-2"><Phone className="h-4 w-4 text-accent" />{info?.phone}</p>
            <p className="flex gap-2 break-all"><Mail className="h-4 w-4 shrink-0 text-accent" />{info?.email}</p>
            <p className="flex gap-2"><Clock className="h-4 w-4 text-accent" />{info?.office_hours}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("members")}</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {data?.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{mr ? m.designation_mr : m.designation} · {m.ward}</p>
                </div>
                <a href={`tel:${m.phone}`} className="text-sm text-primary">{m.phone}</a>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("notices")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data?.notices.map((n) => (
              <div key={n.id} className="rounded-lg border-l-4 border-accent bg-muted/60 p-3">
                <p className="font-semibold">{mr ? n.title_mr : n.title}</p>
                <p className="text-sm text-muted-foreground">{mr ? n.body_mr : n.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
