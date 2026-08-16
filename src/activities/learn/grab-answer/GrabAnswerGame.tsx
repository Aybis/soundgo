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
import { KidsCameraStage } from "../../../components/camera/KidsCameraStage";
import { GameProgress } from "../../../components/ui/GameProgress";
import { KidsButton } from "../../../components/ui/KidsButton";
import { loadSettings, markCompleted } from "../../../state/settings";
import { voice } from "../../../engine/voice/VoiceService";
import { animalConversation, answerFeedback } from "../../../content/conversation";
import { grabSubject, generateMixedSession } from "../../../content/grab-answer";
import type { GrabQuestion } from "../../../content/grab-answer";

type Phase = "select" | "playing" | "complete";

interface TargetPos { x: number; y: number; }

export default function GrabAnswerGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("select");
  const [question, setQuestion] = useState<GrabQuestion | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(5);
  const [mayaState, setMayaState] = useState<"happy" | "celebrating" | "encouraging" | "waiting">("happy");
  const [bubble, setBubble] = useState<string | null>("Choose a game!");
  const [burst, setBurst] = useState(0);
  const [locked, setLocked] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const phaseRef = useRef<Phase>("select");
  const questionRef = useRef<GrabQuestion | null>(null);
  const qIndexRef = useRef(0);
  const totalRef = useRef(5);
  const positionsRef = useRef<TargetPos[]>([]);
  const lastSelect = useRef(0);

  const { vision, mock, startCamera, startMock } = useCameraInput({ requirements: { hands: true } });
  const { pointer, selectTick } = usePointerController(vision, stageRef, phase === "playing");

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { qIndexRef.current = qIndex; }, [qIndex]);

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
    // `selectTick` is the event boundary; pointer coordinates are sampled at
    // that moment and must not retrigger an answer while the hand keeps moving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectTick]);

  function answer(idx: number) {
    const s = sessionRef.current;
    const q = questionRef.current;
    if (!s || !q || locked) return;
    setLocked(true);
    if (idx === q.answerIndex) {
      s.correctNow("Great!");
      setCorrect(s.correct);
      setMayaState("celebrating");
      const language = loadSettings().language;
      const animalId = q.options[idx].animalId;
      const feedback = answerFeedback(language, true);
      setBubble(animalId ? `${animalConversation(animalId, language).label}! ${feedback}` : feedback);
      void voice().speak(animalId ? `${animalConversation(animalId, language).label}. ${feedback}` : feedback, { language });
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
    const next = qIndexRef.current + 1;
    if (next >= totalRef.current) {
      s.celebrate(`Level complete!`);
      setCorrect(s.correct);
      setMayaState("celebrating");
      setBubble("You did it! 🎉");
      setPhase("complete");
      phaseRef.current = "complete";
      markCompleted("Grab the Answer");
      return;
    }
    const qs = generateMixedSession(totalRef.current);
    loadQuestion(s, qs[next], next);
  }

  function loadQuestion(s: GameSession, q: GrabQuestion, idx: number) {
    qIndexRef.current = idx;
    setQIndex(idx);
    questionRef.current = q;
    setQuestion(q);
    setLocked(false);
    setMayaState("waiting");
    const language = loadSettings().language;
    const prompt = q.options.find((option) => option.animalId)?.animalId
      ? animalConversation(q.options.find((option) => option.animalId)!.animalId!, language)
      : null;
    const spokenPrompt = prompt?.prompt ?? q.prompt;
    setBubble("Point, then pinch the right answer! 🤏");
    // place targets along the lower-mid stage
    const w = window.innerWidth, h = window.innerHeight;
    const cy = h * 0.56;
    positionsRef.current = q.options.map((_, i) => ({
      x: w * (0.5 + (i - (q.options.length - 1) / 2) * 0.24),
      y: cy,
    }));
    void voice().speak(spokenPrompt, { language });
    s.feedback.info(spokenPrompt, { voice: false, character: "waiting" });
  }

  function begin(questions: GrabQuestion[], n: number) {
    const s = new GameSession({ total: n });
    sessionRef.current = s;
    totalRef.current = n;
    setTotal(n);
    qIndexRef.current = 0;
    setQIndex(0);
    setCorrect(0);
    setPhase("playing");
    phaseRef.current = "playing";
    loadQuestion(s, questions[0], 0);
  }

  function startMixed() {
    begin(generateMixedSession(8), 8);
  }

  function startSubject(id: string) {
    const subj = grabSubject(id);
    begin(subj.generate(), subj.count);
  }

  return (
    <div
      ref={stageRef}
      className="relative h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-[#fff8ed] via-[#fff1f7] to-[#eeeaff]"
    >
      <button
        onClick={() => navigate("/learn")}
        className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium hover:bg-white"
      >
        ← Back
      </button>

      {/* camera gate — real camera is the default */}
      {phase === "playing" && !mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}

      {phase === "select" && (
        <div className="absolute inset-0 flex flex-col items-center gap-4 overflow-y-auto px-5 pb-8 pt-20 text-center">
          <Character state={mayaState} message={bubble} size={92} />
          <div className="text-3xl font-black text-[#3a3352] sm:text-4xl">Grab the Answer!</div>
          <button
            onClick={startMixed}
            className="w-full max-w-80 px-6 py-5 rounded-[2rem] border-4 border-white bg-gradient-to-br from-[#ffb36b] to-[#ff8c42] text-center shadow-[0_8px_0_rgba(220,101,29,0.18)] hover:scale-[1.03] transition-transform"
          >
            <div className="text-3xl">🌟</div>
            <div className="font-extrabold text-white text-xl">Adventure</div>
            <div className="text-xs text-white/80 font-semibold">Numbers · Colors · Shapes · Animals — 8 questions</div>
          </button>
          <div className="grid w-full max-w-80 grid-cols-2 gap-3">
            {["math", "colors", "animals", "shapes", "vocab"].map((id) => {
              const s = grabSubject(id);
              return (
                <button
                  key={id}
                  onClick={() => startSubject(id)}
                  className="min-h-28 rounded-2xl border-2 border-white bg-white/85 px-4 py-4 text-center shadow-sm transition-colors hover:border-[#6d5cff] hover:bg-white"
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
          <div className="absolute left-[116px] right-3 top-3 z-10 rounded-[1.5rem] border-2 border-white bg-white/85 px-3 py-3 text-center shadow-lg backdrop-blur sm:left-1/2 sm:right-auto sm:w-[min(62vw,680px)] sm:-translate-x-1/2 sm:px-6">
            <div className="break-words text-lg font-black leading-tight text-[#3a3352] sm:text-3xl">{question.options.find((option) => option.animalId) ? animalConversation(question.options.find((option) => option.animalId)!.animalId!, loadSettings().language).prompt : question.prompt}</div>
            <div className="mt-1 hidden sm:block"><GameProgress current={qIndex} total={total} icon="⭐" /></div>
            <div className="mt-1 text-xs font-black text-[#817795] sm:hidden">⭐ {qIndex + 1}/{total}</div>
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

          <div className="absolute bottom-3 left-3 z-10 h-20 w-28 sm:bottom-4 sm:left-4 sm:h-32 sm:w-44">
            <KidsCameraStage vision={vision} className="h-full w-full" />
          </div>
          <div className="absolute bottom-3 right-3 z-10 flex max-w-[210px] items-center gap-2 rounded-[1.5rem] border-2 border-white bg-white/80 p-2 shadow-lg backdrop-blur" aria-live="polite">
            <Character state={mayaState} size={64} />
            <p className="min-w-0 flex-1 break-words text-sm font-extrabold leading-tight text-[#51496b]">{bubble}</p>
          </div>
        </>
      )}

      {phase === "complete" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-sm anim-pop">
          <div className="text-6xl">🎉</div>
          <Character state="celebrating" message="AMAZING!" size={140} />
          <GameProgress current={correct} total={total} icon="⭐" />
          <div className="text-2xl font-black text-[#3a3352]">{correct} / {total}</div>
          <div className="flex gap-3">
            <KidsButton onClick={startMixed}>PLAY AGAIN</KidsButton>
            <KidsButton variant="secondary" onClick={() => navigate("/learn")}>CHOOSE ANOTHER GAME</KidsButton>
          </div>
        </div>
      )}
    </div>
  );
}
