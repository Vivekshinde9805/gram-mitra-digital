import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { openDoc } from "./applications";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["app_status"];
const STATUSES: Status[] = ["pending", "in_review", "approved", "rejected", "completed"];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Gram Panchayat Portal" }, { name: "description", content: "Manage applications, complaints, taxes and notices." }] }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin"],
    enabled: isAdmin,
    queryFn: async () => {
      const [a, c, tx, p] = await Promise.all([
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("complaints").select("*").order("created_at", { ascending: false }),
        supabase.from("tax_records").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id,full_name,email,village"),
      ]);
      return { apps: a.data ?? [], complaints: c.data ?? [], taxes: tx.data ?? [], profiles: p.data ?? [] };
    },
  });

  if (loading) return null;
  if (!isAdmin) return <p className="text-muted-foreground">You do not have admin access.</p>;

  const name = (id: string) => data?.profiles.find((p) => p.id === id)?.full_name ?? "—";
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const update = async (table: "applications" | "complaints", id: string, patch: { status?: Status; admin_remark?: string }) => {
    const { error } = await supabase.from(table).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    refresh();
  };

  const addTax = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const amount = Number(f.get("amount"));
    if (!f.get("user_id") || !(amount > 0)) return toast.error("Select villager and valid amount");
    const { error } = await supabase.from("tax_records").insert({
      user_id: String(f.get("user_id")), tax_type: String(f.get("tax_type")), financial_year: String(f.get("year")), amount, due_date: String(f.get("due")) || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Tax record added"); e.currentTarget.reset(); refresh();
  };

  const addNotice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if ((f.title ?? "").trim().length < 3) return toast.error("Title required");
    const { error } = await supabase.from("notices").insert({ title: f.title ?? "", title_mr: f.title_mr || null, body: f.body || null, body_mr: f.body_mr || null });
    if (error) return toast.error(error.message);
    toast.success("Notice published"); form.reset(); qc.invalidateQueries({ queryKey: ["panchayat"] });
  };

  const stat = (s: Status) => data?.apps.filter((a) => a.status === s).length ?? 0;

  return (
    <>
      <PageTitle title={t("admin")} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-xl border bg-card p-3"><p className="text-2xl font-bold text-primary">{stat(s)}</p><StatusBadge status={s} /></div>
        ))}
      </div>
      <Tabs defaultValue="apps">
        <TabsList className="flex w-full flex-wrap justify-start sm:w-fit">
          <TabsTrigger value="apps">{t("applications")}</TabsTrigger>
          <TabsTrigger value="complaints">{t("complaints")}</TabsTrigger>
          <TabsTrigger value="taxes">{t("taxes")}</TabsTrigger>
          <TabsTrigger value="notices">{t("notices")}</TabsTrigger>
        </TabsList>

        <TabsContent value="apps">
          <Card><CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>{t("refNo")}</TableHead><TableHead>Applicant</TableHead><TableHead>Service</TableHead><TableHead>{t("documents")}</TableHead><TableHead>{t("status")}</TableHead><TableHead>{t("remark")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.apps.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.ref_no}</TableCell>
                    <TableCell><p className="font-medium">{a.applicant_name}</p><p className="text-xs text-muted-foreground">{a.mobile} · {a.address}</p></TableCell>
                    <TableCell>{a.service_type}<p className="max-w-56 text-xs text-muted-foreground">{a.description}</p></TableCell>
                    <TableCell>{a.documents.map((d, i) => <button key={d} onClick={() => openDoc(d)} className="mr-2 text-primary underline">#{i + 1}</button>)}</TableCell>
                    <TableCell><StatusSelect value={a.status} onChange={(s) => update("applications", a.id, { status: s })} /></TableCell>
                    <TableCell><Input defaultValue={a.admin_remark ?? ""} className="min-w-40" onBlur={(e) => e.target.value !== (a.admin_remark ?? "") && update("applications", a.id, { admin_remark: e.target.value })} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="complaints">
          <Card><CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Villager</TableHead><TableHead>Complaint</TableHead><TableHead>{t("status")}</TableHead><TableHead>{t("remark")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.complaints.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{name(c.user_id)}</TableCell>
                    <TableCell><p className="font-medium">{c.subject} <span className="text-xs text-muted-foreground">({c.category})</span></p><p className="max-w-72 text-xs text-muted-foreground">{c.description}</p></TableCell>
                    <TableCell><StatusSelect value={c.status} onChange={(s) => update("complaints", c.id, { status: s })} /></TableCell>
                    <TableCell><Input defaultValue={c.admin_remark ?? ""} className="min-w-40" onBlur={(e) => e.target.value !== (c.admin_remark ?? "") && update("complaints", c.id, { admin_remark: e.target.value })} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="taxes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Add tax record</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={addTax} className="grid gap-3 sm:grid-cols-6">
                <select name="user_id" className="h-9 rounded-md border bg-background px-2 text-sm sm:col-span-2">
                  <option value="">Select villager</option>
                  {data?.profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name ?? p.email} — {p.village}</option>)}
                </select>
                <select name="tax_type" className="h-9 rounded-md border bg-background px-2 text-sm"><option>property</option><option>water</option><option>other</option></select>
                <Input name="year" defaultValue="2026-27" />
                <Input name="amount" type="number" placeholder="Amount ₹" />
                <Input name="due" type="date" />
                <Button className="sm:col-span-6 sm:w-fit">Add</Button>
              </form>
            </CardContent>
          </Card>
          <Card><CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHeader><TableRow><TableHead>Villager</TableHead><TableHead>Tax</TableHead><TableHead>Year</TableHead><TableHead>Amount</TableHead><TableHead>{t("status")}</TableHead><TableHead>Receipt</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.taxes.map((r) => (
                  <TableRow key={r.id}><TableCell>{name(r.user_id)}</TableCell><TableCell className="capitalize">{r.tax_type}</TableCell><TableCell>{r.financial_year}</TableCell><TableCell>₹{r.amount}</TableCell><TableCell><StatusBadge status={r.status} /></TableCell><TableCell className="font-mono text-xs">{r.receipt_no ?? "—"}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="notices">
          <Card className="max-w-2xl">
            <CardHeader><CardTitle>Publish notice</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={addNotice} className="space-y-3">
                <Input name="title" placeholder="Title (English)" required />
                <Input name="title_mr" placeholder="शीर्षक (मराठी)" />
                <Textarea name="body" placeholder="Details (English)" />
                <Textarea name="body_mr" placeholder="तपशील (मराठी)" />
                <Button>Publish</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function StatusSelect({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  const { t } = useI18n();
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Status)}>
      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}</SelectContent>
    </Select>
  );
}
