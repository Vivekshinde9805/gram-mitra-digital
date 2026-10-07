import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { CitizenConnections } from "@/components/CitizenConnections";
import { useQuery } from "@tanstack/react-query";
import { FileText, Receipt, MessageSquareWarning, Bot, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/citizen")({
  head: () => ({ meta: [{ title: "Citizen Home — Gram Panchayat Portal" }, { name: "description", content: "Your village services at a glance." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const { user, isAdmin } = useAuth();
  const { data } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [p, a, tx, c] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle(),
        supabase.from("applications").select("id,ref_no,service_type,status,created_at").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("tax_records").select("amount,status").eq("user_id", user!.id),
        supabase.from("complaints").select("id,status").eq("user_id", user!.id),
      ]);
      return { name: p.data?.full_name, apps: a.data ?? [], taxes: tx.data ?? [], complaints: c.data ?? [] };
    },
  });
  const due = data?.taxes.filter((x) => x.status === "unpaid").reduce((s, x) => s + Number(x.amount), 0) ?? 0;

  const stats = [
    { icon: FileText, label: t("applications"), value: data?.apps.length ?? 0, to: "/applications" },
    { icon: Receipt, label: t("taxes"), value: `₹${due}`, to: "/taxes" },
    { icon: MessageSquareWarning, label: t("complaints"), value: data?.complaints.length ?? 0, to: "/complaints" },
    { icon: Bot, label: t("assistant"), value: "AI", to: "/assistant" },
  ];

  if (isAdmin) return <Navigate to="/dashboard" />;
  return (
    <>
      <PageTitle title={`${t("welcome")}, ${data?.name ?? ""}`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.to} to={s.to as "/"} className="rounded-xl border bg-card p-4 hover:border-primary">
            <s.icon className="h-6 w-6 text-accent" />
            <p className="mt-2 text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>
      <CitizenConnections />
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("applications")}</CardTitle>
          <Link to="/apply" className="flex items-center gap-1 text-sm font-semibold text-primary"><PlusCircle className="h-4 w-4" />{t("services")}</Link>
        </CardHeader>
        <CardContent className="divide-y">
          {data?.apps.length === 0 && <p className="text-muted-foreground">{t("noRecords")}</p>}
          {data?.apps.slice(0, 5).map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="font-semibold">{a.service_type}</p>
                <p className="text-xs text-muted-foreground">{a.ref_no} · {new Date(a.created_at).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
