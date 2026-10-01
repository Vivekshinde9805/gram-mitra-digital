import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/apply")({
  head: () => ({ meta: [{ title: "Apply for a Service — Gram Panchayat Portal" }, { name: "description", content: "Apply for water, electricity or certificates online." }] }),
  component: Apply,
});

const SERVICES = ["water", "electricity", "birth", "residence"] as const;
const schema = z.object({
  applicant_name: z.string().trim().min(2).max(100),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  address: z.string().trim().min(5, "Enter full address").max(300),
  description: z.string().trim().max(1000).optional(),
});

function Apply() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<(typeof SERVICES)[number]>("water");
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const paths: string[] = [];
    for (const f of Array.from(files ?? [])) {
      if (f.size > 10 * 1024 * 1024) { setBusy(false); return toast.error(`${f.name} is larger than 10MB`); }
      const path = `${user.id}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("documents").upload(path, f);
      if (error) { setBusy(false); return toast.error(error.message); }
      paths.push(path);
    }
    const { data, error } = await supabase
      .from("applications")
      .insert({ ...parsed.data, service_type: t(service), user_id: user.id, documents: paths })
      .select("ref_no")
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Application submitted. ${t("refNo")}: ${data.ref_no}`);
    navigate({ to: "/applications" });
  };

  return (
    <>
      <PageTitle title={t("services")} />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Service</Label>
              <Select value={service} onValueChange={(v) => setService(v as typeof service)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICES.map((s) => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>{t("fullName")}</Label><Input name="applicant_name" required /></div>
              <div className="space-y-1.5"><Label>{t("mobile")}</Label><Input name="mobile" type="tel" required /></div>
            </div>
            <div className="space-y-1.5"><Label>{t("address")}</Label><Textarea name="address" required /></div>
            <div className="space-y-1.5"><Label>{t("description")}</Label><Textarea name="description" placeholder="Tip: use the AI Assistant to draft this" /></div>
            <div className="space-y-1.5">
              <Label>{t("documents")} (Aadhaar, 7/12, ID — PDF/JPG, max 10MB)</Label>
              <Input type="file" multiple accept=".pdf,image/*" onChange={(e) => setFiles(e.target.files)} />
            </div>
            <Button disabled={busy} className="w-full sm:w-auto">{busy ? "…" : t("submit")}</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
