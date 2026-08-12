import type { ReactNode } from "react";

export type IllustrationVariant =
  | "learn" | "move" | "music" | "create"
  | "finger-math" | "grab-answer" | "air-writing"
  | "copy-pose" | "squat" | "balance"
  | "air-piano" | "air-drums" | "beat";

interface Props {
  variant: IllustrationVariant;
  className?: string;
}

/**
 * Big, playful cartoon illustrations for the kids' UI — one friendly scene
 * per activity domain. Rendered as SVG so they're sharp at any size and need
 * no image assets.
 */
export function Illustration({ variant, className }: Props) {
  const scenes: Record<IllustrationVariant, ReactNode> = {
    learn: <SceneLearn />,
    move: <SceneMove />,
    music: <SceneMusic />,
    create: <SceneCreate />,
    "finger-math": <SceneFingerMath />,
    "grab-answer": <SceneGrabAnswer />,
    "air-writing": <SceneAirWriting />,
    "copy-pose": <SceneCopyPose />,
    squat: <SceneSquat />,
    balance: <SceneBalance />,
    "air-piano": <SceneAirPiano />,
    "air-drums": <SceneAirDrums />,
    beat: <SceneBeat />,
  };
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      {scenes[variant]}
    </svg>
  );
}

/* ---------- helpers ---------- */
function Sparkles({ cy = 40 }: { cy?: number }) {
  return (
    <g stroke="#ffd166" strokeWidth="3" strokeLinecap="round" fill="none">
      <path d={`M30 ${cy-8} l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4 z`} fill="#ffd166" stroke="none" />
      <path d={`M170 ${cy+6} l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z`} fill="#ff9db8" stroke="none" />
    </g>
  );
}

function Face({ cx, cy, r, eye = "#3a3352", scale = 1 }: { cx: number; cy: number; r: number; eye?: string; scale?: number }) {
  return (
    <g>
      <circle cx={cx - r * 0.35 * scale} cy={cy - r * 0.15 * scale} r={r * 0.11 * scale} fill={eye} />
      <circle cx={cx + r * 0.35 * scale} cy={cy - r * 0.15 * scale} r={r * 0.11 * scale} fill={eye} />
      <path
        d={`M ${cx - r * 0.3 * scale} ${cy + r * 0.25 * scale} Q ${cx} ${cy + r * 0.55 * scale} ${cx + r * 0.3 * scale} ${cy + r * 0.25 * scale}`}
        stroke={eye} strokeWidth={r * 0.09 * scale} fill="none" strokeLinecap="round"
      />
      <circle cx={cx - r * 0.55 * scale} cy={cy + r * 0.1 * scale} r={r * 0.08 * scale} fill="#ff9db8" opacity="0.7" />
      <circle cx={cx + r * 0.55 * scale} cy={cy + r * 0.1 * scale} r={r * 0.08 * scale} fill="#ff9db8" opacity="0.7" />
    </g>
  );
}

/* ---------- Learn: happy open book + letters ---------- */
function SceneLearn() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#fff6ec" />
      <ellipse cx="100" cy="132" rx="52" ry="22" fill="#e9d9ff" />
      {/* book pages */}
      <path d="M100 78 L100 142 L52 118 L52 62 Z" fill="#6d5cff" opacity="0.9" />
      <path d="M100 78 L100 142 L148 118 L148 62 Z" fill="#4a3fd1" opacity="0.85" />
      {/* smiley on book */}
      <Face cx={100} cy={112} r={22} />
      {/* letters */}
      <g fill="#ff6b9d" fontWeight="900" fontFamily="sans-serif">
        <text x="40" y="52" fontSize="26">A</text>
        <text x="60" y="34" fontSize="20" fill="#06d6a0">B</text>
        <text x="150" y="40" fontSize="24" fill="#ffd166">C</text>
        <text x="132" y="58" fontSize="18" fill="#6d5cff">1</text>
        <text x="78" y="30" fontSize="18" fill="#ff9db8">2</text>
      </g>
      <Sparkles cy={40} />
    </g>
  );
}

