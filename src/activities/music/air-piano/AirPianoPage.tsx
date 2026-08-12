import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { usePointerController } from "../../../hooks/usePointerController";
import { AudioEngine } from "../../../engine/audio/AudioEngine";
import { Character } from "../../../character/Character";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
import { KidsButton } from "../../../components/ui/KidsButton";
import { GameProgress } from "../../../components/ui/GameProgress";
import { Confetti } from "../../../components/feedback/Confetti";
import { voice } from "../../../engine/voice/VoiceService";

const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
// C4 major scale frequencies
const NOTE_FREQS = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
// Follow-MAYA melody: Twinkle-ish C E G E C
const MELODY = [0, 2, 4, 2, 0];

type Mode = "free" | "follow";

export default function AirPianoPage() {
  const navigate = useNavigate();
  const [mayaState, setMayaState] = useState<"happy" | "celebrating" | "waiting">("happy");
  const [active, setActive] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("free");
  const [melodyIdx, setMelodyIdx] = useState(0);
  const [burst, setBurst] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const lastNote = useRef(-1);
  const audioRef = useRef<AudioEngine | null>(null);
  const melodyIdxRef = useRef(0);
  const modeRef = useRef<Mode>("free");

  const { vision, mock, startCamera, startMock } = useCameraInput({ requirements: { hands: true } });
  const { pointer } = usePointerController(vision, stageRef, true);

  useEffect(() => { melodyIdxRef.current = melodyIdx; }, [melodyIdx]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const playNote = (idx: number) => {
    if (!audioRef.current) audioRef.current = new AudioEngine();
    const a = audioRef.current;
    a.ensure();
    a.resume();
    a.playNote(NOTE_FREQS[idx], { group: "music", type: "triangle", duration: 0.45, volume: 0.5 });
    setActive(idx);
    setMayaState("celebrating");
    window.setTimeout(() => setMayaState(modeRef.current === "follow" ? "waiting" : "happy"), 300);
  };

  // In follow mode: accept the pairing with the current target note.
  const hitFollowTarget = (idx: number) => {
    if (idx === MELODY[melodyIdxRef.current]) {
      playNote(idx);
      const next = melodyIdxRef.current + 1;
      if (next >= MELODY.length) {
        setMelodyIdx(0);
        melodyIdxRef.current = 0;
        setBurst((b) => b + 1);
        setMayaState("celebrating");
        voice().speak("Great job!");
        window.setTimeout(() => setMayaState("waiting"), 900);
      } else {
        setMelodyIdx(next);
        melodyIdxRef.current = next;
      }
    }
  };

  // hand → note zone
  useEffect(() => {
    if (!pointer.present) { lastNote.current = -1; setActive(null); return; }
    const w = window.innerWidth;
    const idx = Math.min(NOTE_FREQS.length - 1, Math.max(0, Math.floor((pointer.x / w) * NOTE_FREQS.length)));
    if (idx === lastNote.current) return;
    lastNote.current = idx;

    if (modeRef.current === "follow") {
      hitFollowTarget(idx);
      return;
    }
    playNote(idx);
  }, [pointer]);

  const target = mode === "follow" ? MELODY[melodyIdx] : null;

  return (
    <div ref={stageRef} className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#f0eaff] to-[#eef2ff]">
      <button onClick={() => navigate("/music")} className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium hover:bg-white">
        ← Back
      </button>

      {!mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}
      <Confetti trigger={burst} />

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 pointer-events-none">
        <Character state={mayaState} message={mode === "follow" ? `Play ${NOTE_NAMES[target ?? 0]}!` : "Move your hand to play!"} size={110} />
      </div>

      {/* mode toggle */}
      <div className="absolute top-5 right-5 z-20 flex gap-2">
        <button onClick={() => setMode("free")} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${mode === "free" ? "bg-[#6d5cff] text-white" : "bg-white/80 text-[#3a3352]"}`}>Free</button>
        <button onClick={() => { setMode("follow"); setMelodyIdx(0); melodyIdxRef.current = 0; }} className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${mode === "follow" ? "bg-[#06d6a0] text-white" : "bg-white/80 text-[#3a3352]"}`}>Follow MAYA</button>
      </div>

      <div className="absolute top-40 left-1/2 -translate-x-1/2 z-10 text-center">
        <div className="text-5xl font-bold text-[#6d5cff]">{active !== null ? NOTE_NAMES[active] : "🎹"}</div>
        {mode === "follow" ? (
          <div className="mt-2"><GameProgress current={melodyIdx} total={MELODY.length} icon="🎵" /></div>
        ) : (
          <div className="text-sm text-[#8a7f9e] mt-1">Move your hand left ↔ right to play!</div>
        )}
      </div>

      {/* piano keys */}
      <div className="absolute bottom-0 inset-x-0 flex h-44 z-10">
        {NOTE_NAMES.map((n, i) => {
          const isTarget = mode === "follow" && i === target;
          return (
            <div
              key={n}
              className={`flex-1 border-r border-[#eadff5] flex flex-col items-center justify-end pb-3 transition-all ${
                isTarget ? "bg-[#06d6a0] text-white animate-pulse" : active === i ? "bg-[#6d5cff] text-white" : "bg-white/85 text-[#3a3352]"
              }`}
            >
              <span className={`text-lg font-bold ${isTarget ? "text-2xl" : ""}`}>{n}</span>
              {isTarget && <span className="text-xs">👆 play me!</span>}
            </div>
          );
        })}
      </div>

      {/* mock controls */}
      {mock && (
        <div className="absolute bottom-48 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {mode === "follow" ? (
            <KidsButton variant="secondary" size="md" onClick={() => hitFollowTarget(target ?? 0)}>
              Play {NOTE_NAMES[target ?? 0]} (mock)
            </KidsButton>
          ) : (
            <span className="text-xs text-[#8a7f9e] bg-white/70 border border-[#eadff5] px-3 py-1.5 rounded-full">🖐️ mock · move your mouse across the keys</span>
          )}
        </div>
      )}
    </div>
  );
}