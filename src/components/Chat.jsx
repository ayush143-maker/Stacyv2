import React, { useEffect, useRef, useState } from "react";
import Header from "./Header.jsx";
import Message, { TypingIndicator } from "./Message.jsx";
import ChatInput from "./ChatInput.jsx";
import { sendMessage, friendlyErrorMessage } from "../lib/gemini.js";
import { getExpressionFromResponse, IDLE_RETURN_MS } from "../lib/expressionEngine.js";
import { loadHistory, saveHistory } from "../lib/storage.js";

const GREETINGS = [
  "Hey, you made it. What's going on?",
  "Oh, hi. I was just sitting here being mysterious. What's up?",
  "There you are. So — what are we talking about today?",
];

export default function Chat({ mood, setMood }) {
  const [history, setHistory] = useState(() => {
    const saved = loadHistory();
    if (saved && saved.length) return saved;
    const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    return [{ role: "model", text: greeting }];
  });
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesRef = useRef(null);
  const idleTimerRef = useRef(null);

  useEffect(() => {
    saveHistory(history);
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [history, isGenerating]);

  function scheduleIdleReturn(currentMood) {
    clearTimeout(idleTimerRef.current);
    if (currentMood === "quiet") return;
    idleTimerRef.current = setTimeout(() => setMood("quiet"), IDLE_RETURN_MS);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isGenerating) return;

    const nextHistory = [...history, { role: "user", text }];
    setHistory(nextHistory);
    setInput("");
    setIsGenerating(true);

    try {
      const { reply, mood: replyMood } = await sendMessage(history, text);
      setHistory((h) => [...h, { role: "model", text: reply }]);
      const resolved = replyMood || getExpressionFromResponse(reply);
      setMood(resolved);
      scheduleIdleReturn(resolved);
    } catch (err) {
      const msg = friendlyErrorMessage(err);
      setHistory((h) => [...h, { role: "model", text: msg, isError: true }]);
      setMood("confused");
      scheduleIdleReturn("confused");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div id="chat-panel">
      <Header />
      <div id="messages" ref={messagesRef}>
        {history.map((m, i) => (
          <Message key={i} role={m.role === "user" ? "user" : "stacy"} text={m.text} isError={m.isError} />
        ))}
        {isGenerating && <TypingIndicator />}
      </div>
      <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={isGenerating} />
    </div>
  );
}