/* ---------- Move: happy jumping kid ---------- */
function SceneMove() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#e8f7ff" />
      <ellipse cx="100" cy="168" rx="46" ry="10" fill="#cfe8ff" />
      {/* ground */}
      <path d="M58 168 h84 l4 4 h-92 z" fill="#06d6a0" opacity="0.5" rx="4" />
      {/* body */}
      <circle cx="100" cy="96" r="26" fill="#ffd166" />
      <Face cx={100} cy={96} r={26} />
      {/* arms up */}
      <path d="M78 84 Q60 66 52 74" stroke="#ffd166" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M122 84 Q140 66 148 74" stroke="#ffd166" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* legs jumping */}
      <path d="M92 122 L84 150" stroke="#3a3352" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M108 122 L116 150" stroke="#3a3352" strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* shoes */}
      <circle cx="82" cy="152" r="7" fill="#6d5cff" />
      <circle cx="118" cy="152" r="7" fill="#06d6a0" />
      {/* motion lines */}
      <g stroke="#8a7f9e" strokeWidth="3" strokeLinecap="round">
        <path d="M52 60 h-16" />
        <path d="M48 74 h-12" />
        <path d="M150 60 h16" />
        <path d="M154 74 h12" />
      </g>
      <Sparkles cy={40} />
    </g>
  );
}

/* ---------- Music: smiling note + instruments ---------- */
function SceneMusic() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#fff0f5" />
      {/* big note */}
      <ellipse cx="92" cy="132" rx="16" ry="13" fill="#6d5cff" transform="rotate(-18 92 132)" />
      <rect x="106" y="78" width="7" height="56" rx="3" fill="#6d5cff" />
      <g stroke="#6d5cff" strokeWidth="5" strokeLinecap="round">
        <path d="M113 82 q14 6 14 18" fill="none" />
      </g>
      {/* floating notes */}
      <text x="44" y="62" fontSize="24" fill="#ff9db8">♪</text>
      <text x="60" y="40" fontSize="26" fill="#06d6a0">♫</text>
      <text x="142" y="48" fontSize="24" fill="#ffd166">♪</text>
      <text x="158" y="70" fontSize="20" fill="#6d5cff">♬</text>
      {/* rainbow */}
      <path d="M60 60 a40 40 0 0 1 80 0" stroke="#ff6b9d" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M68 58 a32 32 0 0 1 64 0" stroke="#ffd166" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M76 54 a24 24 0 0 1 48 0" stroke="#06d6a0" strokeWidth="6" fill="none" strokeLinecap="round" />
      <Sparkles cy={40} />
    </g>
  );
}

/* ---------- Create: paint palette + brush ---------- */
function SceneCreate() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#f0f7ff" />
      {/* palette */}
      <ellipse cx="96" cy="110" rx="48" ry="34" fill="#fff" stroke="#e5d9f5" strokeWidth="3" />
      <circle cx="96" cy="110" r="22" fill="#f3ecff" />
      <circle cx="70" cy="96" r="9" fill="#ff6b9d" />
      <circle cx="112" cy="92" r="9" fill="#06d6a0" />
      <circle cx="122" cy="116" r="9" fill="#6d5cff" />
      <circle cx="70" cy="122" r="9" fill="#ffd166" />
      <circle cx="98" cy="132" r="8" fill="#ff9db8" />
      {/* thumb hole */}
      <circle cx="94" cy="112" r="8" fill="#f3ecff" stroke="#e5d9f5" strokeWidth="2" />
      {/* brush */}
      <g transform="rotate(-30 150 60)">
        <rect x="142" y="34" width="14" height="58" rx="6" fill="#c48a52" />
        <path d="M142 30 L156 30 L158 44 L140 44 Z" fill="#6d5cff" />
        <rect x="146" y="30" width="6" height="14" rx="2" fill="#ffd166" />
      </g>
      {/* paint splat */}
      <g fill="#ff6b9d"><circle cx="160" cy="150" r="5" /><circle cx="168" cy="156" r="3" /></g>
      <Sparkles cy={40} />
    </g>
  );
}

