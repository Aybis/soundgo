import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { Character } from "../../../character/Character";
import { Confetti } from "../../../components/feedback/Confetti";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
import { BALANCE_TARGETS } from "../../../content/move";
import { voice } from "../../../engine/voice/VoiceService";
import { MockVisionProvider } from "../../../vision/providers/MockVisionProvider";

type Phase = "select" | "playing" | "complete";

export default function BalanceGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("select");
  const [target, setTarget] = useState(8);
  const [elapsed, setElapsed] = useState(0);
  const [stars, setStars] = useState(0);
  const [mayaState, setMayaState] = useState<"happy" | "celebrating" | "waiting" | "encouraging" | "watching">("happy");
  const [bubble, setBubble] = useState<string | null>("Can you balance?");
  const [burst, setBurst] = useState(0);

  const phaseRef = useRef<Phase>("select");
  const targetRef = useRef(target);
  const balanceStart = useRef<number | null>(null);
  const done = useRef(false);

  const { vision, mock, startCamera, startMock } = useCameraInput({ requirements: { pose: true } });

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { targetRef.current = target; }, [target]);

  // track balance from BALANCE_STARTED / BALANCE_LOST events
  useEffect(() => {
    if (phase !== "playing") return;
    const bus = vision.bus;
    const off = bus.on("BALANCE_STARTED", () => {
      balanceStart.current = performance.now();
      setMayaState("watching");
      setBubble("Keep going! ⭐");
    });
    const off2 = bus.on("BALANCE_LOST", () => {
      balanceStart.current = null;
      setMayaState("encouraging");
      setBubble("You lost it — try again!");
      voice().speak("Try again!");
    });
    return () => { off(); off2(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, vision]);

  // balance timer
  useEffect(() => {
    if (phase !== "playing") return;
    const iv = setInterval(() => {
      const start = balanceStart.current;
      if (!start) return;
      const t = (performance.now() - start) / 1000;
      setElapsed(t);
      if (t >= targetRef.current && !done.current) {
        done.current = true;
        const s = t >= targetRef.current ? 3 : t >= targetRef.current * 0.6 ? 2 : 1;
        setStars(s);
        setMayaState("celebrating");
        setBubble("Amazing balance! 🎉");
        setBurst((b) => b + 1);
        voice().speak("Amazing balance!");
        setTimeout(() => setPhase("complete"), 1300);
      }
    }, 100);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function start(t: number) {
    setTarget(t);
    targetRef.current = t;
    setElapsed(0);
    setStars(0);
    balanceStart.current = null;
    done.current = false;
    setPhase("playing");
    phaseRef.current = "playing";
    setMayaState("waiting");
    setBubble("Stand on one leg! 🦩");
    voice().speak("Stand on one leg, like a flamingo!");
  }

  const progress = Math.min(1, elapsed / target);

  // mock: raise one foot (balancing) or stand on both
  const setBalanceMock = (oneLeg: boolean) => {
    if (vision.provider instanceof MockVisionProvider) {
      vision.provider.setScenario({
        pose: oneLeg ? { landmarks: { 27: { x: 0.4, y: 0.62 } } } : {},
      });
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] flex flex-col items-center justify-center gap-6 px-4">
      <button onClick={() => navigate("/move")} className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium hover:bg-white">
        ← Back
      </button>

      {/* camera gate — real camera is the default */}
      {!mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}

      <Character state={mayaState} message={bubble} size={130} />
      <Confetti trigger={burst} />

      {phase === "select" && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-2xl font-bold text-[#3a3352]">Balance!</div>
          <div className="text-sm text-[#8a7f9e]">Stand on one leg! 🦩</div>
          <div className="flex gap-3">
            {BALANCE_TARGETS.map((n) => (
              <button key={n} onClick={() => start(n)} className="px-6 py-3 rounded-2xl bg-white/85 border border-[#eadff5] hover:border-[#6d5cff] text-xl font-bold text-[#3a3352]">
                {n}s
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "playing" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <div className="text-5xl font-bold text-[#3a3352] font-mono">{elapsed.toFixed(1)}s <span className="text-xl text-[#8a7f9e]">/ {target}s</span></div>
          <div className="w-full h-4 rounded-full bg-white/70 overflow-hidden">
            <div className="h-full bg-[#06d6a0] transition-all duration-100" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="flex gap-1 text-3xl">{Array.from({ length: 3 }, (_, i) => (i < stars ? "⭐" : "☆"))}</div>
          {mock && (
            <div className="flex gap-2">
              <button onClick={() => setBalanceMock(true)} className="px-4 py-2 rounded-xl bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium">🦩 One leg</button>
              <button onClick={() => setBalanceMock(false)} className="px-4 py-2 rounded-xl bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium">🦶 Both feet</button>
            </div>
          )}
        </div>
      )}

      {phase === "complete" && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl">🏆</div>
          <div className="text-2xl font-bold text-[#3a3352]">{elapsed.toFixed(1)}s balance!</div>
          <div className="flex gap-1 text-3xl">{Array.from({ length: 3 }, (_, i) => (i < stars ? "⭐" : "☆"))}</div>
          <button onClick={() => setPhase("select")} className="px-6 py-2 rounded-full bg-[#6d5cff] text-white text-sm font-medium hover:bg-[#5a4ce6]">
            Done
          </button>
        </div>
      )}
    </div>
  );
}