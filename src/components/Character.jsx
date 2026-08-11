import React, { useEffect, useRef, useState } from "react";
import { TRANSITION_MS } from "../lib/expressionEngine.js";

// All six expressions live in /public/expressions and are referenced by
// plain URL — Vite serves /public as the site root, so these resolve to
// /expressions/<mood>.png in both dev and prod.
const EXPRESSION_SRC = {
  quiet: "/expressions/quiet.png",
  happy: "/expressions/happy.png",
  sad: "/expressions/sad.png",
  irritated: "/expressions/irritated.png",
  confused: "/expressions/confused.png",
  vulnerable: "/expressions/vulnerable.png",
};

export function preloadExpressions() {
  Object.values(EXPRESSION_SRC).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

/**
 * Two absolutely-positioned <img> layers crossfade between moods.
 * Opacity + a tiny scale pulse only — never blur, never filters —
 * so the art stays crisp through every transition.
 */
export default function Character({ mood }) {
  const [layers, setLayers] = useState({
    a: { mood: "quiet", opacity: 1 },
    b: { mood: "quiet", opacity: 0 },
  });
  const activeRef = useRef("a");
  const pulseRef = useRef({ a: false, b: false });
  const [, forceRender] = useState(0);

  useEffect(() => {
    preloadExpressions();
  }, []);

  useEffect(() => {
    setLayers((prev) => {
      const active = activeRef.current;
      const incoming = active === "a" ? "b" : "a";
      if (prev[active].mood === mood) return prev;

      activeRef.current = incoming;
      pulseRef.current[incoming] = true;
      setTimeout(() => {
        pulseRef.current[incoming] = false;
        forceRender((n) => n + 1);
      }, TRANSITION_MS + 60);

      return {
        ...prev,
        [incoming]: { mood, opacity: 1 },
        [active]: { ...prev[active], opacity: 0 },
      };
    });
  }, [mood]);

  return (
    <div className="character-wrap">
      {["a", "b"].map((key) => (
        <img
          key={key}
          className={"char-layer" + (pulseRef.current[key] ? " pulse" : "")}
          src={EXPRESSION_SRC[layers[key].mood]}
          alt=""
          style={{ opacity: layers[key].opacity }}
        />
      ))}
    </div>
  );
}
