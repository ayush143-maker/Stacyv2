// STORAGE
// ----------------------------------------------------------------
// Only ever used for the conversation itself (so a refresh doesn't
// lose the chat mid-session). Never used for API keys or secrets —
// the Gemini key lives server-side only and this module never
// touches it.

const HISTORY_KEY = "stacy:history:v1";

export function loadHistory() {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
}

export function saveHistory(history) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    // storage full or unavailable — fail silently, chat still works
  }
}

export function clearHistory() {
  try {
    sessionStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    // ignore
  }
}
