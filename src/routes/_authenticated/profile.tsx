import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — Gram Panchayat Portal" }, { name: "description", content: "Manage your villager profile." }] }),
  component: Profile,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  village: z.string().trim().max(80),
  mobile: z.string().regex(/^([6-9]\d{9})?$/, "Enter a valid 10-digit mobile number"),
  address: z.string().trim().max(300),
});

function Profile() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [photo, setPhoto] = useState<string>();
  const { data: p } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (!p?.avatar_url) return;
    supabase.storage.from("avatars").createSignedUrl(p.avatar_url, 3600).then(({ data }) => setPhoto(data?.signedUrl));
  }, [p?.avatar_url]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!r.success) return toast.error(r.error.issues[0].message);
    const { error } = await supabase.from("profiles").update(r.data).eq("id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    qc.invalidateQueries();
  };

  const upload = async (f?: File) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("Photo must be under 5MB");
    const path = `${user!.id}/avatar-${Date.now()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, f, { upsert: true });
    if (error) return toast.error(error.message);
    await supabase.from("profiles").update({ avatar_url: path }).eq("id", user!.id);
    toast.success("Photo updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  if (!p) return null;
  return (
    <>
      <PageTitle title={t("profile")} />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={photo} />
              <AvatarFallback className="bg-accent text-2xl">{p.full_name?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <Input type="file" accept="image/*" className="max-w-xs" onChange={(e) => upload(e.target.files?.[0])} />
          </div>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>{t("fullName")}</Label><Input name="full_name" defaultValue={p.full_name ?? ""} /></div>
            <div className="space-y-1.5"><Label>{t("email")}</Label><Input value={p.email ?? user?.email ?? ""} disabled /></div>
            <div className="space-y-1.5"><Label>{t("village")}</Label><Input name="village" defaultValue={p.village ?? ""} /></div>
            <div className="space-y-1.5"><Label>{t("mobile")}</Label><Input name="mobile" defaultValue={p.mobile ?? ""} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>{t("address")}</Label><Textarea name="address" defaultValue={p.address ?? ""} /></div>
            <Button className="sm:w-fit">{t("save")}</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
