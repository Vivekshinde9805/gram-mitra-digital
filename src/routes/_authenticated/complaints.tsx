import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/complaints")({
  head: () => ({ meta: [{ title: "Complaints — Gram Panchayat Portal" }, { name: "description", content: "Raise and track village complaints." }] }),
  component: Complaints,
});

const CATS = ["Water supply", "Street light", "Roads", "Drainage", "Sanitation", "Other"];
const schema = z.object({ subject: z.string().trim().min(3).max(150), description: z.string().trim().min(10, "Describe the issue (min 10 characters)").max(2000) });

function Complaints() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cat, setCat] = useState(CATS[0]);
  const { data = [] } = useQuery({
    queryKey: ["complaints", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("complaints").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const p = schema.safeParse(Object.fromEntries(new FormData(form)));
    if (!p.success) return toast.error(p.error.issues[0].message);
    const { error } = await supabase.from("complaints").insert({ ...p.data, category: cat, user_id: user!.id });
    if (error) return toast.error(error.message);
    toast.success("Complaint registered");
    form.reset();
    qc.invalidateQueries({ queryKey: ["complaints"] });
  };

  return (
    <>
      <PageTitle title={t("complaints")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>New complaint</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={cat} onValueChange={setCat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Subject</Label><Input name="subject" required /></div>
              <div className="space-y-1.5"><Label>{t("description")}</Label><Textarea name="description" rows={5} required /></div>
              <Button>{t("submit")}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.length === 0 && <p className="text-muted-foreground">{t("noRecords")}</p>}
            {data.map((c) => (
              <div key={c.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{c.subject}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-muted-foreground">{c.category} · {new Date(c.created_at).toLocaleDateString()}</p>
                <p className="mt-1 text-sm">{c.description}</p>
                {c.admin_remark && <p className="mt-1 text-sm text-primary">{t("remark")}: {c.admin_remark}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
