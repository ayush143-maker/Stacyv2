import React, { useState } from "react";
import CharacterStage from "./components/CharacterStage.jsx";
import Chat from "./components/Chat.jsx";

export default function App() {
  const [mood, setMood] = useState("quiet");

  return (
    <div className="app-shell">
      <CharacterStage mood={mood} />
      <Chat mood={mood} setMood={setMood} />
    </div>
  );
}
