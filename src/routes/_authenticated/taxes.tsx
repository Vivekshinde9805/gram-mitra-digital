import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Copy, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Tax = Database["public"]["Tables"]["tax_records"]["Row"];

export const Route = createFileRoute("/_authenticated/taxes")({
  head: () => ({ meta: [{ title: "Taxes & Payments — Gram Panchayat Portal" }, { name: "description", content: "View and pay property and water tax via UPI." }] }),
  component: Taxes,
});

function Taxes() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [bill, setBill] = useState<Tax | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["taxes", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("tax_records").select("*").eq("user_id", user!.id).order("created_at")).data ?? [],
  });
  const { data: upi } = useQuery({
    queryKey: ["upi"],
    queryFn: async () => (await supabase.from("panchayat_info").select("upi_id,upi_name").eq("id", 1).maybeSingle()).data,
  });

  return (
    <>
      <PageTitle title={t("taxes")} sub="Pay by UPI, then enter your transaction ID. The Panchayat office checks it and marks the bill paid." />
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tax</TableHead><TableHead>Year</TableHead><TableHead>Amount</TableHead>
                <TableHead>Due</TableHead><TableHead>{t("status")}</TableHead><TableHead>UTR / Receipt</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground">{t("noRecords")}</TableCell></TableRow>}
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="capitalize">{r.tax_type}</TableCell>
                  <TableCell>{r.financial_year}</TableCell>
                  <TableCell className="font-semibold">₹{Number(r.amount).toLocaleString("en-IN")}</TableCell>
                  <TableCell>{r.due_date}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="font-mono text-xs">{r.receipt_no ?? r.utr ?? "—"}</TableCell>
                  <TableCell>
                    {(r.status === "unpaid" || r.status === "rejected") && (
                      <Button size="sm" onClick={() => setBill(r)}>{t("payUpi")}</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {bill && upi?.upi_id && (
        <PayDialog bill={bill} upiId={upi.upi_id} upiName={upi.upi_name ?? "Gram Panchayat"} onClose={() => setBill(null)} onDone={() => { setBill(null); qc.invalidateQueries({ queryKey: ["taxes"] }); }} />
      )}
    </>
  );
}

function PayDialog({ bill, upiId, upiName, onClose, onDone }: { bill: Tax; upiId: string; upiName: string; onClose: () => void; onDone: () => void }) {
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const note = `${bill.tax_type} tax ${bill.financial_year}`;
  const link = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${bill.amount}&cu=INR&tn=${encodeURIComponent(note)}`;

  const submit = async () => {
    const v = utr.trim();
    if (!/^[A-Za-z0-9]{8,30}$/.test(v)) return toast.error("Enter the 12-digit UPI transaction ID (UTR) from your payment app");
    setBusy(true);
    const { error } = await supabase.rpc("submit_tax_payment", { _id: bill.id, _utr: v });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Payment submitted. The Panchayat office will verify it shortly.");
    onDone();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pay ₹{Number(bill.amount).toLocaleString("en-IN")}</DialogTitle>
          <DialogDescription className="capitalize">{note} · Demo UPI account</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl border bg-card p-3"><QRCodeSVG value={link} size={180} /></div>
          <p className="text-xs text-muted-foreground">Scan with GPay, PhonePe, Paytm or BHIM</p>
          <button
            className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 font-mono text-sm"
            onClick={() => { navigator.clipboard.writeText(upiId); toast.success("UPI ID copied"); }}
          >
            {upiId} <Copy className="h-3.5 w-3.5" />
          </button>
          <Button asChild variant="outline" className="w-full sm:hidden">
            <a href={link}><Smartphone className="h-4 w-4" /> Open UPI app</a>
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="utr">UPI transaction ID (UTR)</Label>
          <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 427812345678" />
        </div>
        <Button onClick={submit} disabled={busy} className="w-full">I have paid — submit</Button>
      </DialogContent>
    </Dialog>
  );
}
