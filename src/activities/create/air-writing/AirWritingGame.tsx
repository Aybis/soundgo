import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { usePointerController } from "../../../hooks/usePointerController";
import { TrajectoryTracker } from "../../../motion/trajectory/TrajectoryTracker";
import { traceScore, resample } from "../../../motion/trajectory/scoring";
import { Character } from "../../../character/Character";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
import { WRITING_SETS, strokeById } from "../../../content/prompts";

type Phase = "select" | "playing" | "complete";
type Mode = "trace" | "free";

const COLORS = ["#6d5cff", "#ff6b9d", "#06d6a0", "#ffd166", "#ff8c42", "#3b82f6"];

export default function AirWritingGame() {
  const [phase, setPhase] = useState<Phase>("select");
  const [mode, setMode] = useState<Mode>("free");
  const [setId, setSetId] = useState("abc");
  const [strokeIdx, setStrokeIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [mayaState, setMayaState] = useState<"happy" | "celebrating" | "encouraging" | "waiting">("happy");
  const [bubble, setBubble] = useState<string | null>("Let's draw!");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(8);
  const navigate = useNavigate();

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<Phase>("select");
  const modeRef = useRef<Mode>("free");
  const strokeIdxRef = useRef(0);
  const setIdRef = useRef("abc");
  const colorRef = useRef(COLORS[0]);
  const widthRef = useRef(8);
  const strokesRef = useRef<{ points: { x: number; y: number }[]; color: string; width: number }[]>([]);
  const tracker = useRef(new TrajectoryTracker({
    alpha: 0.5,
    minDistance: 3,
    onPoint: (p) => trailRef.current.push({ x: p.x, y: p.y }),
    onStrokeEnd: (points) => onStrokeDoneRef.current(points),
  }));
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const onStrokeDoneRef = useRef<(t: { x: number; y: number }[]) => void>(() => {});

  const { vision, mock, startCamera, startMock } = useCameraInput({ requirements: { hands: true } });
  const { pointer } = usePointerController(vision, stageRef, phase === "playing");

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { strokeIdxRef.current = strokeIdx; }, [strokeIdx]);
  useEffect(() => { setIdRef.current = setId; }, [setId]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { widthRef.current = width; }, [width]);

  // canvas draw loop: draw all completed strokes + the live trail
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
    const paint = (pts: { x: number; y: number }[], c: string, w: number) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    };
    const loop = () => {
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const s of strokesRef.current) paint(s.points, s.color, s.width);
      paint(trailRef.current, colorRef.current, widthRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [phase]);

  // feed pointer into tracker; onStrokeEnd handles scoring / persisting
  useEffect(() => {
    onStrokeDoneRef.current = onStrokeDone;
  });

  useEffect(() => {
    if (phase !== "playing") return;
    const t = tracker.current;
    t.update(pointer.present ? { x: pointer.x, y: pointer.y } : null, performance.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointer]);

  function clearDraw() {
    strokesRef.current = [];
  }

  function onStrokeDone(trail: { x: number; y: number }[]) {
    if (modeRef.current === "free") {
      // persist the drawing so it stays on the canvas
      if (trail.length > 1) {
        strokesRef.current.push({ points: trail, color: colorRef.current, width: widthRef.current });
        setMayaState("celebrating");
        setBubble("Wow! Look what you made! 🎨");
        setTimeout(() => { setMayaState("happy"); setBubble("Draw with your finger!"); }, 1500);
      }
      trailRef.current = [];
      return;
    }
    const setId = setIdRef.current;
    const sIdx = strokeIdxRef.current;
    const stroke = strokeById(WRITING_SETS.find((s) => s.id === setId)!.strokes[sIdx]);
    const box = getTraceBox();
    // map trail → normalized in the trace box
    const normTrail = trail.map((p) => ({ x: (p.x - box.x) / box.w, y: (p.y - box.y) / box.h }));
    const template = stroke.points.map(([x, y]) => ({ x, y }));
    const { ok } = traceScore(template, normTrail);
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
      <button onClick={() => navigate("/create")} className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium hover:bg-white">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="text-3xl font-black text-[#3a3352]">Air Draw!</div>
          <div className="text-sm text-[#8a7f9e]">Draw with your finger in the air!</div>
          <div className="flex flex-col gap-3 w-64">
            <button onClick={() => { setMode("free"); setPhase("playing"); phaseRef.current = "playing"; setBubble("Draw with your finger!"); }}
              className="px-6 py-4 rounded-[2rem] bg-gradient-to-br from-[#ffb36b] to-[#ff8c42] text-white font-extrabold text-xl shadow-lg hover:scale-[1.03] transition-transform">
              🎨 Free Draw
            </button>
            <button onClick={() => { setMode("trace"); start("abc"); }}
              className="px-6 py-3 rounded-2xl bg-white/85 border border-[#eadff5] text-[#3a3352] font-bold hover:border-[#6d5cff]">
              ✍️ Trace letters
            </button>
          </div>
        </div>
      )}

      {phase === "playing" && (
        <>
          {/* draw canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 z-0" />

          {/* target stroke ghost (trace mode only) */}
          {mode === "trace" && (
            <svg className="absolute z-0 pointer-events-none" style={{ left: window.innerWidth * 0.15, top: window.innerHeight * 0.22, width: window.innerWidth * 0.7, height: window.innerHeight * 0.5 }}>
              <polyline points={currentStroke.points.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")} fill="none" stroke="rgba(109,92,255,0.25)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          {mode === "trace" && (
            <div className="absolute top-40 left-1/2 -translate-x-1/2 text-center z-10">
              <div className="text-5xl font-bold text-[#6d5cff]">{currentStroke.label}</div>
              <div className="text-sm text-[#8a7f9e] mt-1">Trace it! · ⭐ {score}</div>
            </div>
          )}

          {/* free-draw controls */}
          {mode === "free" && (
            <div className="absolute bottom-6 inset-x-0 z-20 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-2 py-1.5 shadow">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={`h-7 w-7 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-[#3a3352]" : "border-white"}`} style={{ background: c }} aria-label={`color ${c}`} />
                ))}
                <button onClick={() => setWidth((w) => (w === 8 ? 16 : 8))} className="px-2 text-xs font-bold text-[#3a3352]">{width === 8 ? "Thin" : "Thick"}</button>
                <button onClick={clearDraw} className="px-3 py-1 rounded-full bg-red-100 text-red-500 text-xs font-bold">🗑 Clear</button>
              </div>
            </div>
          )}

          {/* mock controls */}
          {mock && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {mode === "free" && (
                <button onClick={() => clearDraw()} className="px-4 py-2 rounded-full bg-[#6d5cff] text-white text-sm font-bold">Clear (mock)</button>
              )}
              {mode === "trace" && (
                <button
                  onClick={() => {
                    const box = getTraceBox();
                    const template = resample(currentStroke.points.map(([x, y]) => ({ x, y })), 40);
                    trailRef.current = template.map((p) => ({ x: box.x + p.x * box.w, y: box.y + p.y * box.h }));
                    onStrokeDone(trailRef.current);
                  }}
                  className="px-6 py-3 rounded-full bg-[#6d5cff] text-white font-medium"
                >
                  ✍️ Trace {currentStroke.label} (mock)
                </button>
              )}
            </div>
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