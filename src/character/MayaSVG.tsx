import type { MayaState } from "./types";

// Warm, friendly SVG character. Expression is driven by MayaState.
// This is the MVP CharacterRenderer — swap for Lottie/Rive/Live2D later.

interface Expression {
  eyes: "open" | "wide" | "happy" | "closed";
  mouth: "smile" | "big" | "o" | "flat" | "open";
  brows: "none" | "raised" | "worried";
  tint: string;
}

function expressionFor(state: MayaState): Expression {
  switch (state) {
    case "happy": case "excited": case "celebrating":
      return { eyes: "happy", mouth: "big", brows: "none", tint: "#ffd9ec" };
    case "surprised":
      return { eyes: "wide", mouth: "o", brows: "raised", tint: "#ffe4c9" };
    case "thinking": case "confused":
      return { eyes: "open", mouth: "flat", brows: "worried", tint: "#e6e0ff" };
    case "encouraging":
      return { eyes: "happy", mouth: "smile", brows: "none", tint: "#c9f0e0" };
    case "speaking": case "listening":
      return { eyes: "open", mouth: "open", brows: "none", tint: "#e0ecff" };
    case "waiting":
      return { eyes: "closed", mouth: "smile", brows: "none", tint: "#fff3d6" };
    default: // idle, watching
      return { eyes: "open", mouth: "smile", brows: "none", tint: "#ffd9ec" };
  }
}

export function MayaSVG({ state, size = 160 }: { state: MayaState; size?: number }) {
  const e = expressionFor(state);
  const body = "#6d5cff";
  const face = "#fff6ec";
  const blush = "#ffb3c6";

  const eyes = {
    open: <circle key="e" cx="0" cy="0" r="4.5" fill="#3a3352" />,
    wide: <circle key="e" cx="0" cy="0" r="6" fill="#3a3352" />,
    happy: <path key="e" d="M -6 0 Q 0 6 6 0" stroke="#3a3352" strokeWidth="3" fill="none" strokeLinecap="round" />,
    closed: <path key="e" d="M -6 0 Q 0 4 6 0" stroke="#3a3352" strokeWidth="3" fill="none" strokeLinecap="round" />,
  }[e.eyes];

  const mouth = {
    smile: <path d="M -7 4 Q 0 12 7 4" stroke="#3a3352" strokeWidth="3" fill="none" strokeLinecap="round" />,
    big: <path d="M -9 5 Q 0 16 9 5 Q 0 10 -9 5 Z" fill="#3a3352" />,
    o: <ellipse cx="0" cy="8" rx="4" ry="5.5" fill="#3a3352" />,
    flat: <path d="M -6 7 L 6 7" stroke="#3a3352" strokeWidth="3" strokeLinecap="round" />,
    open: <ellipse cx="0" cy="7" rx="3.5" ry="4.5" fill="#3a3352" />,
  }[e.mouth];

  const browL = e.brows === "worried" ? 8 : e.brows === "raised" ? -14 : 0;
  const browR = e.brows === "worried" ? -8 : e.brows === "raised" ? -14 : 0;

  return (
    <svg width={size} height={size} viewBox="-60 -60 120 120" className="transition-transform duration-300">
      {/* body */}
      <ellipse cx="0" cy="34" rx="26" ry="20" fill={body} />
      {/* head */}
      <circle cx="0" cy="-6" r="40" fill={face} />
      {/* blush */}
      <circle cx="-24" cy="6" r="6" fill={blush} opacity="0.7" />
      <circle cx="24" cy="6" r="6" fill={blush} opacity="0.7" />
      {/* brows */}
      <g stroke="#3a3352" strokeWidth="3" strokeLinecap="round">
        <line x1="-12" y1={browL} x2="-4" y2={browL - 4} />
        <line x1="12" y1={browR} x2="4" y2={browR - 4} />
      </g>
      {/* eyes */}
      <g transform="translate(-12,-6)">{eyes}</g>
      <g transform="translate(12,-6)">{eyes}</g>
      {/* mouth */}
      <g>{mouth}</g>
      {/* antenna */}
      <path d="M 0 -44 Q 4 -56 14 -58" stroke={body} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="-58" r="4" fill={body} />
      {/* mood tint glow */}
      <circle cx="0" cy="-6" r="40" fill={e.tint} opacity="0.25" />
    </svg>
  );
}

// Map a MayaState to a short voice line MAYA might say (used as fallback captions).
export const STATE_LINE: Record<MayaState, string> = {
  idle: "",
  listening: "I'm listening!",
  thinking: "Hmm...",
  speaking: "",
  watching: "I can see you!",
  happy: "Yay!",
  excited: "Woo hoo!",
  celebrating: "Amazing!",
  encouraging: "You can do it!",
  surprised: "Wow!",
  confused: "Hmm?",
  waiting: "Ready when you are!",
};