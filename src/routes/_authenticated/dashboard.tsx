import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { billStatus } from "@/components/CitizenConnections";
import { useAuth } from "@/hooks/useAuth";
import { useI18n, type TKey } from "@/lib/i18n";
import { openDoc } from "./applications";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Gram Panchayat Portal" }, { name: "description", content: "Manage applications, payments, connections and notices." }] }),
  component: AdminDashboard,
});

type Row = Record<string, string | number | null>;

function exportCsv(name: string, rows: Row[]) {
  if (!rows.length) return toast.error("—");
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

function Filters({ statuses, status, setStatus, q, setQ, onExport }: { statuses: string[]; status: string; setStatus: (s: string) => void; q: string; setQ: (s: string) => void; onExport: () => void }) {
  const { t } = useI18n();
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
        <option value="">{t("all")}</option>
        {statuses.map((s) => <option key={s} value={s}>{t(s as TKey) ?? s}</option>)}
      </select>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="max-w-xs" />
      <Button variant="outline" onClick={onExport} className="ml-auto"><Download className="h-4 w-4" />{t("exportCsv")}</Button>
    </div>
  );
}

const match = (q: string, ...v: (string | null | undefined)[]) => !q || v.some((x) => x?.toLowerCase().includes(q.toLowerCase()));

