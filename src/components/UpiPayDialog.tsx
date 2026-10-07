import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

export function UpiPayDialog({ amount, note, onClose, onSubmit }: { amount: number; note: string; onClose: () => void; onSubmit: (utr: string) => Promise<boolean> }) {
  const { t } = useI18n();
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: upi } = useQuery({
    queryKey: ["upi"],
    queryFn: async () => (await supabase.from("panchayat_info").select("upi_id,upi_name").eq("id", 1).maybeSingle()).data,
  });
  const link = upi?.upi_id ? `upi://pay?pa=${encodeURIComponent(upi.upi_id)}&pn=${encodeURIComponent(upi.upi_name ?? "")}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}` : "";

  const submit = async () => {
    if (!/^[A-Za-z0-9]{8,30}$/.test(utr.trim())) return toast.error(t("utr") + " ✗");
    setBusy(true);
    if (await onSubmit(utr.trim())) onClose();
    setBusy(false);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("pay")} ₹{amount.toLocaleString("en-IN")}</DialogTitle>
          <DialogDescription>{note}</DialogDescription>
        </DialogHeader>
        {link && (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl border bg-card p-3"><QRCodeSVG value={link} size={170} /></div>
            <button className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 font-mono text-sm" onClick={() => { navigator.clipboard.writeText(upi!.upi_id!); toast.success(t("saved")); }}>
              {upi!.upi_id} <Copy className="h-3.5 w-3.5" />
            </button>
            <Button asChild variant="outline" className="w-full sm:hidden"><a href={link}>UPI app</a></Button>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="utr">{t("utr")}</Label>
          <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="427812345678" />
        </div>
        <Button onClick={submit} disabled={busy} className="w-full">{t("submit")}</Button>
      </DialogContent>
    </Dialog>
  );
}