/* ---------- Finger Math: a waving hand counting fingers ---------- */
function FingerHand({ cx, cy, fingers, color = "#ffd166", flip = false }: { cx: number; cy: number; fingers: number; color?: string; flip?: boolean }) {
  const dir = flip ? -1 : 1;
  const xs: number[] = [];
  for (let i = 0; i < 5; i++) xs[i] = cx + dir * (i - 2) * 9;
  return (
    <g>
      <path d={`M${cx} ${cy+18} h${-dir*16} a9 9 0 0 1 -9 -9 v-6`} stroke={color} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d={`M${cx} ${cy+18} h${dir*16} a9 9 0 0 0 9 -9 v-6`} stroke={color} strokeWidth="12" strokeLinecap="round" fill="none" />
      {xs.map((x, i) => (
        <rect key={i} x={x - 4} y={i < fingers ? cy - 34 : cy - 12} width="8" height={i < fingers ? 34 : 12} rx="4" fill={color} />
      ))}
    </g>
  );
}
function SceneFingerMath() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#fff6ec" />
      <FingerHand cx={100} cy={112} fingers={5} color="#ffd166" />
      <text x="42" y="52" fontSize="24" fontWeight="900" fill="#ff6b9d">3</text>
      <text x="150" y="46" fontSize="24" fontWeight="900" fill="#06d6a0">+</text>
      <text x="150" y="140" fontSize="28" fontWeight="900" fill="#6d5cff">=</text>
      <text x="60" y="150" fontSize="26" fontWeight="900" fill="#ff9db8">?</text>
      <Sparkles cy={40} />
    </g>
  );
}

/* ---------- Grab Answer: a pointing hand + star targets ---------- */
function SceneGrabAnswer() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#fff0f5" />
      <FingerHand cx={70} cy={120} fingers={1} color="#ff9db8" flip />
      <path d="M70 96 l10 -14 6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 z" fill="#ffd166" />
      <path d="M120 60 l8 12 14 2 -10 10 2 14 -14 -7 -14 7 2 -14 -10 -10 14 -2 z" fill="#06d6a0" />
      <circle cx="150" cy="120" r="10" fill="#6d5cff" />
      <Sparkles cy={40} />
    </g>
  );
}

/* ---------- Air Writing: pencil tracing a letter ---------- */
function SceneAirWriting() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#f0f7ff" />
      <text x="74" y="120" fontSize="70" fontWeight="900" fill="#6d5cff" opacity="0.35">A</text>
      <g transform="rotate(-35 150 60)">
        <circle cx="150" cy="60" r="6" fill="#ff9db8" />
        <rect x="146" y="60" width="8" height="40" rx="4" fill="#ffd166" />
        <path d="M146 100 L154 100 L152 112 L148 112 Z" fill="#c48a52" />
      </g>
      <path d="M60 150 q20 14 40 4" stroke="#8a7f9e" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="4 5" />
      <Sparkles cy={40} />
    </g>
  );
}

/* ---------- Copy Pose: a mini pose figure ---------- */
function MiniFigure({ pose }: { pose: "star" | "left" | "head" }) {
  const arms = pose === "star"
    ? <><path d="M78 92 Q60 78 52 84" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" fill="none" /><path d="M122 92 Q140 78 148 84" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" fill="none" /></>
    : pose === "left"
    ? <><path d="M122 92 L150 70" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" fill="none" /><path d="M82 92 L60 100" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" fill="none" /></>
    : <><path d="M78 92 L60 62" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" fill="none" /><path d="M122 92 L140 62" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" fill="none" /></>;
  return (
    <g>
      <circle cx="100" cy="78" r="16" fill="#ffd166" />
      <circle cx="95" cy="76" r="2.4" fill="#3a3352" /><circle cx="105" cy="76" r="2.4" fill="#3a3352" />
      <path d="M100 94 L100 128" stroke="#3a3352" strokeWidth="9" strokeLinecap="round" />
      <path d="M92 138 L88 156" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" />
      <path d="M108 138 L112 156" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" />
      {arms}
    </g>
  );
}
function SceneCopyPose() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#e8f7ff" />
      <MiniFigure pose="star" />
      <path d="M168 40 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4 z" fill="#ffd166" />
      <path d="M30 150 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="#ff9db8" />
    </g>
  );
}

