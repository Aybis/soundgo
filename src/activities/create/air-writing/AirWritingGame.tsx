import { useEffect, useRef, useState } from "react";
import { useVision } from "../../../hooks/useVision";
import { usePointerController } from "../../../hooks/usePointerController";
import { TrajectoryTracker } from "../../../motion/trajectory/TrajectoryTracker";
import { traceScore, resample } from "../../../motion/trajectory/scoring";
import { Character } from "../../../character/Character";
import { WRITING_SETS, strokeById } from "../../../content/prompts";

type Phase = "select" | "playing" | "complete";

export default function AirWritingGame() {
  const [phase, setPhase] = useState<Phase>("select");
  const [setId, setSetId] = useState("abc");
  const [strokeIdx, setStrokeIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [mayaState, setMayaState] = useState<"happy" | "celebrating" | "encouraging" | "waiting">("happy");
  const [bubble, setBubble] = useState<string | null>("Pick a set!");
  const [mock, setMock] = useState(true);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<Phase>("select");
  const strokeIdxRef = useRef(0);
  const setIdRef = useRef("abc");
  const tracker = useRef(new TrajectoryTracker({
    alpha: 0.5,
    minDistance: 3,
    onPoint: (p) => trailRef.current.push({ x: p.x, y: p.y }),
    onStrokeEnd: (points) => onStrokeDoneRef.current(points),
  }));
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const onStrokeDoneRef = useRef<(t: { x: number; y: number }[]) => void>(() => {});

  const vision = useVision({ requirements: { hands: true }, mock });
  const { pointer } = usePointerController(vision, stageRef, phase === "playing");

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { strokeIdxRef.current = strokeIdx; }, [strokeIdx]);
  useEffect(() => { setIdRef.current = setId; }, [setId]);

  // canvas draw loop: draw the trail live
  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    const loop = () => {
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.strokeStyle = "#6d5cff";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const trail = trailRef.current;
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (const p of trail.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [phase]);

  // feed pointer into tracker; onStrokeEnd handles scoring
  useEffect(() => {
    onStrokeDoneRef.current = onStrokeDone;
  });

  useEffect(() => {
    if (phase !== "playing") return;
    const t = tracker.current;
    t.update(pointer.present ? { x: pointer.x, y: pointer.y } : null, performance.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointer]);

  function onStrokeDone(trail: { x: number; y: number }[]) {
    const setId = setIdRef.current;
    const sIdx = strokeIdxRef.current;
    const stroke = strokeById(WRITING_SETS.find((s) => s.id === setId)!.strokes[sIdx]);
    const box = getTraceBox();
    // map trail → normalized in the trace box
    const normTrail = trail.map((p) => ({ x: (p.x - box.x) / box.w, y: (p.y - box.y) / box.h }));
    const template = stroke.points.map(([x, y]) => ({ x, y }));
    const { score, ok } = traceScore(template, normTrail);
    setLastScore(score);
    if (ok) {
      setScore((s) => s + 100);
      setMayaState("celebrating");
      setBubble(`${stroke.label}! Nice!`);
      setTimeout(() => {
        const next = sIdx + 1;
        const set = WRITING_SETS.find((s) => s.id === setId)!;
        if (next >= set.strokes.length) {
          setPhase("complete");
          phaseRef.current = "complete";
          setBubble("You did it! 🎉");
          return;
        }
        setStrokeIdx(next);
        strokeIdxRef.current = next;
        setMayaState("waiting");
        setBubble(`Trace the ${strokeById(set.strokes[next]).label}!`);
      }, 1200);
    } else {
      setMayaState("encouraging");
      setBubble("Almost! Try tracing it again!");
      setTimeout(() => { setBubble(`Trace the ${stroke.label}!`); setMayaState("waiting"); }, 1600);
    }
    trailRef.current = [];
  }

  function getTraceBox() {
    // the trace box is a fixed area above the controls
    const w = window.innerWidth, h = window.innerHeight;
    return { x: w * 0.15, y: h * 0.22, w: w * 0.7, h: h * 0.5 };
  }

  function start(setIdArg: string) {
    setIdRef.current = setIdArg;
    setSetId(setIdArg);
    strokeIdxRef.current = 0;
    setStrokeIdx(0);
    setScore(0);
    trailRef.current = [];
    tracker.current.clear();
    setPhase("playing");
    phaseRef.current = "playing";
    const first = strokeById(WRITING_SETS.find((s) => s.id === setIdArg)!.strokes[0]);
    setMayaState("waiting");
    setBubble(`Trace the ${first.label}!`);
  }

  const currentStroke = strokeById(WRITING_SETS.find((s) => s.id === setId)?.strokes[strokeIdx] ?? "A");

  return (
    <div ref={stageRef} className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] relative">
      <button onClick={() => setPhase("select")} className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium hover:bg-white">
        ← Back
      </button>

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
        <Character state={mayaState} message={bubble} size={110} />
      </div>

      {phase === "select" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="text-2xl font-bold text-[#3a3352]">Air Writing!</div>
          <div className="text-sm text-[#8a7f9e]">Trace the letter in the air with your finger!</div>
          <div className="flex gap-3">
            {WRITING_SETS.map((s) => (
              <button key={s.id} onClick={() => start(s.id)} className="px-6 py-3 rounded-2xl bg-white/85 border border-[#eadff5] hover:border-[#6d5cff] text-xl font-bold text-[#3a3352]">
                {s.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-[#8a7f9e] mt-2">
            <input type="checkbox" checked={mock} onChange={(e) => setMock(e.target.checked)} className="accent-[#6d5cff]" />
            Mock (no camera)
          </label>
        </div>
      )}

      {phase === "playing" && (
        <>
          {/* trace canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 z-0" />
          {/* target stroke ghost */}
          <svg className="absolute z-0 pointer-events-none" style={{ left: window.innerWidth * 0.15, top: window.innerHeight * 0.22, width: window.innerWidth * 0.7, height: window.innerHeight * 0.5 }}>
            <polyline
              points={currentStroke.points.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")}
              fill="none"
              stroke="rgba(109,92,255,0.25)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="absolute top-40 left-1/2 -translate-x-1/2 text-center z-10">
            <div className="text-5xl font-bold text-[#6d5cff]">{currentStroke.label}</div>
            <div className="text-sm text-[#8a7f9e] mt-1">
              Trace it! · ⭐ {score} {lastScore !== null && <span className="ml-2 text-xs">last: {lastScore}%</span>}
            </div>
          </div>

          {/* mock: simulate a traced stroke */}
          {mock && (
            <button
              onClick={() => {
                const box = getTraceBox();
                const template = resample(currentStroke.points.map(([x, y]) => ({ x, y })), 40);
                trailRef.current = template.map((p) => ({ x: box.x + p.x * box.w, y: box.y + p.y * box.h }));
                onStrokeDone(trailRef.current);
              }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-6 py-3 rounded-full bg-[#6d5cff] text-white font-medium"
            >
              ✍️ Trace {currentStroke.label} (mock)
            </button>
          )}
        </>
      )}

      {phase === "complete" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-sm">
          <div className="text-5xl">🎉</div>
          <div className="text-2xl font-bold text-[#3a3352]">Set complete!</div>
          <div className="text-lg text-[#8a7f9e]">Score: ⭐ {score}</div>
          <div className="flex gap-3">
            <button onClick={() => start(setId)} className="px-5 py-2 rounded-full bg-[#6d5cff] text-white text-sm font-medium hover:bg-[#5a4ce6]">Replay</button>
            <button onClick={() => setPhase("select")} className="px-5 py-2 rounded-full bg-white text-[#3a3352] text-sm font-medium border border-[#eadff5]">Sets</button>
          </div>
        </div>
      )}
    </div>
  );
}