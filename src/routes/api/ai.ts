import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, type ModelMessage } from "ai";
import { z } from "zod";

const Body = z.object({
  mode: z.enum(["chat", "translate", "write"]),
  lang: z.enum(["en", "mr"]).default("en"),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) })).max(50).default([]),
  text: z.string().max(8000).optional(),
  target: z.enum(["en", "mr"]).optional(),
  docType: z.string().max(100).optional(),
});

const PORTAL = `You help villagers of Gram Panchayat Shivpur (Tal. Haveli, Dist. Pune, Maharashtra) use the online portal.
Portal services: Water Connection, Electricity Connection, Birth Certificate, Residence Certificate (Apply page, with document upload of Aadhaar, 7/12 extract, ID proof);
Taxes & Payments page (property and water tax, 5% rebate if paid before 31 Dec); Complaints page (water, street light, roads, drainage, sanitation);
My Applications page shows reference number and status (Pending, In review, Approved, Rejected, Completed).
Office: Main Chowk, Shivpur; Mon–Sat 10 AM–5:30 PM; phone +91 20 2345 6789. Sarpanch: Smt. Sunita Patil; Gram Sevak: Shri. Anil Kulkarni.
Be concise, warm and practical.`;

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: u } = await sb.auth.getUser(token);
        if (!u.user) return new Response("Unauthorized", { status: 401 });

        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const b = parsed.data;
        const langName = b.lang === "mr" ? "Marathi (Devanagari)" : "English";

        let system = "";
        let messages: ModelMessage[] = [];
        if (b.mode === "chat") {
          system = `${PORTAL}\nAnswer FAQs about the portal and Panchayat. Reply in ${langName} unless the user writes in another language.`;
          messages = b.messages;
        } else if (b.mode === "translate") {
          const to = b.target === "mr" ? "Marathi (Devanagari script)" : "English";
          system = `You are a precise translator for government/village documents. Translate the user's text into ${to}. Output only the translation.`;
          messages = [{ role: "user", content: b.text ?? "" }];
        } else {
          system = `${PORTAL}\nYou draft formal ${b.docType ?? "application"} letters addressed to "The Gram Sevak / Sarpanch, Gram Panchayat Shivpur". Write in ${langName}. Use a clear subject line, respectful formal tone, and placeholders like [Name] only where info is missing. Output only the letter.`;
          messages = [{ role: "user", content: b.text ?? "" }];
        }

        const provider = createOpenAICompatible({
          name: "lovable",
          baseURL: "https://ai.gateway.lovable.dev/v1",
          headers: {
            "Lovable-API-Key": process.env.LOVABLE_API_KEY!,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
        });

        let upstreamError: { status: number; message: string } | null = null;
        const result = streamText({
          model: provider("google/gemini-3.8-flash"),
          system,
          messages,
          maxRetries: 0,
          abortSignal: request.signal,
          onError: ({ error }) => {
            const e = error as { statusCode?: number; message?: string };
            upstreamError = { status: e.statusCode ?? 500, message: e.message ?? "AI error" };
            console.error("AI error", error);
          },
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.textStream) controller.enqueue(encoder.encode(chunk));
              if (upstreamError) {
                const err = upstreamError as { status: number; message: string };
                const msg =
                  err.status === 429 ? "Too many requests, please wait a moment."
                  : err.status === 402 ? "AI credits exhausted. Please contact the administrator."
                  : "The AI service is unavailable right now.";
                controller.enqueue(encoder.encode(`\n\n[error] ${msg}`));
              }
            } catch {
              controller.enqueue(encoder.encode("\n\n[error] The AI service is unavailable right now."));
            }
            controller.close();
          },
        });
        return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
      },
    },
  },
});
