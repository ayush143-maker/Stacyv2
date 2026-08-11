import React from "react";

export default function Header() {
  return (
    <div id="chat-header">
      <div className="who">
        <div className="title">Stacy</div>
        <div className="status">
          <span className="dot" />
          online
        </div>
      </div>
      <div className="badge">v2</div>
    </div>
  );
}
