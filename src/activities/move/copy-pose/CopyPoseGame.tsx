import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { usePoseController } from "../../../hooks/usePoseController";
import { GameSession } from "../../../engine/session/GameSession";
import { Character } from "../../../character/Character";
import { Confetti } from "../../../components/feedback/Confetti";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
import { KidsCameraStage } from "../../../components/camera/KidsCameraStage";
import { POSES } from "../../../content/move";
import type { PoseDef } from "../../../content/move";
import { MockVisionProvider } from "../../../vision/providers/MockVisionProvider";

type Phase = "select" | "playing" | "complete";

export default function CopyPoseGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("select");
  const [pose, setPose] = useState<PoseDef | null>(null);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [mayaState, setMayaState] = useState<"happy" | "celebrating" | "encouraging" | "waiting">("happy");
  const [bubble, setBubble] = useState<string | null>("Copy my moves!");
  const [burst, setBurst] = useState(0);
  const [mockPose, setMockPose] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);

  const sessionRef = useRef<GameSession | null>(null);
  const phaseRef = useRef<Phase>("select");
  const poseRef = useRef<PoseDef | null>(null);
  const roundRef = useRef(1);
  const holdSince = useRef<number | null>(null);
  const done = useRef(false);

  const { vision, mock, startCamera, startMock } = useCameraInput({ requirements: { pose: true } });
  const poseCtrl = usePoseController(vision, phase === "playing");

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { poseRef.current = pose; }, [pose]);
  useEffect(() => { roundRef.current = round; }, [round]);

  // match the target pose with a hold
  useEffect(() => {
    if (phase !== "playing" || !pose || !poseCtrl.detected) {
      holdSince.current = null;
      setHoldProgress(0);
      return;
    }
    const allMatch = pose.rules.every((r) => poseCtrl.matched.includes(r));
    const now = performance.now();
    if (allMatch) {
      if (holdSince.current === null) holdSince.current = now;
      else {
        const progress = Math.min(1, (now - holdSince.current) / 600);
        setHoldProgress(progress);
        if (progress >= 1 && !done.current) {
          done.current = true;
          onPoseMatched();
        }
      }
    } else {
      holdSince.current = null;
      setHoldProgress(0);
    }
  }, [poseCtrl.matched, poseCtrl.detected, phase, pose]);

  function onPoseMatched() {
    const s = sessionRef.current;
    if (!s) return;
    s.correctNow("Perfect!");
    setScore(s.score);
    setMayaState("celebrating");
    setBubble("Perfect pose! ✨");
    setBurst((b) => b + 1);
    setTimeout(() => {
      const next = roundRef.current + 1;
      if (next > 5) {
        s.celebrate("You did it!");
        setMayaState("celebrating");
        setBubble("Great job! 🎉");
        setScore(s.score);
        setPhase("complete");
        phaseRef.current = "complete";
        return;
      }
      startRound(s, next);
    }, 1100);
  }

  function startRound(s: GameSession, r: number) {
    roundRef.current = r;
    setRound(r);
    done.current = false;
    holdSince.current = null;
    setHoldProgress(0);
    const p = POSES[(r - 1) % POSES.length];
    poseRef.current = p;
    setPose(p);
    setMayaState("waiting");
    setBubble(p.hint);
    s.feedback.info(p.hint, { voice: true, character: "waiting" });
  }

  function startGame() {
    const s = new GameSession({ total: 5 });
    sessionRef.current = s;
    setScore(0);
    setPhase("playing");
    phaseRef.current = "playing";
    startRound(s, 1);
  }

  // mock pose button: set landmarks to match a pose
  const showMockPose = (poseId: string) => {
    setMockPose(poseId);
    const pose = POSES.find((p) => p.id === poseId);
    if (!pose || !(vision.provider instanceof MockVisionProvider)) return;
    const lm: Record<number, { x: number; y: number }> = {};
    // raise left wrist above left shoulder
    lm[15] = { x: 0.3, y: 0.25 };
    lm[16] = { x: 0.7, y: 0.55 };
    if (pose.rules.includes("bothHandsUp") || pose.rules.includes("rightHandUp")) lm[16] = { x: 0.7, y: 0.25 };
    if (pose.rules.includes("touchHead")) { lm[15] = { x: 0.45, y: 0.3 }; }
    vision.provider.setScenario({ pose: { landmarks: lm } });
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-y-auto bg-gradient-to-br from-[#fff8ed] via-[#f3f7ff] to-[#eeeaff] text-[#3a3352]">
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button onClick={() => navigate("/move")} className="min-h-11 rounded-full border-2 border-white bg-white/85 px-4 text-sm font-extrabold shadow-sm">← Back</button>
        <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-black shadow-sm">🤸 Copy Me!</div>
        <div className="min-w-[72px] text-right text-sm font-black">{phase === "playing" ? `⭐ ${round}/5` : ""}</div>
      </header>

      {/* camera gate — real camera is the default */}
      {phase === "playing" && !mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}

      <Confetti trigger={burst} />

      {phase === "select" && (
        <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-76px)] max-w-xl flex-col items-center justify-center gap-5 px-5 pb-12 text-center">
          <Character state={mayaState} message={bubble} size={150} />
          <div>
            <h1 className="text-4xl font-black">Can you copy Maya?</h1>
            <p className="mt-2 text-lg font-bold text-[#817795]">Five silly poses. Hold each one to win a star!</p>
          </div>
          <button onClick={startGame} className="min-h-16 rounded-full bg-[#6d5cff] px-10 text-xl font-black text-white shadow-[0_7px_0_#4a3fd1] active:translate-y-1 active:shadow-none">
            START MOVING
          </button>
        </main>
      )}

      {phase === "playing" && pose && (
        <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-5 px-4 pb-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-center">
          <section className="flex flex-col gap-3">
            <div className="rounded-[2rem] border-4 border-white bg-white/80 p-5 text-center shadow-lg">
              <div className="text-7xl">{pose.emoji}</div>
              <h1 className="mt-1 text-3xl font-black">{pose.name}</h1>
              <p className="mt-2 font-bold text-[#746a89]">{pose.hint}</p>
              <ol className="mt-4 grid gap-2 text-left">
                {pose.steps.map((step, index) => (
                  <li key={step} className="flex items-center gap-3 rounded-2xl bg-[#f4f0ff] px-3 py-2 text-sm font-extrabold text-[#51476a]">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#6d5cff] text-white">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-4" aria-live="polite">
                <div className="mb-1 flex justify-between text-xs font-black uppercase tracking-wide text-[#756a8a]">
                  <span>{holdProgress > 0 ? "Hold still…" : "Copy the steps"}</span>
                  <span>{Math.round(holdProgress * 100)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#ded7f5]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#6d5cff] to-[#06d6a0] transition-[width] duration-100" style={{ width: `${holdProgress * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex min-h-28 items-center gap-3 rounded-[1.75rem] border-2 border-white bg-white/65 p-3">
              <Character state={mayaState} size={84} />
              <p className="min-w-0 flex-1 text-lg font-extrabold leading-snug">{bubble}</p>
            </div>
            {mock && (
              <div className="grid grid-cols-2 gap-2 rounded-3xl bg-white/60 p-3 sm:flex sm:flex-wrap sm:justify-center">
                {POSES.map((p) => (
                  <button key={p.id} onClick={() => showMockPose(p.id)} className={`rounded-xl px-3 py-2 text-sm font-bold ${mockPose === p.id ? "bg-[#6d5cff] text-white" : "bg-white text-[#3a3352]"}`}>
                    {p.emoji} {p.name}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2.25rem] border-4 border-white bg-white/55 p-3 shadow-xl">
            <KidsCameraStage vision={vision} fit="contain" hint="Step back so Maya can see your whole body 🤸" className="aspect-[4/3] w-full min-h-[250px] sm:min-h-[420px]">
              <div className={`absolute left-3 top-3 z-10 rounded-2xl px-4 py-2 font-black shadow-lg backdrop-blur ${poseCtrl.detected ? "bg-emerald-100/95 text-emerald-700" : "bg-white/90 text-[#6d5cff]"}`} aria-live="polite">
                {poseCtrl.detected ? "✓ I can see you!" : poseCtrl.calibrating ? "Finding your whole body…" : "Stand inside the frame"}
              </div>
            </KidsCameraStage>
          </section>
        </main>
      )}

      {phase === "complete" && (
        <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-76px)] flex-col items-center justify-center gap-4 px-5 pb-12 text-center">
          <div className="text-5xl">🎉</div>
          <Character state="celebrating" message="You copied every pose!" size={140} />
          <div className="text-3xl font-black">Great job!</div>
          <div className="text-lg font-bold text-[#8a7f9e]">Score: ⭐ {score}</div>
          <button onClick={startGame} className="min-h-14 rounded-full bg-[#6d5cff] px-8 text-lg font-black text-white shadow-[0_6px_0_#4a3fd1]">
            PLAY AGAIN
          </button>
        </main>
      )}
    </div>
  );
}
