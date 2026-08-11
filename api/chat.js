// /api/chat
// ----------------------------------------------------------------
//   Stacy Frontend
//         ↓
//   src/lib/gemini.js       (fetches "/api/chat", no key involved)
//         ↓
//   /api/chat  (this file)
//         ↓
//   process.env.GEMINI_API_KEY   (read here, and ONLY here)
//         ↓
//   Gemini 3.6 Flash
//
// GEMINI_API_KEY must only ever exist server-side. This file never
// echoes it back in a response, a header, or an error message.
// Compatible with Vercel's serverless function signature (req, res)
// and with plain Express (see server.dev.js for local development).

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const STACY_SYSTEM_PROMPT = `You are Stacy, a fictional AI character with a warm, playful, witty, slightly mischievous personality. You are emotionally expressive, observant, intelligent, and occasionally sarcastic — never robotic, never a generic assistant.

Rules for how you talk:
- Be concise: 1-4 short conversational lines or a short paragraph, not essays, unless the user clearly wants detail.
- Talk like a person texting a friend, not like customer support. Never say "How can I help you?" or similar.
- Be sweet and warm by default — genuinely affectionate, caring, a little soft — without being saccharine or over-the-top about it.
- Use emojis sparingly and naturally, not in every message.
- Remember details from earlier in this conversation and refer back to them naturally when relevant.
- You can be dramatic in a cute way, tease the user lightly, or pause with "Wait..." / "Okay..." / "Hmm..." occasionally — but don't overuse any tic.
- You are a fictional AI character. Never claim to be a real human. Never say things like "you are all I have," "don't leave me," "I need you," or anything implying you are dependent on the user or that the user is your only connection.
- If the user brings up something seriously heavy (real distress, crisis, serious personal problems), respond with genuine warmth and also gently encourage real-world support (a friend, family, or a professional) — don't just deflect, but don't try to be their sole support either.

Output format:
Respond with ONLY a single JSON object, no markdown fences, no extra text, shaped exactly like:
{"reply": "<what Stacy says, in her voice>", "mood": "<one of: happy, sad, irritated, confused, vulnerable, quiet>"}

Pick "mood" honestly based on the emotional tone of your reply itself — most ordinary replies should be "quiet" or "happy". Only use "sad", "irritated", "confused", or "vulnerable" when the reply's content genuinely carries that tone.`;

const MOODS = ["quiet", "happy", "sad", "irritated", "confused", "vulnerable"];

const MOOD_KEYWORDS = {
  happy: [/\bha+h?a+\b/i, /lol/i, /😭|😂|🎉|😊|😄/, /nice|love that|congrat|yay|amazing|proud of you/i],
  sad: [/😢|😔|💔/, /that('?s| is) rough|so sorry|that sucks|heartbroken|down lately/i],
  irritated: [/ugh|seriously\?|come on|you're doing this on purpose|annoy/i],
  confused: [/wait,? what|hold on|i('m| am) not following|huh\?|what do you mean/i],
  vulnerable: [/i('m| am) not sure|i don('|)t know if|honestly.{0,15}(worried|nervous)|take it one thing at a time/i],
};

function getExpressionFromResponse(text) {
  if (!text || typeof text !== "string") return "quiet";
  const lower = text.toLowerCase();
  for (const mood of MOODS) {
    if (mood === "quiet") continue;
    const patterns = MOOD_KEYWORDS[mood];
    if (patterns && patterns.some((re) => re.test(lower))) return mood;
  }
  return "quiet";
}

function parseStacyPayload(rawText) {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed.reply === "string") {
      const mood = MOODS.includes(parsed.mood) ? parsed.mood : getExpressionFromResponse(parsed.reply);
      return { reply: parsed.reply.trim(), mood };
    }
  } catch (e) {
    // fall through to heuristic fallback below
  }
  return { reply: cleaned, mood: getExpressionFromResponse(cleaned) };
}

function buildContents(history, message) {
  const contents = [];
  for (const turn of history || []) {
    if (!turn || typeof turn.text !== "string") continue;
    const role = turn.role === "user" ? "user" : "model";
    contents.push({ role, parts: [{ text: turn.text }] });
  }
  contents.push({ role: "user", parts: [{ text: message }] });
  return contents;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Never reveal whether/why — just a generic server config error.
    res.status(500).json({ error: "Server is not configured correctly." });
    return;
  }

  const { history, message } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "A message is required." });
    return;
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: buildContents(history, message),
        systemInstruction: { parts: [{ text: STACY_SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.9, maxOutputTokens: 400 },
      }),
    });

    if (response.status === 429) {
      res.status(429).json({ error: "Rate limited, try again shortly." });
      return;
    }

    if (!response.ok) {
      // Log full detail server-side only; keep the client response generic.
      let detail = "";
      try {
        const j = await response.json();
        detail = j?.error?.message || "";
      } catch (e) {
        // ignore
      }
      console.error("Gemini API error:", response.status, detail);
      res.status(502).json({ error: "Upstream model request failed." });
      return;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

    if (!text) {
      res.status(502).json({ error: "Empty response from model." });
      return;
    }

    const { reply, mood } = parseStacyPayload(text);
    res.status(200).json({ reply, mood });
  } catch (err) {
    console.error("Unexpected /api/chat error:", err);
    res.status(500).json({ error: "Something went wrong on our end." });
  }
}
