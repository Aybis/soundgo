import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { Character } from "../../../character/Character";
import { Confetti } from "../../../components/feedback/Confetti";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
import { KidsCameraStage } from "../../../components/camera/KidsCameraStage";
import { SQUAT_TARGETS } from "../../../content/move";
import { voice } from "../../../engine/voice/VoiceService";
import { MockVisionProvider } from "../../../vision/providers/MockVisionProvider";
import { markCompleted } from "../../../state/settings";

type Phase = "select" | "countdown" | "playing" | "complete";

export default function SquatGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("select");
  const [target, setTarget] = useState(8);
  const [reps, setReps] = useState(0);
  const [count, setCount] = useState(3);
  const [mayaState, setMayaState] = useState<"happy" | "celebrating" | "waiting" | "encouraging">("happy");
  const [bubble, setBubble] = useState<string | null>("Let's do squats!");
  const [burst, setBurst] = useState(0);
  const [bodySeen, setBodySeen] = useState(false);

  const phaseRef = useRef<Phase>("select");
  const targetRef = useRef(target);
  const repsRef = useRef(0);
  const done = useRef(false);

  const { vision, mock, startCamera, startMock } = useCameraInput({
    requirements: { pose: true },
    onFrame: (frame) => setBodySeen((seen) => seen === !!frame.pose ? seen : !!frame.pose),
  });

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { repsRef.current = reps; }, [reps]);

  // count reps from the shared PoseInterpreter's SQUAT_COMPLETED events
  useEffect(() => {
    if (phase !== "playing") return;
    const bus = vision.bus;
    const un = bus.on("SQUAT_COMPLETED", (e) => {
      const n = (e.metadata?.reps as number) ?? 0;
      repsRef.current = n;
      setReps(n);
      voice().speak(n >= 5 && n % 5 === 0 ? `Great! ${n}!` : `${n}!`);
      if (n >= targetRef.current && !done.current) {
        done.current = true;
        setMayaState("celebrating");
        setBubble("Amazing! 🎉");
        setBurst((b) => b + 1);
        markCompleted("Squat Challenge");
        setTimeout(() => setPhase("complete"), 1200);
      }
    });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, vision]);

  // countdown
  useEffect(() => {
    if (phase !== "countdown" || vision.status !== "ready") return;
    setCount(3);
    voice().speak("Ready? Three, two, one, go!");
    const iv = setInterval(() => {
      setCount((c) => {
        if (c > 1) {
          voice().speak(String(c - 1));
          return c - 1;
        }
        clearInterval(iv);
        setPhase("playing");
        phaseRef.current = "playing";
        setMayaState("encouraging");
        setBubble("Go! Squat down, stand up!");
        return 0;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, vision.status]);

  function start(targetN: number) {
    setTarget(targetN);
    targetRef.current = targetN;
    repsRef.current = 0;
    setReps(0);
    done.current = false;
    setPhase("countdown");
    phaseRef.current = "countdown";
  }

  const progress = Math.min(1, reps / target);

  // mock: set a squatting or standing pose
  const setSquat = (down: boolean) => {
    if (vision.provider instanceof MockVisionProvider) {
      vision.provider.setScenario({ pose: { joints: down ? { leftKnee: 80, rightKnee: 80 } : { leftKnee: 170, rightKnee: 170 } } });
    }
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-y-auto bg-gradient-to-br from-[#fff8ed] via-[#f1fff9] to-[#e9f0ff] text-[#3a3352]">
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button onClick={() => navigate("/move")} className="min-h-11 rounded-full border-2 border-white bg-white/85 px-4 text-sm font-extrabold shadow-sm">← Back</button>
        <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-black shadow-sm">🚀 Squat Rocket</div>
        <div className="min-w-[70px] text-right text-sm font-black">{phase === "playing" ? `${reps}/${target}` : ""}</div>
      </header>

      {/* camera gate — real camera is the default */}
      {phase !== "select" && !mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}

      <Confetti trigger={burst} />

      {phase === "select" && (
        <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-76px)] max-w-xl flex-col items-center justify-center gap-5 px-5 pb-12 text-center">
          <Character state={mayaState} message={bubble} size={145} />
          <div>
            <h1 className="text-4xl font-black">Squat Rocket!</h1>
            <p className="mt-2 text-lg font-bold text-[#817795]">How many rocket launches can you do?</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {SQUAT_TARGETS.map((n) => (
              <button key={n} onClick={() => start(n)} className="grid min-h-20 min-w-24 place-items-center rounded-[1.75rem] border-4 border-white bg-white/85 px-6 text-3xl font-black shadow-[0_7px_0_rgba(6,214,160,0.2)] active:translate-y-1 active:shadow-none">
                {n}<span className="text-xs text-[#817795]">squats</span>
              </button>
            ))}
          </div>
        </main>
      )}

      {phase === "countdown" && (
        <main className="relative z-10 flex min-h-[calc(100dvh-76px)] flex-col items-center justify-center gap-5 pb-12">
          <Character state="encouraging" message="Ready, rocket?" size={120} />
          <div className="text-9xl font-black text-[#6d5cff] animate-pulse">{count > 0 ? count : "GO!"}</div>
        </main>
      )}

      {phase === "playing" && (
        <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-5 px-4 pb-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-center">
          <section className="flex flex-col gap-3">
            <div className="rounded-[2rem] border-4 border-white bg-white/80 p-5 text-center shadow-lg">
              <div className="text-7xl font-black text-[#6d5cff]">{reps}<span className="text-2xl text-[#8a7f9e]"> / {target}</span></div>
              <div className="mt-4 h-5 overflow-hidden rounded-full bg-[#e9e4ff]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#6d5cff] to-[#06d6a0] transition-all duration-300" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="mt-4 text-xl font-black">Down ⬇️ then up ⬆️</p>
            </div>
            <div className="flex min-h-28 items-center gap-3 rounded-[1.75rem] border-2 border-white bg-white/65 p-3">
              <Character state={mayaState} size={84} />
              <p className="min-w-0 flex-1 text-lg font-extrabold leading-snug">{bubble}</p>
            </div>
            {mock && <div className="flex justify-center gap-2"><button onClick={() => setSquat(true)} className="rounded-xl bg-white px-4 py-3 font-black">⬇ Squat</button><button onClick={() => setSquat(false)} className="rounded-xl bg-white px-4 py-3 font-black">⬆ Stand</button></div>}
          </section>
          <section className="rounded-[2.25rem] border-4 border-white bg-white/55 p-3 shadow-xl">
            <KidsCameraStage vision={vision} fit="contain" hint="Keep your head and feet inside the frame" className="aspect-[4/3] w-full min-h-[250px] sm:min-h-[420px]">
              <div className={`absolute left-3 top-3 z-10 rounded-2xl px-4 py-2 font-black shadow-lg ${bodySeen ? "bg-emerald-100/95 text-emerald-700" : "bg-white/90 text-[#6d5cff]"}`}>{bodySeen ? "✓ Whole body found!" : "Step back a little…"}</div>
            </KidsCameraStage>
          </section>
        </main>
      )}

      {phase === "complete" && (
        <main className="relative z-10 flex min-h-[calc(100dvh-76px)] flex-col items-center justify-center gap-4 px-5 pb-12 text-center anim-pop">
          <div className="text-6xl">🏆</div>
          <Character state="celebrating" message="AMAZING!" size={140} />
          <div className="text-2xl font-black text-[#3a3352]">{target} squats done!</div>
          <div className="flex gap-3">
            <button onClick={() => start(target)} className="px-6 py-2 rounded-full bg-[#6d5cff] text-white text-sm font-bold hover:bg-[#5a4ce6]">PLAY AGAIN</button>
            <button onClick={() => navigate("/move")} className="px-6 py-2 rounded-full bg-white text-[#3a3352] text-sm font-bold border border-[#eadff5]">CHOOSE ANOTHER GAME</button>
          </div>
        </main>
      )}
    </div>
  );
}
