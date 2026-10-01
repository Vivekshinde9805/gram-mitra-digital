import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Gram Panchayat Portal" },
      { name: "description", content: "Sign in or create your villager account." },
      { property: "og:title", content: "Sign in — Gram Panchayat Portal" },
      { property: "og:description", content: "Sign in or create your villager account." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  village: z.string().trim().min(2, "Enter village").max(80),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function AuthPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const onSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const { email, password, ...meta } = parsed.data;
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta, emailRedirectTo: window.location.origin + "/dashboard" },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Account created! Check your email to confirm, then sign in.");
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message);
  };

  return (
    <AppShell>
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-primary">{t("appName")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t("login")}</TabsTrigger>
              <TabsTrigger value="signup">{t("signup")}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={onLogin} className="space-y-4 pt-2">
                <Field name="email" label={t("email")} type="email" />
                <Field name="password" label={t("password")} type="password" />
                <Button className="w-full" disabled={busy}>{t("login")}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={onSignup} className="space-y-4 pt-2">
                <Field name="full_name" label={t("fullName")} />
                <Field name="village" label={t("village")} />
                <Field name="mobile" label={t("mobile")} type="tel" />
                <Field name="email" label={t("email")} type="email" />
                <Field name="password" label={t("password")} type="password" />
                <Button className="w-full" disabled={busy}>{t("signup")}</Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="my-4 text-center text-xs text-muted-foreground">— or —</div>
          <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required />
    </div>
  );
}
