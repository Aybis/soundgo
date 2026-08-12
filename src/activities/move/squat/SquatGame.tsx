import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { Character } from "../../../character/Character";
import { Confetti } from "../../../components/feedback/Confetti";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
import { SQUAT_TARGETS } from "../../../content/move";
import { voice } from "../../../engine/voice/VoiceService";
import { MockVisionProvider } from "../../../vision/providers/MockVisionProvider";

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

  const phaseRef = useRef<Phase>("select");
  const targetRef = useRef(target);
  const repsRef = useRef(0);
  const done = useRef(false);

  const { vision, mock, startCamera, startMock } = useCameraInput({ requirements: { pose: true } });

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
        setTimeout(() => setPhase("complete"), 1200);
      }
    });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, vision]);

  // countdown
  useEffect(() => {
    if (phase !== "countdown") return;
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
  }, [phase]);

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
          <div className="text-2xl font-bold text-[#3a3352]">Squat Challenge!</div>
          <div className="text-sm text-[#8a7f9e]">How many squats?</div>
          <div className="flex gap-3">
            {SQUAT_TARGETS.map((n) => (
              <button key={n} onClick={() => start(n)} className="px-6 py-3 rounded-2xl bg-white/85 border border-[#eadff5] hover:border-[#6d5cff] text-xl font-bold text-[#3a3352]">
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "countdown" && (
        <div className="text-8xl font-bold text-[#6d5cff] animate-pulse">{count > 0 ? count : "GO!"}</div>
      )}

      {phase === "playing" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <div className="text-6xl font-bold text-[#3a3352]">{reps} <span className="text-2xl text-[#8a7f9e]">/ {target}</span></div>
          <div className="w-full h-4 rounded-full bg-white/70 overflow-hidden">
            <div className="h-full bg-[#6d5cff] transition-all duration-300" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="text-[#8a7f9e] text-sm">Squat down, stand up!</div>
          {mock && (
            <div className="flex gap-2">
              <button onClick={() => setSquat(true)} className="px-4 py-2 rounded-xl bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium">⬇ Squat</button>
              <button onClick={() => setSquat(false)} className="px-4 py-2 rounded-xl bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium">⬆ Stand</button>
            </div>
          )}
        </div>
      )}

      {phase === "complete" && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl">🏆</div>
          <div className="text-2xl font-bold text-[#3a3352]">{target} squats done!</div>
          <button onClick={() => setPhase("select")} className="px-6 py-2 rounded-full bg-[#6d5cff] text-white text-sm font-medium hover:bg-[#5a4ce6]">
            Done
          </button>
        </div>
      )}
    </div>
  );
}