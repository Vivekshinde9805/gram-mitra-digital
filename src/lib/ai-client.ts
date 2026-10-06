import { supabase } from "@/integrations/supabase/client";

export async function streamAI(body: Record<string, unknown>, onText: (full: string) => void, signal: AbortSignal | null = null) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(res.status === 401 ? "Please sign in again." : "AI request failed");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += dec.decode(value, { stream: true });
    onText(full);
  }
  return full;
}
