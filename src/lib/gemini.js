// GEMINI (CLIENT SIDE)
// ----------------------------------------------------------------
// The frontend never talks to Google and never holds an API key.
// It only ever calls our own /api/chat endpoint, which is the sole
// place GEMINI_API_KEY is read (server-side, from an environment
// variable). If you need to change providers or add auth, this is
// the only file that changes on the client.

const MAX_HISTORY_TURNS = 16;

/**
 * @param {{role: 'user'|'model', text: string}[]} history
 * @param {string} userMessage
 * @returns {Promise<{reply: string, mood: string}>}
 */
export async function sendMessage(history, userMessage) {
  const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      history: trimmedHistory,
      message: userMessage,
    }),
  });

  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error || "";
    } catch (e) {
      // ignore body parse failure
    }
    throw new Error(detail || `API_ERROR: ${res.status}`);
  }

  const data = await res.json();
  if (!data?.reply) {
    throw new Error("EMPTY_RESPONSE");
  }

  return { reply: data.reply, mood: data.mood || "quiet" };
}

export function friendlyErrorMessage(err) {
  const m = String(err?.message || err || "");
  if (m.includes("RATE_LIMIT")) {
    return "Okay, we're going a little too fast for Gemini right now — give it a few seconds and try again?";
  }
  if (m.includes("EMPTY_RESPONSE")) {
    return "Hmm, I got quiet for a second there — nothing came through. Try that again?";
  }
  if (m.includes("Failed to fetch") || m.includes("NetworkError")) {
    return "I think the connection dropped for a second. Check your internet and try again?";
  }
  return "Something glitched on my end — mind trying that again?";
}
