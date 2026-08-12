import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { usePointerController } from "../../../hooks/usePointerController";
import { AudioEngine } from "../../../engine/audio/AudioEngine";
import { Character } from "../../../character/Character";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";

const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
// C4 major scale frequencies
const NOTE_FREQS = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];

export default function AirPianoPage() {
  const navigate = useNavigate();
  const [mayaState, setMayaState] = useState<"happy" | "celebrating" | "waiting">("happy");
  const [active, setActive] = useState<number | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const lastNote = useRef(-1);
  const audioRef = useRef<AudioEngine | null>(null);

  const { vision, mock, startCamera, startMock } = useCameraInput({ requirements: { hands: true } });
  const { pointer } = usePointerController(vision, stageRef, true);

  // play a note when the hand enters a new zone
  useEffect(() => {
    if (!pointer.present) { lastNote.current = -1; setActive(null); return; }
    const w = window.innerWidth;
    const idx = Math.min(NOTE_FREQS.length - 1, Math.max(0, Math.floor((pointer.x / w) * NOTE_FREQS.length)));
    if (idx !== lastNote.current) {
      lastNote.current = idx;
      setActive(idx);
      if (!audioRef.current) audioRef.current = new AudioEngine();
      const a = audioRef.current;
      a.ensure();
      a.resume();
      a.playNote(NOTE_FREQS[idx], { group: "music", type: "triangle", duration: 0.45, volume: 0.5 });
      setMayaState("celebrating");
      window.setTimeout(() => setMayaState("happy"), 300);
    }
  }, [pointer]);

  return (
    <div ref={stageRef} className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff]">
      <button onClick={() => navigate("/music")} className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium hover:bg-white">
        ← Back
      </button>

      {/* camera gate — real camera is the default */}
      {!mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
        <Character state={mayaState} message="Move your hand to play!" size={110} />
      </div>

      <div className="absolute top-40 left-1/2 -translate-x-1/2 z-10 text-center">
        <div className="text-5xl font-bold text-[#6d5cff]">{active !== null ? NOTE_NAMES[active] : "🎹"}</div>
        <div className="text-sm text-[#8a7f9e] mt-1">Move your hand left ↔ right to play!</div>
      </div>

      {/* piano keys */}
      <div className="absolute bottom-0 inset-x-0 flex h-44 z-10">
        {NOTE_NAMES.map((n, i) => (
          <div
            key={n}
            className={`flex-1 border-r border-[#eadff5] flex flex-col items-center justify-end pb-3 transition-colors ${
              active === i ? "bg-[#6d5cff] text-white" : "bg-white/85 text-[#3a3352]"
            }`}
          >
            <span className="text-lg font-bold">{n}</span>
          </div>
        ))}
      </div>

      {/* mock hint */}
      {mock && (
        <div className="absolute bottom-48 left-1/2 -translate-x-1/2 z-20 text-xs text-[#8a7f9e] bg-white/70 border border-[#eadff5] px-3 py-1.5 rounded-full">
          🖐️ mock · move your mouse across the keys
        </div>
      )}
    </div>
  );
}