// EXPRESSION ENGINE
// ----------------------------------------------------------------
// Mood is primarily decided by Stacy herself — the server asks Gemini
// for a small JSON envelope { reply, mood } and forwards the parsed
// result to the client. getExpressionFromResponse() is the lightweight
// local fallback used if that tag is ever missing or invalid, so the
// UI never breaks and never depends on fragile keyword matching alone.

export const MOODS = [
  "quiet",
  "happy",
  "sad",
  "irritated",
  "confused",
  "vulnerable",
];

const MOOD_KEYWORDS = {
  happy: [
    /\bha+h?a+\b/i,
    /lol/i,
    /😭|😂|🎉|😊|😄/,
    /nice|love that|congrat|yay|amazing|proud of you/i,
  ],
  sad: [/😢|😔|💔/, /that('?s| is) rough|so sorry|that sucks|heartbroken|down lately/i],
  irritated: [/ugh|seriously\?|come on|you're doing this on purpose|annoy/i],
  confused: [/wait,? what|hold on|i('m| am) not following|huh\?|what do you mean/i],
  vulnerable: [
    /i('m| am) not sure|i don('|)t know if|honestly.{0,15}(worried|nervous)|take it one thing at a time/i,
  ],
};

export function getExpressionFromResponse(text) {
  if (!text || typeof text !== "string") return "quiet";
  const lower = text.toLowerCase();
  for (const mood of MOODS) {
    if (mood === "quiet") continue;
    const patterns = MOOD_KEYWORDS[mood];
    if (!patterns) continue;
    if (patterns.some((re) => re.test(lower))) return mood;
  }
  return "quiet";
}

export function resolveMood(parsedMood, replyText) {
  if (parsedMood && MOODS.includes(parsedMood)) return parsedMood;
  return getExpressionFromResponse(replyText);
}

export const IDLE_RETURN_MS = 6000;
export const TRANSITION_MS = 300;
