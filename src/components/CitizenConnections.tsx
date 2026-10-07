import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Droplets, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { UpiPayDialog } from "@/components/UpiPayDialog";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const billStatus = (b: { status: string; due_date: string | null }) =>
  b.status === "Unpaid" && b.due_date && b.due_date < new Date().toISOString().slice(0, 10) ? "Overdue" : b.status;

type Bill = { id: string; month: number; year: number; units: number | null; amount: number; due_date: string | null; status: string };

export function CitizenConnections() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [paying, setPaying] = useState<Bill | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["myconns", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("citizen_connections").select("*, monthly_bills(*)").eq("citizen_id", user!.id).order("created_at")).data ?? [],
  });

  const add = (type: "Water" | "Electricity") => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const connection_no = (f.connection_no ?? "").trim(), address = (f.address ?? "").trim();
    if (connection_no.length < 3 || address.length < 5) return toast.error(t("connNo") + " / " + t("address"));
    const { error } = await supabase.from("citizen_connections").insert({ citizen_id: user!.id, type, connection_no, meter_no: f.meter_no?.trim() || null, address });
    if (error) return toast.error(error.code === "23505" ? t("duplicateConn") : error.message);
    toast.success(t("saved"));
    form.reset();
    qc.invalidateQueries({ queryKey: ["myconns"] });
  };

  const now = new Date();
  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(["Water", "Electricity"] as const).map((type) => (
          <Card key={type}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg">{type === "Water" ? <Droplets className="h-5 w-5 text-info" /> : <Zap className="h-5 w-5 text-accent" />}{t(type === "Water" ? "addWater" : "addElec")}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={add(type)} className="grid gap-2 sm:grid-cols-2">
                <Input name="connection_no" placeholder={t("connNo")} required />
                <Input name="meter_no" placeholder={t("meterNo")} />
                <Input name="address" placeholder={t("address")} required className="sm:col-span-2" />
                <Button className="sm:w-fit">{t("add")}</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>{t("connections")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {data.length === 0 && <p className="text-muted-foreground">{t("noConnections")}</p>}
          {data.map((c) => {
            const bills = [...(c.monthly_bills as Bill[])].sort((a, b) => b.year - a.year || b.month - a.month);
            const pending = bills.filter((b) => b.status !== "Paid").reduce((s, b) => s + Number(b.amount), 0);
            const cur = bills.find((b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear() && b.status !== "Paid");
            return (
              <div key={c.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{t(c.type === "Water" ? "water" : "electricity")} · <span className="font-mono">{c.connection_no}</span></p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-muted-foreground">{c.meter_no && `${t("meterNo")}: ${c.meter_no} · `}{c.address}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded bg-muted p-2">{t("currentDue")}: <b>₹{cur ? Number(cur.amount) : 0}</b></div>
                  <div className="rounded bg-muted p-2">{t("totalPending")}: <b>₹{pending}</b></div>
                </div>
                {bills.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t("noBills")}</p> : (
                  <div className="mt-2 divide-y">
                    {bills.map((b) => {
                      const st = billStatus(b);
                      return (
                        <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                          <span>{String(b.month).padStart(2, "0")}/{b.year}{b.units != null && ` · ${b.units} ${t("units")}`}</span>
                          <span className="font-semibold">₹{Number(b.amount)}</span>
                          <span className="text-xs text-muted-foreground">{t("dueDate")}: {b.due_date ?? "—"}</span>
                          <StatusBadge status={st} />
                          {(st === "Unpaid" || st === "Overdue") && <Button size="sm" onClick={() => setPaying(b)}>{t("pay")}</Button>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {paying && (
        <UpiPayDialog
          amount={Number(paying.amount)}
          note={`Bill ${paying.month}/${paying.year}`}
          onClose={() => setPaying(null)}
          onSubmit={async (utr) => {
            const { error } = await supabase.rpc("submit_bill_payment", { _id: paying.id, _utr: utr });
            if (error) { toast.error(error.message); return false; }
            toast.success(t("Pending"));
            qc.invalidateQueries({ queryKey: ["myconns"] });
            return true;
          }}
        />
      )}
    </>
  );
}
