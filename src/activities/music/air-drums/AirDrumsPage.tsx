import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { usePointerController } from "../../../hooks/usePointerController";
import { AudioEngine } from "../../../engine/audio/AudioEngine";
import { Character } from "../../../character/Character";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";

interface DrumZone {
  id: string;
  label: string;
  emoji: string;
  fx: number; // fractional x
  fy: number; // fractional y
  hit: (a: AudioEngine) => void;
}

const ZONES: DrumZone[] = [
  { id: "snare", label: "SNARE", emoji: "🥁", fx: 0.25, fy: 0.62, hit: (a) => { a.playNote(220, { type: "sawtooth", duration: 0.09, volume: 0.4 }); a.playNote(90, { type: "sine", duration: 0.12, volume: 0.5 }); } },
  { id: "tom", label: "TOM", emoji: "🪘", fx: 0.75, fy: 0.62, hit: (a) => a.playNote(150, { type: "sine", duration: 0.16, volume: 0.5 }) },
  { id: "hat", label: "HI-HAT", emoji: "🔔", fx: 0.5, fy: 0.3, hit: (a) => a.playNote(1900, { type: "square", duration: 0.05, volume: 0.3 }) },
];

export default function AirDrumsPage() {
  const navigate = useNavigate();
  const [mayaState, setMayaState] = useState<"happy" | "celebrating">("happy");
  const [lastHit, setLastHit] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const prev = useRef<{ x: number; y: number; t: number } | null>(null);
  const coolDown = useRef(0);

  const { vision, mock, startCamera, startMock } = useCameraInput({ requirements: { hands: true } });
  const { pointer } = usePointerController(vision, stageRef, true);

  useEffect(() => {
    if (!pointer.present) { prev.current = null; return; }
    const now = performance.now();
    const p = prev.current;
    if (p) {
      const dt = Math.max(1, now - p.t);
      const speed = Math.hypot(pointer.x - p.x, pointer.y - p.y) / dt; // px/ms
      if (speed > 0.6 && now - coolDown.current > 200) {
        // find zone under the pointer
        const w = window.innerWidth, h = window.innerHeight;
        const zone = ZONES.find((z) => Math.hypot(pointer.x - z.fx * w, pointer.y - z.fy * h) < Math.min(w, h) * 0.12);
        if (zone) {
          coolDown.current = now;
          if (!audioRef.current) audioRef.current = new AudioEngine();
          const a = audioRef.current;
          a.ensure();
          a.resume();
          zone.hit(a);
          setLastHit(zone.id);
          setMayaState("celebrating");
          window.setTimeout(() => setMayaState("happy"), 250);
        }
      }
    }
    prev.current = { x: pointer.x, y: pointer.y, t: now };
  }, [pointer]);

  const radius = 90;

  return (
    <div ref={stageRef} className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff]">
      <button onClick={() => navigate("/music")} className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium hover:bg-white">
        ← Back
      </button>

      {!mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 pointer-events-none">
        <Character state={mayaState} message="Strike the drums!" size={100} />
      </div>

      {/* drum zones */}
      {ZONES.map((z) => {
        const w = window.innerWidth, h = window.innerHeight;
        const flash = lastHit === z.id;
        return (
          <div
            key={z.id}
            className={`absolute rounded-full flex flex-col items-center justify-center border-4 transition-transform ${flash ? "bg-[#6d5cff] text-white scale-110 border-[#6d5cff]" : "bg-white/85 text-[#3a3352] border-[#eadff5]"}`}
            style={{ left: z.fx * w, top: z.fy * h, width: radius * 2, height: radius * 2, transform: "translate(-50%,-50%)" }}
          >
            <span className="text-3xl">{z.emoji}</span>
            <span className="text-xs font-bold mt-1">{z.label}</span>
          </div>
        );
      })}

      {mock && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-xs text-[#8a7f9e] bg-white/70 border border-[#eadff5] px-3 py-1.5 rounded-full">
          🖐️ mock · swipe your mouse quickly into a drum
        </div>
      )}
    </div>
  );
}