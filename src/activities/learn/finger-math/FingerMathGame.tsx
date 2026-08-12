import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import type { MockScenario } from "../../../vision/providers/MockVisionProvider";
import { MockVisionProvider } from "../../../vision/providers/MockVisionProvider";
import { GameSession } from "../../../engine/session/GameSession";
import { Character } from "../../../character/Character";
import { fingerLevel } from "../../../content/finger-math";
import type { FingerPrompt } from "../../../content/finger-math";
import { TemporalSmoothing } from "../../../vision/stabilization/stabilization";
import { Confetti } from "../../../components/feedback/Confetti";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
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
  const [score, setScore] = useState(0);
  const [accepted, setAccepted] = useState<number | null>(null);
  const [mockCount, setMockCount] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);
  const [mockScenario, setMockScenario] = useState<MockScenario>({});

  const { vision, mock, startCamera, startMock } = useCameraInput({
    requirements: { hands: true },
    mockScenario,
    onFrame: (f) => {
      if (phaseRef.current !== "playing" || !promptRef.current) return;
      if (!f.hands.length) return;
      // count across ALL visible hands (kids use two hands for 6–10)
      const total = f.hands.reduce((s, h) => s + (h.fingerCount ?? 0), 0);
      sm.current.push(total);
      const mode = sm.current.read();
      if (mode === null) return;
      const now = f.timestamp;
      if (now - lastAnswerAt.current > 600) {
        handleAnswer(mode, now);
      }
    },
  });

  const sessionRef = useRef<GameSession | null>(null);
  const promptRef = useRef<FingerPrompt | null>(null);
  const qIndexRef = useRef(0);
  const levelRef = useRef(1);
  const phaseRef = useRef<Phase>("select");
  const sm = useRef(new TemporalSmoothing<number>(5));
  const lastAnswerAt = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { qIndexRef.current = qIndex; }, [qIndex]);
  useEffect(() => { levelRef.current = level; }, [level]);

  function handleAnswer(count: number, now: number) {
    const s = sessionRef.current;
    const p = promptRef.current;
    if (!s || !p || phaseRef.current !== "playing") return;
    lastAnswerAt.current = now;
    const streak = s.streak;
    if (count === p.answer) {
      s.correctNow("Great!");
      setScore(s.score);
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
    lastAnswerAt.current = 0;
    setAccepted(null);
  }

  function nextQuestion(s: GameSession) {
    const lvl = fingerLevel(levelRef.current);
    const next = qIndexRef.current + 1;
    if (next >= lvl.count) {
      s.celebrate(`Level ${lvl.id} complete!`);
      setMayaState("celebrating");
      setBubble("You did it! 🎉");
      setPhase("complete");
      phaseRef.current = "complete";
      setScore(s.score);
      return;
    }
    resetAnswerState();
    qIndexRef.current = next;
    setQIndex(next);
    const p = lvl.generate()[next];
    promptRef.current = p;
    setPrompt(p);
    setMayaState("waiting");
    setBubble(p.text);
    s.feedback.info(p.text, { voice: true, character: "waiting" });
  }

  function startLevel(lvl: number) {
    const s = new GameSession({ total: fingerLevel(lvl).count });
    sessionRef.current = s;
    levelRef.current = lvl;
    setLevel(lvl);
    qIndexRef.current = 0;
    setQIndex(0);
    setScore(0);
    resetAnswerState();
    setPhase("playing");
    phaseRef.current = "playing";
    const p = fingerLevel(lvl).generate()[0];
    promptRef.current = p;
    setPrompt(p);
    setMayaState("waiting");
    setBubble(p.text);
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

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] flex flex-col items-center justify-center gap-4 px-4">
      <button
        onClick={() => navigate("/learn")}
        className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium hover:bg-white"
      >
        ← Back
      </button>

      {/* camera gate — real camera is the default */}
      {mock ? (
        phase === "playing" && (
          <div className="absolute bottom-20 right-4 z-20 text-xs text-[#8a7f9e] bg-white/70 border border-[#eadff5] px-3 py-1.5 rounded-full">
            🖐️ mock · {mockCount ?? "—"} fingers
          </div>
        )
      ) : vision.status !== "ready" ? (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      ) : null}

      <Character state={mayaState} message={bubble} size={130} />
      <Confetti trigger={burst} />

      {phase === "select" && (
        <div className="flex flex-col gap-3 w-64">
          {[1, 2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              onClick={() => startLevel(lvl)}
              className="px-5 py-3 rounded-2xl bg-white/80 border border-[#eadff5] hover:border-[#6d5cff] hover:bg-white transition-colors text-left"
            >
              <span className="font-bold text-[#3a3352]">Level {lvl}</span>
              <span className="text-xs text-[#8a7f9e] ml-2">{fingerLevel(lvl).label} · {fingerLevel(lvl).count} questions</span>
            </button>
          ))}
        </div>
      )}

      {phase === "playing" && (
        <>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#3a3352]">{prompt?.text}</div>
            <div className="text-sm text-[#8a7f9e] mt-1">
              Level {level} · Q {qIndex + 1}/{fingerLevel(level).count} · ⭐ {score}
            </div>
          </div>

          {accepted !== null && (
            <div className="px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-700 font-bold text-2xl">
              {accepted} ✓
            </div>
          )}

          {/* camera preview */}
          {!mock && (
            <div className="relative w-64 h-40 rounded-2xl overflow-hidden bg-black/80 border border-white/10">
              <div
                ref={(el) => {
                  if (el && vision.videoElement && !el.contains(vision.videoElement)) el.appendChild(vision.videoElement);
                }}
                className="absolute inset-0"
              >
                <style>{`video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}`}</style>
              </div>
            </div>
          )}

          {/* mock finger buttons (testing only) */}
          {mock && (
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => showMock(n)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium ${
                    mockCount === n ? "bg-[#6d5cff] text-white" : "bg-white/80 text-[#3a3352] border border-[#eadff5]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {phase === "complete" && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-5xl font-bold text-[#6d5cff]">🎉</div>
          <div className="text-2xl font-bold text-[#3a3352]">Level {level} complete!</div>
          <div className="text-lg text-[#8a7f9e]">Score: ⭐ {score}</div>
          <div className="flex gap-3">
            <button onClick={() => startLevel(level)} className="px-5 py-2 rounded-full bg-[#6d5cff] text-white text-sm font-medium hover:bg-[#5a4ce6]">
              Replay
            </button>
            <button onClick={() => setPhase("select")} className="px-5 py-2 rounded-full bg-white text-[#3a3352] text-sm font-medium border border-[#eadff5]">
              Levels
            </button>
          </div>
        </div>
      )}
    </div>
  );
}