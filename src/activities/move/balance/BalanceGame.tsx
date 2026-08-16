import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { Character } from "../../../character/Character";
import { Confetti } from "../../../components/feedback/Confetti";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
import { KidsCameraStage } from "../../../components/camera/KidsCameraStage";
import { BALANCE_TARGETS } from "../../../content/move";
import { voice } from "../../../engine/voice/VoiceService";
import { MockVisionProvider } from "../../../vision/providers/MockVisionProvider";
import { ai } from "../../../engine/ai/AIService";

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
  const [bodySeen, setBodySeen] = useState(false);

  const phaseRef = useRef<Phase>("select");
  const targetRef = useRef(target);
  const balanceStart = useRef<number | null>(null);
  const done = useRef(false);

  const { vision, mock, startCamera, startMock } = useCameraInput({
    requirements: { pose: true },
    onFrame: (frame) => setBodySeen((seen) => seen === !!frame.pose ? seen : !!frame.pose),
  });

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
      setElapsed(0);
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
        void ai().encourage({ game: "balance", correct: true, streak: 1, attempts: 1, level: 1, score: s * 100 }).then((line) => {
          setBubble(line);
        });
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
    <div className="relative h-[100dvh] w-full overflow-y-auto bg-gradient-to-br from-[#fff8ed] via-[#fff3f7] to-[#e9f7ff] text-[#3a3352]">
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button onClick={() => navigate("/move")} className="min-h-11 rounded-full border-2 border-white bg-white/85 px-4 text-sm font-extrabold shadow-sm">← Back</button>
        <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-black shadow-sm">🦩 Flamingo Balance</div>
        <div className="min-w-[70px] text-right text-sm font-black">{phase === "playing" ? `${elapsed.toFixed(1)}s` : ""}</div>
      </header>

      {/* camera gate — real camera is the default */}
      {phase === "playing" && !mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}

      <Confetti trigger={burst} />

      {phase === "select" && (
        <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-76px)] max-w-xl flex-col items-center justify-center gap-5 px-5 pb-12 text-center">
          <Character state={mayaState} message={bubble} size={145} />
          <div>
            <h1 className="text-4xl font-black">Flamingo Balance!</h1>
            <p className="mt-2 text-lg font-bold text-[#817795]">Stand tall on one leg. How long can you hold it?</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {BALANCE_TARGETS.map((n) => (
              <button key={n} onClick={() => start(n)} className="grid min-h-20 min-w-24 place-items-center rounded-[1.75rem] border-4 border-white bg-white/85 px-6 text-3xl font-black shadow-[0_7px_0_rgba(255,157,184,0.25)] active:translate-y-1 active:shadow-none">
                {n}<span className="text-xs text-[#817795]">seconds</span>
              </button>
            ))}
          </div>
        </main>
      )}

      {phase === "playing" && (
        <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-5 px-4 pb-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-center">
          <section className="flex flex-col gap-3">
            <div className="rounded-[2rem] border-4 border-white bg-white/80 p-5 text-center shadow-lg">
              <div className="text-6xl font-black text-[#6d5cff]">{elapsed.toFixed(1)}<span className="text-2xl">s</span></div>
              <div className="mt-1 text-lg font-black text-[#817795]">Goal: {target} seconds</div>
              <div className="mt-4 h-5 overflow-hidden rounded-full bg-[#e9e4ff]"><div className="h-full rounded-full bg-gradient-to-r from-[#ff9db8] to-[#6d5cff] transition-all duration-100" style={{ width: `${progress * 100}%` }} /></div>
              <div className="mt-4 text-3xl">🦩</div>
            </div>
            <div className="flex min-h-28 items-center gap-3 rounded-[1.75rem] border-2 border-white bg-white/65 p-3">
              <Character state={mayaState} size={84} />
              <p className="min-w-0 flex-1 text-lg font-extrabold leading-snug">{bubble}</p>
            </div>
            {mock && <div className="flex justify-center gap-2"><button onClick={() => setBalanceMock(true)} className="rounded-xl bg-white px-4 py-3 font-black">🦩 One leg</button><button onClick={() => setBalanceMock(false)} className="rounded-xl bg-white px-4 py-3 font-black">🦶 Both feet</button></div>}
          </section>
          <section className="rounded-[2.25rem] border-4 border-white bg-white/55 p-3 shadow-xl">
            <KidsCameraStage vision={vision} fit="contain" hint="Keep your head and both feet inside the frame" className="aspect-[4/3] w-full min-h-[250px] sm:min-h-[420px]">
              <div className={`absolute left-3 top-3 z-10 rounded-2xl px-4 py-2 font-black shadow-lg ${bodySeen ? "bg-emerald-100/95 text-emerald-700" : "bg-white/90 text-[#6d5cff]"}`}>{bodySeen ? "✓ Whole body found!" : "Step back a little…"}</div>
            </KidsCameraStage>
          </section>
        </main>
      )}

      {phase === "complete" && (
        <main className="relative z-10 flex min-h-[calc(100dvh-76px)] flex-col items-center justify-center gap-4 px-5 pb-12 text-center">
          <div className="text-5xl">🏆</div>
          <Character state="celebrating" message="Amazing flamingo!" size={135} />
          <div className="text-3xl font-black">{elapsed.toFixed(1)}s balance!</div>
          <div className="flex gap-1 text-3xl">{Array.from({ length: 3 }, (_, i) => (i < stars ? "⭐" : "☆"))}</div>
          <button onClick={() => setPhase("select")} className="min-h-14 rounded-full bg-[#6d5cff] px-8 text-lg font-black text-white shadow-[0_6px_0_#4a3fd1]">
            DONE
          </button>
        </main>
      )}
    </div>
  );
}