function AdminDashboard() {
  const { isAdmin, loading } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [aSt, setASt] = useState(""), [aQ, setAQ] = useState("");
  const [pSt, setPSt] = useState(""), [pQ, setPQ] = useState("");
  const [cQ, setCQ] = useState(""), [cSt, setCSt] = useState("");

  const { data } = useQuery({
    queryKey: ["admin"],
    enabled: isAdmin,
    queryFn: async () => {
      const [a, c, tx, p, cc, mb] = await Promise.all([
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("complaints").select("*").order("created_at", { ascending: false }),
        supabase.from("tax_records").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id,full_name,mobile"),
        supabase.from("citizen_connections").select("*").order("created_at", { ascending: false }),
        supabase.from("monthly_bills").select("*").order("created_at", { ascending: false }),
      ]);
      return { apps: a.data ?? [], complaints: c.data ?? [], taxes: tx.data ?? [], profiles: p.data ?? [], conns: cc.data ?? [], bills: mb.data ?? [] };
    },
  });

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/citizen" />;

  const prof = (id: string) => data?.profiles.find((p) => p.id === id);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });
  const done = (error: { message: string } | null) => { if (error) return toast.error(error.message); toast.success(t("saved")); refresh(); };

  // Applications
  const apps = (data?.apps ?? []).filter((a) => (!aSt || a.status === aSt) && match(aQ, a.applicant_name, a.mobile));

  // Payments: tax records + monthly bills
  const payments = [
    ...(data?.taxes ?? []).map((r) => ({
      id: r.id, kind: "tax" as const, name: prof(r.user_id)?.full_name ?? "", mobile: prof(r.user_id)?.mobile ?? "",
      type: `Tax: ${r.tax_type} ${r.financial_year}`, status: r.status === "verifying" ? "Pending" : r.status === "paid" ? "Paid" : r.status === "rejected" ? "Unpaid" : "Unpaid",
      amount: Number(r.amount), date: (r.submitted_at ?? r.created_at).slice(0, 10), utr: r.utr ?? "", remark: r.admin_remark ?? "",
    })),
    ...(data?.bills ?? []).map((b) => {
      const c = data?.conns.find((x) => x.id === b.connection_id);
      const p = c ? prof(c.citizen_id) : undefined;
      return {
        id: b.id, kind: "bill" as const, name: p?.full_name ?? "", mobile: p?.mobile ?? "",
        type: `${c?.type ?? ""} ${c?.connection_no ?? ""} (${b.month}/${b.year})`, status: billStatus(b),
        amount: Number(b.amount), date: (b.submitted_at ?? b.created_at).slice(0, 10), utr: b.utr ?? "", remark: b.admin_remark ?? "",
      };
    }),
  ].filter((r) => (!pSt || r.status === pSt) && match(pQ, r.name, r.mobile, r.utr));

  const setPayment = async (r: (typeof payments)[number], ok: boolean, remark: string) => {
    const now = new Date().toISOString();
    if (r.kind === "tax") {
      const { error } = await supabase.from("tax_records").update(ok
        ? { status: "paid", paid_at: now, receipt_no: "RCPT-" + crypto.randomUUID().slice(0, 8).toUpperCase(), admin_remark: remark || null }
        : { status: "rejected", admin_remark: remark || null }).eq("id", r.id);
      done(error);
    } else {
      const { error } = await supabase.from("monthly_bills").update(ok ? { status: "Paid", paid_at: now, admin_remark: remark || null } : { status: "Unpaid", admin_remark: remark || null }).eq("id", r.id);
      done(error);
    }
  };

  // Connections
  const conns = (data?.conns ?? []).filter((c) => (!cSt || c.status === cSt) && match(cQ, prof(c.citizen_id)?.full_name, prof(c.citizen_id)?.mobile, c.connection_no));

  const addBill = (connection_id: string) => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const [year, month] = String(f.get("ym")).split("-").map(Number);
    const amount = Number(f.get("amount"));
    if (!year || !month || !(amount > 0)) return toast.error(`${t("month")} / ${t("amount")}`);
    const { error } = await supabase.from("monthly_bills").insert({
      connection_id, year, month, amount, units: f.get("units") ? Number(f.get("units")) : null, due_date: String(f.get("due")) || null,
    });
    if (error) return toast.error(error.code === "23505" ? `${month}/${year} ✗` : error.message);
    form.reset(); done(null);
  };

  return (
    <>
      <PageTitle title={t("admin")} />
      <Tabs defaultValue="apps">
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          {(["applications", "payments", "connections", "complaints", "notices", "settings"] as TKey[]).map((k) => (
            <TabsTrigger key={k} value={k === "applications" ? "apps" : k}>{t(k)}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="apps">
          <Card><CardContent className="overflow-x-auto pt-6">
            <Filters statuses={["pending", "in_review", "approved", "rejected", "completed"]} status={aSt} setStatus={setASt} q={aQ} setQ={setAQ}
              onExport={() => exportCsv("applications", apps.map((a) => ({ ref: a.ref_no, name: a.applicant_name, mobile: a.mobile, type: a.service_type, status: a.status, date: a.created_at.slice(0, 10), remark: a.admin_remark })))} />
            <Table>
              <TableHeader><TableRow><TableHead>{t("fullName")}</TableHead><TableHead>{t("type")}</TableHead><TableHead>{t("date")}</TableHead><TableHead>{t("documents")}</TableHead><TableHead>{t("status")}</TableHead><TableHead>{t("remark")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {apps.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground">{t("noRecords")}</TableCell></TableRow>}
                {apps.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell><p className="font-medium">{a.applicant_name}</p><p className="text-xs text-muted-foreground">{a.mobile} · {a.ref_no}</p></TableCell>
                    <TableCell>{a.service_type}<p className="max-w-56 text-xs text-muted-foreground">{a.description}</p></TableCell>
                    <TableCell>{a.created_at.slice(0, 10)}</TableCell>
                    <TableCell>{a.documents.map((d, i) => <button key={d} onClick={() => openDoc(d)} className="mr-2 text-primary underline">#{i + 1}</button>)}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell><RemarkActions initial={a.admin_remark} okLabel={t("approve")}
                      onAct={async (ok, remark) => done((await supabase.from("applications").update({ status: ok ? "approved" : "rejected", admin_remark: remark || null }).eq("id", a.id)).error)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card><CardContent className="overflow-x-auto pt-6">
            <Filters statuses={["Pending", "Unpaid", "Overdue", "Paid"]} status={pSt} setStatus={setPSt} q={pQ} setQ={setPQ}
              onExport={() => exportCsv("payments", payments.map(({ id: _id, kind: _k, ...r }) => r))} />
            <Table>
              <TableHeader><TableRow><TableHead>{t("fullName")}</TableHead><TableHead>{t("type")}</TableHead><TableHead>{t("amount")}</TableHead><TableHead>{t("date")}</TableHead><TableHead>{t("utr")}</TableHead><TableHead>{t("status")}</TableHead><TableHead>{t("remark")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {payments.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground">{t("noRecords")}</TableCell></TableRow>}
                {payments.map((r) => (
                  <TableRow key={r.kind + r.id}>
                    <TableCell><p className="font-medium">{r.name || "—"}</p><p className="text-xs text-muted-foreground">{r.mobile}</p></TableCell>
                    <TableCell className="text-sm">{r.type}</TableCell>
                    <TableCell className="font-semibold">₹{r.amount}</TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell className="font-mono text-xs">{r.utr || "—"}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>{r.status === "Pending"
                      ? <RemarkActions initial={r.remark} okLabel={t("verify")} onAct={(ok, remark) => setPayment(r, ok, remark)} />
                      : <span className="text-xs text-muted-foreground">{r.remark}</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="connections">
          <Card><CardContent className="pt-6">
            <Filters statuses={["Pending", "Verified"]} status={cSt} setStatus={setCSt} q={cQ} setQ={setCQ}
              onExport={() => exportCsv("connections", conns.map((c) => ({ name: prof(c.citizen_id)?.full_name ?? "", mobile: prof(c.citizen_id)?.mobile ?? "", type: c.type, connection_no: c.connection_no, meter_no: c.meter_no, address: c.address, status: c.status })))} />
            {conns.length === 0 && <p className="text-muted-foreground">{t("noConnections")}</p>}
            <div className="space-y-3">
              {conns.map((c) => (
                <div key={c.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{prof(c.citizen_id)?.full_name ?? "—"} · {prof(c.citizen_id)?.mobile}</p>
                      <p className="text-sm">{c.type} · <span className="font-mono">{c.connection_no}</span>{c.meter_no && ` · ${t("meterNo")}: ${c.meter_no}`}</p>
                      <p className="text-xs text-muted-foreground">{c.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      {c.status === "Pending" && <Button size="sm" onClick={async () => done((await supabase.from("citizen_connections").update({ status: "Verified" }).eq("id", c.id)).error)}>{t("verify")}</Button>}
                    </div>
                  </div>
                  <form onSubmit={addBill(c.id)} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <Input name="ym" type="month" required aria-label={t("month")} />
                    <Input name="units" type="number" placeholder={t("units")} />
                    <Input name="amount" type="number" step="0.01" placeholder={`${t("amount")} ₹`} required />
                    <Input name="due" type="date" aria-label={t("dueDate")} />
                    <Button size="sm" className="h-9">{t("addBill")}</Button>
                  </form>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {data?.bills.filter((b) => b.connection_id === c.id).map((b) => `${b.month}/${b.year}: ₹${b.amount} (${t(billStatus(b) as TKey)})`).join(" · ") || t("noBills")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="complaints">
          <Card><CardContent className="space-y-3 pt-6">
            {data?.complaints.length === 0 && <p className="text-muted-foreground">{t("noRecords")}</p>}
            {data?.complaints.map((c) => (
              <div key={c.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2"><p className="font-semibold">{c.subject} <span className="text-xs text-muted-foreground">({c.category})</span></p><StatusBadge status={c.status} /></div>
                <p className="text-xs text-muted-foreground">{prof(c.user_id)?.full_name} · {prof(c.user_id)?.mobile} · {c.created_at.slice(0, 10)}</p>
                <p className="my-1 text-sm">{c.description}</p>
                <RemarkActions initial={c.admin_remark} okLabel={t("completed")}
                  onAct={async (ok, remark) => done((await supabase.from("complaints").update({ status: ok ? "completed" : "rejected", admin_remark: remark || null }).eq("id", c.id)).error)} />
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="notices">
          <Card className="max-w-2xl">
            <CardHeader><CardTitle>{t("notices")}</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
                if ((f.title ?? "").trim().length < 3) return toast.error("Title");
                const { error } = await supabase.from("notices").insert({ title: f.title ?? "", title_mr: f.title_mr || null, body: f.body || null, body_mr: f.body_mr || null });
                if (!error) { form.reset(); qc.invalidateQueries({ queryKey: ["panchayat"] }); }
                done(error);
              }}>
                <Input name="title" placeholder="Title (English)" required />
                <Input name="title_mr" placeholder="शीर्षक (मराठी)" />
                <Textarea name="body" placeholder="Details (English)" />
                <Textarea name="body_mr" placeholder="तपशील (मराठी)" />
                <Button>{t("submit")}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings"><UpiSettings /></TabsContent>
      </Tabs>
    </>
  );
}

function RemarkActions({ initial, okLabel, onAct }: { initial: string | null; okLabel: string; onAct: (ok: boolean, remark: string) => void }) {
  const { t } = useI18n();
  const [remark, setRemark] = useState(initial ?? "");
  return (
    <div className="flex min-w-56 flex-wrap gap-1.5">
      <Input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder={t("remark")} className="h-8 flex-1" />
      <Button size="sm" onClick={() => onAct(true, remark)}>{okLabel}</Button>
      <Button size="sm" variant="outline" onClick={() => onAct(false, remark)}>{t("reject")}</Button>
    </div>
  );
}

function UpiSettings() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["upi"],
    queryFn: async () => (await supabase.from("panchayat_info").select("upi_id,upi_name").eq("id", 1).maybeSingle()).data,
  });
  if (!data) return null;
  return (
    <Card className="max-w-xl">
      <CardHeader><CardTitle>{t("settings")} · {t("upiId")}</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:grid-cols-3" onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const upi_id = String(f.get("upi_id")).trim();
          if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi_id)) return toast.error("name@oksbi");
          const { error } = await supabase.from("panchayat_info").update({ upi_id, upi_name: String(f.get("upi_name")).trim() }).eq("id", 1);
          if (error) return toast.error(error.message);
          toast.success(t("saved")); qc.invalidateQueries({ queryKey: ["upi"] });
        }}>
          <Input name="upi_id" defaultValue={data.upi_id ?? ""} placeholder={t("upiId")} />
          <Input name="upi_name" defaultValue={data.upi_name ?? ""} placeholder={t("fullName")} />
          <Button className="sm:w-fit">{t("save")}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
