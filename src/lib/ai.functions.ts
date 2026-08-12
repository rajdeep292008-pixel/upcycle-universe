import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  mode: z.enum(["story", "tagline", "impact", "coach"]),
  title: z.string().max(200).optional(),
  materials: z.string().max(500).optional(),
  notes: z.string().max(4000).optional(),
});

const PROMPTS: Record<string, string> = {
  story:
    "Write a warm, honest first-person story (140-200 words) about this waste-to-worth creation: the spark of inspiration, the waste material rescued, the making process, and the hope behind it. Plain human language, no hype, no emojis, no headings.",
  tagline:
    "Write ONE short tagline (max 12 words) for this waste-to-worth creation. Return the tagline only, no quotes.",
  impact:
    "Write 2 short sentences describing the environmental impact of this creation: what waste it diverts and why it matters locally. Be realistic and specific, no exaggerated numbers.",
  coach:
    "You are a kind mentor for home-based upcycling makers. Give 4 concise, practical bullet suggestions to improve this creation's listing, pricing, presentation and reach. No preamble.",
};

export const generateStoryHelp = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured yet.");

    const context = [
      data.title ? `Product: ${data.title}` : "",
      data.materials ? `Waste materials used: ${data.materials}` : "",
      data.notes ? `Maker's rough notes: ${data.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: PROMPTS[data.mode] },
          { role: "user", content: context || "No details provided yet; ask nothing, write your best guess." },
        ],
      }),
    });

    if (response.status === 429) throw new Error("The AI helper is busy right now. Try again in a moment.");
    if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    if (!response.ok) throw new Error("The AI helper could not respond right now.");

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { text: payload.choices?.[0]?.message?.content?.trim() ?? "" };
  });
