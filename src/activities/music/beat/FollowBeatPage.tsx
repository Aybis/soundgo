import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { usePointerController } from "../../../hooks/usePointerController";
import { AudioEngine } from "../../../engine/audio/AudioEngine";
import { Character } from "../../../character/Character";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
import { Confetti } from "../../../components/feedback/Confetti";
import { voice } from "../../../engine/voice/VoiceService";

const BPM = 84;
const BEAT_MS = 60000 / BPM;
// clap on beats 1, 2, 4 of a 4-beat bar (3 is the rest)
const CLAP_BEATS = new Set([1, 2, 4]);
const TOTAL_CLAPS = 8;
const WINDOW_MS = 260; // forgiving

type Phase = "select" | "playing" | "complete";

export default function FollowBeatPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("select");
  const [claps, setClaps] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [result, setResult] = useState<"hit" | "miss" | null>(null);
  const [mayaState, setMayaState] = useState<"happy" | "celebrating" | "encouraging" | "waiting">("happy");
  const [burst, setBurst] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const phaseRef = useRef<Phase>("select");
  const clapsRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const beatIndex = useRef(0);
  const lastClapBeatAt = useRef(-1e9);
  const expecting = useRef(false);
  const clapCooldown = useRef(0);
  const prev = useRef<{ x: number; y: number; t: number } | null>(null);

  const { vision, mock, startCamera, startMock } = useCameraInput({ requirements: { hands: true } });
  const { pointer } = usePointerController(vision, stageRef, phase === "playing");

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { clapsRef.current = claps; }, [claps]);

  // metronome
  useEffect(() => {
    if (phase !== "playing") return;
    const a = audioRef.current ?? new AudioEngine();
    audioRef.current = a;
    a.ensure();
    a.resume();
    beatIndex.current = 0;
    const iv = setInterval(() => {
      beatIndex.current++;
      const beat = ((beatIndex.current - 1) % 4) + 1;
      a.playNote(beat === 1 ? 880 : 660, { type: "sine", duration: 0.06, volume: 0.3 });
      if (CLAP_BEATS.has(beat)) {
        expecting.current = true;
        lastClapBeatAt.current = performance.now();
      }
    }, BEAT_MS);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // clap detection: fast hand movement (velocity spike) or wave
  useEffect(() => {
    if (phase !== "playing" || !pointer.present) { prev.current = null; return; }
    const now = performance.now();
    const p = prev.current;
    if (p) {
      const dt = Math.max(1, now - p.t);
      const speed = Math.hypot(pointer.x - p.x, pointer.y - p.y) / dt;
      if (speed > 0.7 && now - clapCooldown.current > 150) {
        clapCooldown.current = now;
        onClap(now);
      }
    }
    prev.current = { x: pointer.x, y: pointer.y, t: now };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointer]);

  function onClap(now: number) {
    if (!expecting.current) { setResult("miss"); return; } // clapped on a rest
    const diff = now - lastClapBeatAt.current;
    if (Math.abs(diff) <= WINDOW_MS) {
      scoreRef.current += 100;
      comboRef.current += 1;
      clapsRef.current += 1;
      setScore(scoreRef.current);
      setCombo(comboRef.current);
      setClaps(clapsRef.current);
      setResult("hit");
      setMayaState("celebrating");
      setBurst((b) => b + 1);
      expecting.current = false;
      if (clapsRef.current >= TOTAL_CLAPS) {
        setPhase("complete");
        phaseRef.current = "complete";
        setMayaState("celebrating");
        voice().speak("Great dancing!");
      }
    } else {
      setResult("miss");
    }
  }

  function start() {
    clapsRef.current = 0; scoreRef.current = 0; comboRef.current = 0;
    setClaps(0); setScore(0); setCombo(0); setResult(null);
    setPhase("playing");
    phaseRef.current = "playing";
    setMayaState("waiting");
    voice().speak("Clap on the beat!");
  }

  return (
    <div ref={stageRef} className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff]">
      <button onClick={() => navigate("/music")} className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium hover:bg-white">
        ← Back
      </button>

      {phase === "playing" && !mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 pointer-events-none">
        <Character state={mayaState} message={phase === "playing" ? "Clap on the beat! 👏" : "Let's follow the beat!"} size={110} />
      </div>
      <Confetti trigger={burst} />

      {phase === "select" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="text-2xl font-bold text-[#3a3352]">Follow the Beat!</div>
          <div className="text-sm text-[#8a7f9e]">Clap on beats 1, 2 and 4! 👏</div>
          <button onClick={start} className="px-8 py-3 rounded-full bg-[#6d5cff] text-white font-medium hover:bg-[#5a4ce6]">
            Start
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <div className="text-7xl font-bold text-[#3a3352]">{claps} <span className="text-2xl text-[#8a7f9e]">/ {TOTAL_CLAPS}</span></div>
          <div className="flex gap-2 text-2xl">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${CLAP_BEATS.has(i + 1) ? "bg-[#6d5cff] text-white" : "bg-white/70 text-[#8a7f9e]"}`}>
                {i + 1}
              </div>
            ))}
          </div>
          <div className="text-4xl h-10">
            {result === "hit" ? "👏✨" : result === "miss" ? "🤔" : ""}
          </div>
          <div className="text-[#8a7f9e] text-sm">Score ⭐ {score} · combo x{combo}</div>
          {mock && (
            <div className="text-xs text-[#8a7f9e] bg-white/70 border border-[#eadff5] px-3 py-1.5 rounded-full">
              🖐️ mock · move your mouse quickly to clap
            </div>
          )}
        </div>
      )}

      {phase === "complete" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-sm">
          <div className="text-5xl">🥁</div>
          <div className="text-2xl font-bold text-[#3a3352]">Great job!</div>
          <div className="text-lg text-[#8a7f9e]">Score: ⭐ {score}</div>
          <button onClick={start} className="px-6 py-2 rounded-full bg-[#6d5cff] text-white text-sm font-medium hover:bg-[#5a4ce6]">
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
