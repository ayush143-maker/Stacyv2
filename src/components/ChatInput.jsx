import React, { useRef } from "react";

export default function ChatInput({ value, onChange, onSend, disabled }) {
  const textareaRef = useRef(null);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div id="composer-wrap">
      <div id="composer">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Say something to Stacy…"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          id="send-btn"
          aria-label="Send message"
          onClick={onSend}
          disabled={disabled || !value.trim()}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12L20 4L14 20L11 13L4 12Z" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div id="composer-hint">Enter to send · Shift + Enter for a new line</div>
    </div>
  );
}
