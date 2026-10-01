import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Languages, PenLine, MessagesSquare, Send, Copy, Landmark } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { streamAI } from "@/lib/ai-client";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Gram Panchayat Portal" }, { name: "description", content: "Gemini-powered FAQ chatbot, Marathi translator and application writer." }] }),
  component: Assistant,
});

function Assistant() {
  const { t } = useI18n();
  return (
    <>
      <PageTitle title={t("assistant")} sub="Powered by Gemini" />
      <Tabs defaultValue="chat">
        <TabsList className="grid w-full grid-cols-3 sm:w-fit">
          <TabsTrigger value="chat"><MessagesSquare className="mr-1 h-4 w-4" />FAQ Chat</TabsTrigger>
          <TabsTrigger value="write"><PenLine className="mr-1 h-4 w-4" />Writer</TabsTrigger>
          <TabsTrigger value="translate"><Languages className="mr-1 h-4 w-4" />Translator</TabsTrigger>
        </TabsList>
        <TabsContent value="chat"><Chat /></TabsContent>
        <TabsContent value="write"><Writer /></TabsContent>
        <TabsContent value="translate"><Translator /></TabsContent>
      </Tabs>
    </>
  );
}

type Msg = { role: "user" | "assistant"; content: string };

function Chat() {
  const { lang } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => { if (!busy) ta.current?.focus(); }, [busy]);

  const send = async (text = input) => {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text.trim() }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      await streamAI({ mode: "chat", lang, messages: next }, (full) =>
        setMsgs([...next, { role: "assistant", content: full }]),
      );
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: `[error] ${(e as Error).message}` }]);
    }
    setBusy(false);
  };

  const suggestions = lang === "mr"
    ? ["पाणी जोडणीसाठी कोणती कागदपत्रे लागतात?", "मालमत्ता कर कसा भरायचा?", "पंचायत कार्यालयाची वेळ काय आहे?"]
    : ["What documents are needed for a water connection?", "How do I pay property tax?", "How can I track my application?"];

  return (
    <Card className="mt-4">
      <CardContent className="flex h-[65vh] flex-col pt-6">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {msgs.length === 0 && (
            <div className="grid place-items-center gap-3 py-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground"><Landmark /></span>
              <p className="font-semibold">Gram Mitra — your Panchayat helper</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border bg-muted px-3 py-1.5 text-sm hover:border-primary">{s}</button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-primary-foreground">{m.content}</div>
            ) : (
              <div key={i} className="prose prose-sm max-w-[90%] text-foreground">
                {m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <span className="animate-pulse text-muted-foreground">Typing…</span>}
              </div>
            ),
          )}
          <div ref={end} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-3 flex gap-2">
          <Textarea
            ref={ta}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={2}
            placeholder={lang === "mr" ? "तुमचा प्रश्न विचारा…" : "Ask a question…"}
            className="resize-none"
          />
          <Button size="icon" className="h-auto w-12 shrink-0" disabled={busy || !input.trim()} aria-label="Send"><Send /></Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Output({ text, busy }: { text: string; busy: boolean }) {
  return (
    <div className="relative min-h-40 whitespace-pre-wrap rounded-lg border bg-muted/50 p-4 text-sm">
      {text || (busy ? <span className="animate-pulse text-muted-foreground">Writing…</span> : <span className="text-muted-foreground">Result will appear here</span>)}
      {text && !busy && (
        <Button size="sm" variant="ghost" className="absolute right-2 top-2" onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }}>
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function Writer() {
  const { lang } = useI18n();
  const [docType, setDocType] = useState("Water connection application");
  const [outLang, setOutLang] = useState<"en" | "mr">(lang);
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (text.trim().length < 5) return toast.error("Describe your request in a few words");
    setBusy(true); setOut("");
    try { await streamAI({ mode: "write", lang: outLang, docType, text }, setOut); } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };
  return (
    <Card className="mt-4">
      <CardContent className="grid gap-4 pt-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Water connection application", "Electricity connection application", "Residence certificate application", "Complaint letter", "Tax rebate request"].map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={outLang} onValueChange={(v) => setOutLang(v as "en" | "mr")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="mr">मराठी</SelectItem></SelectContent>
          </Select>
          <Textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. My name is Ramesh Pawar, house no. 45 ward 3, need new tap connection for family of 5" />
          <Button onClick={run} disabled={busy}>Generate letter</Button>
        </div>
        <Output text={out} busy={busy} />
      </CardContent>
    </Card>
  );
}

function Translator() {
  const [target, setTarget] = useState<"en" | "mr">("mr");
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!text.trim()) return;
    setBusy(true); setOut("");
    try { await streamAI({ mode: "translate", target, text }, setOut); } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };
  return (
    <Card className="mt-4">
      <CardContent className="grid gap-4 pt-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Select value={target} onValueChange={(v) => setTarget(v as "en" | "mr")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="mr">English → मराठी</SelectItem><SelectItem value="en">मराठी → English</SelectItem></SelectContent>
          </Select>
          <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste text to translate" />
          <Button onClick={run} disabled={busy}>Translate</Button>
        </div>
        <Output text={out} busy={busy} />
      </CardContent>
    </Card>
  );
}
