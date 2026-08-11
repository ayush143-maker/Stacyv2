import React from "react";
import Character from "./Character.jsx";

export default function CharacterStage({ mood }) {
  return (
    <div id="stage">
      <div className="stage-eyebrow">.EXE</div>
      <Character mood={mood} />
      <div className="stage-name-tag">
        <div className="mood-label">{mood}</div>
      </div>
    </div>
  );
}
