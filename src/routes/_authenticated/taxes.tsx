import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/taxes")({
  head: () => ({ meta: [{ title: "Taxes & Payments — Gram Panchayat Portal" }, { name: "description", content: "View and pay property and water tax." }] }),
  component: Taxes,
});

function Taxes() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["taxes", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("tax_records").select("*").eq("user_id", user!.id).order("created_at")).data ?? [],
  });

  const pay = async (id: string) => {
    const { data: r, error } = await supabase.rpc("pay_tax", { _id: id });
    if (error) return toast.error(error.message);
    toast.success(`Payment successful. Receipt: ${r.receipt_no}`);
    qc.invalidateQueries({ queryKey: ["taxes"] });
  };

  return (
    <>
      <PageTitle title={t("taxes")} sub="Demo payment — no real money is charged." />
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tax</TableHead><TableHead>Year</TableHead><TableHead>Amount</TableHead>
                <TableHead>Due</TableHead><TableHead>{t("status")}</TableHead><TableHead>Receipt</TableHead><TableHead />
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
                  <TableCell className="font-mono text-xs">{r.receipt_no ?? "—"}</TableCell>
                  <TableCell>
                    {r.status === "unpaid" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="sm">{t("payNow")}</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm payment</AlertDialogTitle>
                            <AlertDialogDescription>Pay ₹{r.amount} {r.tax_type} tax for {r.financial_year}?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => pay(r.id)}>{t("payNow")}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
