import React from "react";

export default function Message({ role, text, isError }) {
  const isUser = role === "user";
  return (
    <div className={"msg-row " + (isUser ? "user" : "stacy")}>
      <div className={"bubble" + (isError ? " error-bubble" : "")}>{text}</div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="msg-row stacy">
      <div className="bubble">
        <span className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
    </div>
  );
}
