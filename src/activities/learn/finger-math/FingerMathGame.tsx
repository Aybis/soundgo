import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import type { MockScenario } from "../../../vision/providers/MockVisionProvider";
import { MockVisionProvider } from "../../../vision/providers/MockVisionProvider";
import { GameSession } from "../../../engine/session/GameSession";
import { Character } from "../../../character/Character";
import { fingerLevel } from "../../../content/finger-math";
import type { FingerPrompt } from "../../../content/finger-math";
import { HoldDetector, TemporalSmoothing } from "../../../vision/stabilization/stabilization";
import { Confetti } from "../../../components/feedback/Confetti";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
import { KidsCameraStage } from "../../../components/camera/KidsCameraStage";
import { GameProgress } from "../../../components/ui/GameProgress";
import { KidsButton } from "../../../components/ui/KidsButton";
import { markCompleted } from "../../../state/settings";
import { useSessionLimit } from "../../../hooks/useSessionLimit";
import { ai } from "../../../engine/ai/AIService";

type Phase = "select" | "playing" | "complete";

export default function FingerMathGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("select");
  const [level, setLevel] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [prompt, setPrompt] = useState<FingerPrompt | null>(null);
  const [mayaState, setMayaState] = useState<Parameters<typeof Character>[0]["state"]>("happy");
  const [bubble, setBubble] = useState<string | null>("Choose a level!");
  const [correct, setCorrect] = useState(0);
  const [accepted, setAccepted] = useState<number | null>(null);
  const [seenCount, setSeenCount] = useState<number | null>(null);
  const [mockCount, setMockCount] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);
  const [mockScenario, setMockScenario] = useState<MockScenario>({});
  const [sessionWrapUp, setSessionWrapUp] = useState(false);
  const sessionLimit = useSessionLimit(phase === "playing");

  const { vision, mock, startCamera, startMock } = useCameraInput({
    requirements: { hands: true },
    mockScenario,
    onFrame: (f) => {
      if (phaseRef.current !== "playing" || !promptRef.current) return;
      if (!f.hands.length) {
        sm.current.clear();
        heldCount.current.reset();
        answerLatch.current = null;
        setSeenCount((count) => count === null ? count : null);
        return;
      }
      // count across ALL visible hands (kids use two hands for 6–10)
      const total = f.hands.reduce((s, h) => s + (h.fingerCount ?? 0), 0);
      sm.current.push(total);
      const mode = sm.current.read();
      if (mode === null) return;
      setSeenCount((count) => count === mode ? count : mode);

      // A hand pose must remain stable before it becomes an answer. A pose is
      // evaluated only once, so a noisy frame never racks up repeated misses.
      const stable = heldCount.current.update(mode, f.timestamp);
      if (stable === null || stable === 0 || answerLatch.current === stable) return;
      answerLatch.current = stable;
      handleAnswer(stable);
    },
  });

  const sessionRef = useRef<GameSession | null>(null);
  const promptRef = useRef<FingerPrompt | null>(null);
  const qIndexRef = useRef(0);
  const levelRef = useRef(1);
  const phaseRef = useRef<Phase>("select");
  const sm = useRef(new TemporalSmoothing<number>(5));
  const heldCount = useRef(new HoldDetector<number>(650));
  const answerLatch = useRef<number | null>(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { qIndexRef.current = qIndex; }, [qIndex]);
  useEffect(() => { levelRef.current = level; }, [level]);

  function handleAnswer(count: number) {
    const s = sessionRef.current;
    const p = promptRef.current;
    if (!s || !p || phaseRef.current !== "playing") return;
    const streak = s.streak;
    if (count === p.answer) {
      s.correctNow("Great!");
      setCorrect(s.correct);
      setMayaState("celebrating");
      // AI encouragement
      void ai().encourage({ game: "finger-math", correct: true, streak: streak + 1, attempts: s.attempts, level: levelRef.current, score: s.score }).then((line) => {
        setBubble("✨ " + line);
      });
      setAccepted(p.answer);
      setBurst((b) => b + 1);
      setTimeout(() => nextQuestion(s), 1200);
    } else {
      s.wrongNow("Try again!");
      setMayaState("encouraging");
      const attempts = s.attempts;
      if (attempts >= 3) {
        // child is stuck — offer a hint
        void ai().hint({ game: "finger-math", correct: false, streak, attempts, level: levelRef.current, score: s.score }).then((h) => {
          setBubble(`💡 ${h}`);
        });
      } else {
        void ai().encourage({ game: "finger-math", correct: false, streak, attempts, level: levelRef.current, score: s.score }).then((line) => {
          setBubble(line);
        });
      }
    }
  }

  function resetAnswerState() {
    sm.current.clear();
    heldCount.current.reset();
    answerLatch.current = null;
    setAccepted(null);
    setSeenCount(null);
  }

  function nextQuestion(s: GameSession) {
    // A session limit never cuts a child off mid-answer; wrap up only after
    // their just-finished success feedback has played.
    if (sessionLimit.completeRound()) {
      setSessionWrapUp(true);
      setMayaState("celebrating");
      setBubble("Great playing today! 💜");
      return;
    }
    const lvl = fingerLevel(levelRef.current);
    const next = qIndexRef.current + 1;
    if (next >= lvl.count) {
      s.celebrate(`Level ${lvl.id} complete!`);
      setCorrect(s.correct);
      setMayaState("celebrating");
      setBubble("You did it! 🎉");
      setPhase("complete");
      phaseRef.current = "complete";
      markCompleted("Finger Math");
      return;
    }
    resetAnswerState();
    qIndexRef.current = next;
    setQIndex(next);
    const p = lvl.generate()[next];
    promptRef.current = p;
    setPrompt(p);
    setMayaState("waiting");
    setBubble("Hold your hands inside the magic frame! ✨");
    s.feedback.info(p.text, { voice: true, character: "waiting" });
  }

  function startLevel(lvl: number) {
    const s = new GameSession({ total: fingerLevel(lvl).count });
    sessionRef.current = s;
    levelRef.current = lvl;
    setLevel(lvl);
    qIndexRef.current = 0;
    setQIndex(0);
    setCorrect(0);
    setSessionWrapUp(false);
    resetAnswerState();
    setPhase("playing");
    phaseRef.current = "playing";
    const p = fingerLevel(lvl).generate()[0];
    promptRef.current = p;
    setPrompt(p);
    setMayaState("waiting");
    setBubble("I’m watching your hands! 👀");
    s.feedback.info(p.text, { voice: true, character: "waiting" });
  }

  const showMock = (n: number) => {
    setMockCount(n);
    // split across two hands when the answer needs more than one hand (>5)
    const hands =
      n <= 5 ? [{ fingers: n }] : [{ fingers: 5 }, { fingers: n - 5 }];
    const sc: MockScenario = { hands };
    setMockScenario(sc);
    if (vision.provider instanceof MockVisionProvider) vision.provider.setScenario(sc);
  };

  useEffect(() => {
    if (vision.status === "ready" && phase === "playing") setMayaState("watching");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vision.status]);

  useEffect(() => {
    if (phase === "select") {
      setMayaState("happy");
      setBubble("Choose a level!");
    }
  }, [phase]);

  const promptNumber = level <= 2 ? prompt?.answer : null;

  return (
    <div className="relative h-[100dvh] w-full overflow-y-auto bg-gradient-to-br from-[#fff8ed] via-[#fff1f7] to-[#eeeaff] text-[#3a3352]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-12 top-24 h-40 w-40 rounded-full bg-[#ffd166]/25 blur-2xl" />
        <div className="absolute -right-10 top-1/3 h-48 w-48 rounded-full bg-[#ff9db8]/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[#8f80ff]/20 blur-3xl" />
        <span className="absolute left-[7%] top-[18%] text-2xl anim-floaty">⭐</span>
        <span className="absolute right-[6%] top-[12%] text-2xl anim-floaty" style={{ animationDelay: "0.8s" }}>✨</span>
        <span className="absolute bottom-[10%] left-[4%] text-2xl anim-floaty" style={{ animationDelay: "1.4s" }}>●</span>
      </div>

      {/* camera gate — shown after a child has chosen a level */}
      {phase === "playing" && !mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}

      <Confetti trigger={burst} />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <button
          onClick={() => navigate("/learn")}
          className="min-h-11 rounded-full border-2 border-white bg-white/80 px-4 text-sm font-extrabold text-[#51496b] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
        >
          ← Back
        </button>
        <div className="rounded-full bg-white/75 px-4 py-2 text-sm font-black tracking-wide shadow-sm">
          <span aria-hidden="true">🖐️</span> Finger Magic
        </div>
        {phase === "playing" ? (
          <div className="min-w-[70px] text-right">
            <span className="rounded-full bg-white/75 px-3 py-2 text-sm font-black shadow-sm sm:hidden">
              ⭐ {qIndex + 1}/{fingerLevel(level).count}
            </span>
            <GameProgress current={qIndex} total={fingerLevel(level).count} icon="⭐" className="hidden gap-1 sm:flex" />
          </div>
        ) : (
          <div className="w-[76px]" aria-hidden="true" />
        )}
      </header>

      {phase === "select" && (
        <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-76px)] w-full max-w-3xl flex-col items-center justify-center gap-5 px-5 pb-10 text-center">
          <Character state={mayaState} message={bubble} size={132} />
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">Pick your finger adventure!</h1>
            <p className="mt-1 font-semibold text-[#817795]">Big buttons, five quick questions, lots of stars.</p>
          </div>
          <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            {["🌟", "🌈", "➕", "➖"].map((icon, index) => {
              const lvl = index + 1;
              return (
                <button
                  key={lvl}
                  onClick={() => startLevel(lvl)}
                  className="group flex min-h-24 items-center gap-4 rounded-[1.75rem] border-4 border-white bg-white/80 p-4 text-left shadow-[0_8px_0_rgba(109,92,255,0.12)] transition hover:-translate-y-1 hover:bg-white active:translate-y-1 active:shadow-none"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f1edff] text-3xl transition group-hover:rotate-6">{icon}</span>
                  <span>
                    <span className="block text-xl font-black">Level {lvl}</span>
                    <span className="block text-sm font-bold text-[#817795]">{fingerLevel(lvl).label} · {fingerLevel(lvl).count} questions</span>
                  </span>
                </button>
              );
            })}
          </div>
        </main>
      )}

      {phase === "playing" && (
        <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-4 px-4 pb-6 sm:gap-6 sm:px-6 lg:grid-cols-[minmax(270px,340px)_minmax(0,1fr)] lg:items-center">
          <section className="flex min-w-0 flex-col gap-3">
            <div
              className="rounded-[2rem] border-4 border-white bg-white/80 px-5 py-5 text-center shadow-[0_12px_36px_rgba(82,65,140,0.12)] sm:px-7"
              aria-label={prompt?.text}
            >
              <div className="text-xs font-black uppercase tracking-[0.2em] text-[#8a78e8]">Maya says</div>
              {promptNumber !== null && promptNumber !== undefined ? (
                <div className="mt-1 flex items-center justify-center gap-3 sm:gap-4 lg:flex-col lg:gap-0">
                  <span className="text-xl font-extrabold text-[#6d6480]">Show me</span>
                  <span className="leading-none text-[clamp(4.5rem,18vw,8rem)] font-black text-[#6d5cff] drop-shadow-[0_5px_0_#d9d2ff]">{promptNumber}</span>
                  <span className="text-xl font-extrabold text-[#6d6480]">finger{promptNumber === 1 ? "" : "s"}!</span>
                </div>
              ) : (
                <div className="mt-3 break-words text-[clamp(2.5rem,10vw,4.5rem)] font-black leading-tight text-[#6d5cff]">{prompt?.text}</div>
              )}
            </div>

            <div className="flex min-h-28 items-center gap-3 rounded-[1.75rem] border-2 border-white/90 bg-white/65 p-3 shadow-sm" aria-live="polite">
              <Character state={mayaState} size={88} />
              <p className="min-w-0 flex-1 break-words text-base font-extrabold leading-snug text-[#51496b] sm:text-lg">{bubble}</p>
            </div>
          </section>

          <section className="min-w-0 rounded-[2.25rem] border-4 border-white bg-white/55 p-2 shadow-[0_16px_45px_rgba(82,65,140,0.16)] sm:p-3">
            <KidsCameraStage
              vision={vision}
              hint={seenCount === null ? "Put your whole hand inside ✋" : "Hold still… you’ve got this!"}
              className="aspect-[4/3] w-full min-h-[260px] sm:min-h-[340px] lg:max-h-[610px]"
            >
              {!mock && (
                <div className="absolute left-3 top-3 z-10 rounded-2xl bg-white/90 px-4 py-2 shadow-lg backdrop-blur" aria-live="polite">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#817795]">Maya sees</div>
                  <div className="text-2xl font-black text-[#6d5cff]">{seenCount === null ? "Finding hand…" : `${seenCount} finger${seenCount === 1 ? "" : "s"}`}</div>
                </div>
              )}

              {accepted !== null && (
                <div className="anim-pop absolute inset-0 z-20 grid place-items-center bg-emerald-400/15 backdrop-blur-[2px]">
                  <div className="rounded-[2rem] border-4 border-white bg-emerald-400 px-7 py-4 text-4xl font-black text-white shadow-xl">
                    {accepted} ✓
                  </div>
                </div>
              )}

              {mock && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-[#332d46]/80 px-4 py-5">
                  <div className="font-black text-white">Testing: choose what Maya sees</div>
                  <div className="flex max-w-md flex-wrap items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => showMock(n)}
                        className={`grid h-11 w-11 place-items-center rounded-xl text-base font-black ${mockCount === n ? "bg-[#ffd166] text-[#3a3352]" : "bg-white text-[#3a3352]"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </KidsCameraStage>
            <p className="px-3 pb-1 pt-3 text-center text-sm font-bold text-[#746a89]">Keep your hand open and your whole palm in the frame.</p>
          </section>
        </main>
      )}

      {sessionWrapUp && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#fff6ec]/90 backdrop-blur-sm anim-pop px-5 text-center">
          <Character state="celebrating" message="Great playing today! 💜" size={150} />
          <div className="text-2xl font-black text-[#3a3352]">Time for a little break!</div>
          <div className="text-sm font-semibold text-[#8a7f9e]">You did an amazing job.</div>
          <KidsButton onClick={() => navigate("/")}>GO HOME</KidsButton>
        </div>
      )}

      {phase === "complete" && !sessionWrapUp && (
        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-80px)] max-w-xl flex-col items-center justify-center gap-4 px-5 pb-12 text-center anim-pop">
          <div className="text-6xl">🎉</div>
          <Character state="celebrating" message="AMAZING!" size={140} />
          <GameProgress current={correct} total={fingerLevel(level).count} icon="⭐" />
          <div className="text-2xl font-black text-[#3a3352]">{correct} / {fingerLevel(level).count}</div>
          <div className="text-sm text-[#8a7f9e]">Great job today!</div>
          <div className="flex gap-3">
            <KidsButton onClick={() => startLevel(level)}>PLAY AGAIN</KidsButton>
            <KidsButton variant="secondary" onClick={() => navigate("/learn")}>CHOOSE ANOTHER GAME</KidsButton>
          </div>
        </div>
      )}
    </div>
  );
}
