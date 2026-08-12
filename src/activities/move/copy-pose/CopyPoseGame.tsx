import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { usePoseController } from "../../../hooks/usePoseController";
import { GameSession } from "../../../engine/session/GameSession";
import { Character } from "../../../character/Character";
import { Confetti } from "../../../components/feedback/Confetti";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
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
    if (phase !== "playing" || !pose || !poseCtrl.detected) return;
    const allMatch = pose.rules.every((r) => poseCtrl.matched.includes(r));
    const now = performance.now();
    if (allMatch) {
      if (holdSince.current === null) holdSince.current = now;
      else if (now - holdSince.current >= 600 && !done.current) {
        done.current = true;
        onPoseMatched();
      }
    } else {
      holdSince.current = null;
    }
  }, [poseCtrl.matched, phase, pose]);

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
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] flex flex-col items-center justify-center gap-4 px-4">
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
          <div className="text-2xl font-bold text-[#3a3352]">Copy the Pose!</div>
          <div className="text-sm text-[#8a7f9e]">5 poses · MAYA shows, you copy!</div>
          <button onClick={startGame} className="px-8 py-3 rounded-full bg-[#6d5cff] text-white font-medium hover:bg-[#5a4ce6]">
            Start
          </button>
        </div>
      )}

      {phase === "playing" && pose && (
        <>
          <div className="text-center">
            <div className="text-5xl">{pose.emoji}</div>
            <div className="text-2xl font-bold text-[#3a3352] mt-2">{pose.name}</div>
            <div className="text-sm text-[#8a7f9e] mt-1">Round {round}/5 · ⭐ {score}</div>
          </div>

          {poseCtrl.calibrating && (
            <div className="px-4 py-2 rounded-full bg-[#6d5cff]/10 text-[#6d5cff] text-sm">Calibrating — stand so I can see you…</div>
          )}

          {/* mock pose buttons */}
          {mock && (
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {POSES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => showMockPose(p.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium ${mockPose === p.id ? "bg-[#6d5cff] text-white" : "bg-white/80 text-[#3a3352] border border-[#eadff5]"}`}
                >
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {phase === "complete" && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl">🎉</div>
          <div className="text-2xl font-bold text-[#3a3352]">Great job!</div>
          <div className="text-lg text-[#8a7f9e]">Score: ⭐ {score}</div>
          <button onClick={startGame} className="px-6 py-2 rounded-full bg-[#6d5cff] text-white text-sm font-medium hover:bg-[#5a4ce6]">
            Play again
          </button>
        </div>
      )}
    </div>
  );
}