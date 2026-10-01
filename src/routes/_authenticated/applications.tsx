import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ title: "Track Applications — Gram Panchayat Portal" }, { name: "description", content: "Track the status of your service applications." }] }),
  component: Applications,
});

export async function openDoc(path: string) {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 300);
  if (error) return toast.error(error.message);
  window.open(data.signedUrl, "_blank");
}

function Applications() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["apps", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("applications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <>
      <PageTitle title={t("applications")} />
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("refNo")}</TableHead><TableHead>Service</TableHead><TableHead>{t("date")}</TableHead>
                <TableHead>{t("documents")}</TableHead><TableHead>{t("status")}</TableHead><TableHead>{t("remark")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground">{t("noRecords")}</TableCell></TableRow>}
              {data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.ref_no}</TableCell>
                  <TableCell>{a.service_type}</TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {a.documents.map((d, i) => (
                      <button key={d} onClick={() => openDoc(d)} className="mr-2 text-primary underline">#{i + 1}</button>
                    ))}
                  </TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.admin_remark ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
