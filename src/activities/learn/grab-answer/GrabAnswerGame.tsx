import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { usePointerController } from "../../../hooks/usePointerController";
import { GameSession } from "../../../engine/session/GameSession";
import { Character } from "../../../character/Character";
import { InteractiveTarget } from "../../../components/game/InteractiveTarget";
import { GestureCursor } from "../../../components/game/GestureCursor";
import { Confetti } from "../../../components/feedback/Confetti";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
import { grabSubject } from "../../../content/grab-answer";
import type { GrabQuestion } from "../../../content/grab-answer";

type Phase = "select" | "playing" | "complete";

interface TargetPos { x: number; y: number; }

export default function GrabAnswerGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("select");
  const [subjectId, setSubjectId] = useState("math");
  const [question, setQuestion] = useState<GrabQuestion | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [mayaState, setMayaState] = useState<"happy" | "celebrating" | "encouraging" | "waiting">("happy");
  const [bubble, setBubble] = useState<string | null>("Choose a game!");
  const [burst, setBurst] = useState(0);
  const [locked, setLocked] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const phaseRef = useRef<Phase>("select");
  const questionRef = useRef<GrabQuestion | null>(null);
  const qIndexRef = useRef(0);
  const subjectIdRef = useRef("math");
  const positionsRef = useRef<TargetPos[]>([]);
  const lastSelect = useRef(0);

  const { vision, mock, startCamera, startMock } = useCameraInput({ requirements: { hands: true } });
  const { pointer, selectTick } = usePointerController(vision, stageRef, phase === "playing");

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { qIndexRef.current = qIndex; }, [qIndex]);
  useEffect(() => { subjectIdRef.current = subjectId; }, [subjectId]);

  // respond to selection ticks (hand pinch or mouse click)
  useEffect(() => {
    if (!selectTick || phaseRef.current !== "playing" || !questionRef.current) return;
    // cooldown so a single pinch doesn't double-fire
    const now = performance.now();
    if (now - lastSelect.current < 400) return;
    lastSelect.current = now;

    // find the target the pointer is over
    const idx = positionsRef.current.findIndex((p) => Math.hypot(p.x - pointer.x, p.y - pointer.y) < 90);
    if (idx === -1) return; // not over any target
    answer(idx);
  }, [selectTick]);

  function answer(idx: number) {
    const s = sessionRef.current;
    const q = questionRef.current;
    if (!s || !q || locked) return;
    setLocked(true);
    if (idx === q.answerIndex) {
      s.correctNow("Great!");
      setScore(s.score);
      setMayaState("celebrating");
      setBubble(q.options[idx].label + "! Yes!");
      setBurst((b) => b + 1);
      setTimeout(() => nextQuestion(s), 1100);
    } else {
      s.wrongNow("Try again!");
      setMayaState("encouraging");
      setBubble("Hmm, try another one!");
      setLocked(false);
    }
  }

  function nextQuestion(s: GameSession) {
    const subj = grabSubject(subjectIdRef.current);
    const next = qIndexRef.current + 1;
    if (next >= subj.count) {
      s.celebrate(`Level complete!`);
      setMayaState("celebrating");
      setBubble("You did it! 🎉");
      setScore(s.score);
      setPhase("complete");
      phaseRef.current = "complete";
      return;
    }
    loadQuestion(s, subj.generate()[next], next);
  }

  function loadQuestion(s: GameSession, q: GrabQuestion, idx: number) {
    qIndexRef.current = idx;
    setQIndex(idx);
    questionRef.current = q;
    setQuestion(q);
    setLocked(false);
    setMayaState("waiting");
    setBubble(q.prompt);
    // place targets in a triangle around the stage center
    const w = window.innerWidth, h = window.innerHeight;
    const cy = h * 0.52;
    positionsRef.current = q.options.map((_, i) => ({
      x: w * (0.5 + (i - (q.options.length - 1) / 2) * 0.22),
      y: cy,
    }));
    s.feedback.info(q.prompt, { voice: true, character: "waiting" });
  }

  function startSubject(id: string) {
    const subj = grabSubject(id);
    const s = new GameSession({ total: subj.count });
    sessionRef.current = s;
    subjectIdRef.current = id;
    setSubjectId(id);
    qIndexRef.current = 0;
    setQIndex(0);
    setScore(0);
    setPhase("playing");
    phaseRef.current = "playing";
    const q = subj.generate()[0];
    loadQuestion(s, q, 0);
  }

  return (
    <div
      ref={stageRef}
      className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff]"
    >
      <button
        onClick={() => navigate("/learn")}
        className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium hover:bg-white"
      >
        ← Back
      </button>

      {/* camera gate — real camera is the default */}
      {!mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
        <Character state={mayaState} message={bubble} size={110} />
      </div>

      {phase === "select" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="text-2xl font-bold text-[#3a3352] mb-2">Grab the Answer!</div>
          <div className="grid grid-cols-2 gap-3 w-80">
            {["math", "colors", "animals", "shapes", "vocab"].map((id) => {
              const s = grabSubject(id);
              return (
                <button
                  key={id}
                  onClick={() => startSubject(id)}
                  className="px-4 py-4 rounded-2xl bg-white/85 border border-[#eadff5] hover:border-[#6d5cff] hover:bg-white transition-colors text-center"
                >
                  <div className="text-3xl">{s.emoji}</div>
                  <div className="font-bold text-[#3a3352] mt-1">{s.title}</div>
                  <div className="text-xs text-[#8a7f9e]">{s.count} questions</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === "playing" && question && (
        <>
          <div className="absolute top-36 left-1/2 -translate-x-1/2 text-center z-10">
            <div className="text-3xl font-bold text-[#3a3352]">{question.prompt}</div>
            <div className="text-sm text-[#8a7f9e] mt-1">
              Q {qIndex + 1}/{grabSubject(subjectId).count} · ⭐ {score}
            </div>
          </div>

          {/* targets */}
          {question.options.map((opt, i) => (
            <InteractiveTarget
              key={i}
              option={opt}
              x={positionsRef.current[i]?.x ?? window.innerWidth / 2}
              y={positionsRef.current[i]?.y ?? window.innerHeight / 2}
              selected={false}
              onSelect={() => answer(i)}
            />
          ))}

          <GestureCursor pointer={pointer} />
          <Confetti trigger={burst} />

          {!mock && (
            <div
              ref={(el) => { if (el && vision.videoElement && !el.contains(vision.videoElement)) el.appendChild(vision.videoElement); }}
              className="absolute bottom-3 left-3 z-10 w-40 h-28 rounded-xl overflow-hidden bg-black/70 border border-white/10"
            >
              <style>{`video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}`}</style>
            </div>
          )}
          {mock && (
            <div className="absolute bottom-3 left-3 z-10 w-40 h-28 rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center text-zinc-400 text-xs">
              🖐️ mock mode · click targets
            </div>
          )}
        </>
      )}

      {phase === "complete" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-sm">
          <div className="text-5xl">🎉</div>
          <div className="text-2xl font-bold text-[#3a3352]">Level complete!</div>
          <div className="text-lg text-[#8a7f9e]">Score: ⭐ {score}</div>
          <div className="flex gap-3">
            <button onClick={() => startSubject(subjectId)} className="px-5 py-2 rounded-full bg-[#6d5cff] text-white text-sm font-medium hover:bg-[#5a4ce6]">
              Replay
            </button>
            <button onClick={() => setPhase("select")} className="px-5 py-2 rounded-full bg-white text-[#3a3352] text-sm font-medium border border-[#eadff5]">
              Games
            </button>
          </div>
        </div>
      )}
    </div>
  );
}