/* ---------- Squat: a figure squatting ---------- */
function SceneSquat() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#e8f7ff" />
      <ellipse cx="100" cy="160" rx="40" ry="8" fill="#cfe8ff" />
      <circle cx="100" cy="92" r="16" fill="#ffd166" />
      <circle cx="95" cy="90" r="2.4" fill="#3a3352" /><circle cx="105" cy="90" r="2.4" fill="#3a3352" />
      <path d="M100 108 L100 128" stroke="#3a3352" strokeWidth="9" strokeLinecap="round" />
      <path d="M92 128 Q84 146 78 152" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M108 128 Q116 146 122 152" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M84 104 Q70 96 62 104" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M116 104 Q130 96 138 104" stroke="#3a3352" strokeWidth="8" strokeLinecap="round" fill="none" />
      <text x="150" y="60" fontSize="22" fontWeight="900" fill="#06d6a0">1</text>
      <Sparkles cy={40} />
    </g>
  );
}

/* ---------- Balance: a flamingo on one leg ---------- */
function SceneBalance() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#fff0f5" />
      <ellipse cx="100" cy="160" rx="26" ry="7" fill="#ffd9e5" />
      {/* one raised leg */}
      <path d="M100 108 L100 132 L96 150" stroke="#ff6b9d" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M100 118 L112 106" stroke="#ff6b9d" strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="100" cy="94" r="15" fill="#ff6b9d" />
      <circle cx="95" cy="92" r="2.4" fill="#3a3352" /><circle cx="105" cy="92" r="2.4" fill="#3a3352" />
      <path d="M100 108 L100 118" stroke="#ff6b9d" strokeWidth="9" strokeLinecap="round" />
      <g fill="#ffd166"><circle cx="150" cy="52" r="3" /><circle cx="158" cy="60" r="4" /><circle cx="154" cy="46" r="2" /></g>
      <text x="44" y="64" fontSize="22">🦩</text>
    </g>
  );
}

/* ---------- Air Piano: a hand over piano keys ---------- */
function SceneAirPiano() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#f0f7ff" />
      <FingerHand cx={95} cy={92} fingers={4} color="#06d6a0" />
      <g>
        {[0,1,2,3,4,5,6].map((i) => (
          <rect key={i} x={40 + i * 14} y={132} width="12" height="34" rx="3" fill={i === 3 ? "#6d5cff" : "#fff"} stroke="#d9cff2" />
        ))}
      </g>
      <text x="150" y="70" fontSize="22" fontWeight="900" fill="#6d5cff">♪</text>
      <Sparkles cy={40} />
    </g>
  );
}

/* ---------- Air Drums: a drum with sticks ---------- */
function SceneAirDrums() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#f0f7ff" />
      <ellipse cx="100" cy="150" rx="34" ry="14" fill="#6d5cff" />
      <rect x="66" y="136" width="68" height="18" rx="6" fill="#4a3fd1" />
      <ellipse cx="100" cy="136" rx="34" ry="12" fill="#ffd166" />
      <g stroke="#c48a52" strokeWidth="5" strokeLinecap="round">
        <path d="M70 110 L92 132" />
        <path d="M130 110 L108 132" />
      </g>
      <circle cx="70" cy="108" r="5" fill="#ff9db8" />
      <circle cx="130" cy="108" r="5" fill="#06d6a0" />
      <text x="150" y="60" fontSize="22">🥁</text>
      <Sparkles cy={40} />
    </g>
  );
}

/* ---------- Beat: clapping hands + notes ---------- */
function SceneBeat() {
  return (
    <g>
      <circle cx="100" cy="100" r="78" fill="#fff6ec" />
      <FingerHand cx={78} cy={104} fingers={5} color="#ff9db8" flip />
      <FingerHand cx={122} cy={104} fingers={5} color="#ffd166" />
      <path d="M100 96 q-6 10 0 20" stroke="#8a7f9e" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="3 4" />
      <text x="44" y="58" fontSize="22" fill="#06d6a0">♪</text>
      <text x="150" y="52" fontSize="24" fill="#6d5cff">♫</text>
      <text x="150" y="140" fontSize="20" fill="#ff6b9d">♩</text>
      <Sparkles cy={40} />
    </g>
  );
}