import { useEffect, useRef, useState } from "react";
import { useWebcamLandmarkers } from "../hooks/useWebcamLandmarkers";
import { StartOverlay } from "../components/StartOverlay";

const FACE_EYE_L = 33;
const FACE_EYE_R = 263;
const HAND_WRIST = 0;
const HAND_MIDDLE = 12;

interface Box {
  cx: number; cy: number; w: number; h: number; angle: number;
}

export default function InteractionPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { status, error, start, detect } = useWebcamLandmarkers(videoRef);

  const [region, setRegion] = useState<"both" | "face" | "hands">("both");
  const regionRef = useRef(region);
  const [pixel, setPixel] = useState(12);
  const pixelRef = useRef(pixel);
  const [showBoxes, setShowBoxes] = useState(true);
  const showBoxesRef = useRef(showBoxes);
  const [fps, setFps] = useState(0);

  const setRegionBoth = (r: typeof region) => { setRegion(r); regionRef.current = r; };
  const setPixelBoth = (p: number) => { setPixel(p); pixelRef.current = p; };
  const setBoxesBoth = (b: boolean) => { setShowBoxes(b); showBoxesRef.current = b; };

  useEffect(() => {
    if (status !== "ready") return;
    const canvas = canvasRef.current!;
    const video = videoRef.current!;
    const ctx = canvas.getContext("2d")!;

    let raf = 0;
    let frames = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // oriented bounding box from landmarks + a tilt angle
    const orientedBox = (pts: { x: number; y: number }[], angleRad: number): Box => {
      const cos = Math.cos(angleRad), sin = Math.sin(angleRad);
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
      for (const p of pts) {
        const u = p.x * cos + p.y * sin;
        const v = -p.x * sin + p.y * cos;
        if (u < minU) minU = u; if (u > maxU) maxU = u;
        if (v < minV) minV = v; if (v > maxV) maxV = v;
      }
      const cu = (minU + maxU) / 2, cv = (minV + maxV) / 2;
      return {
        cx: cu * cos - cv * sin,
        cy: cu * sin + cv * cos,
        w: maxU - minU,
        h: maxV - minV,
        angle: angleRad,
      };
    };

    const eyeAngle = (p: { x: number; y: number }[]) => {
      const l = p[FACE_EYE_L], r = p[FACE_EYE_R];
      return Math.atan2(l.y - r.y, l.x - r.x);
    };
    const handAngle = (p: { x: number; y: number }[]) => {
      const w = p[HAND_WRIST], m = p[HAND_MIDDLE];
      return Math.atan2(m.y - w.y, m.x - w.x);
    };

    // coordinate transform: mirrored video in client space
    const cover = (nx: number, ny: number) => {
      const w = window.innerWidth, h = window.innerHeight;
      const vw = video.videoWidth || 1, vh = video.videoHeight || 1;
      const scale = Math.max(w / vw, h / vh);
      const ox = (w - vw * scale) / 2, oy = (h - vh * scale) / 2;
      return { x: (1 - nx) * vw * scale + ox, y: ny * vh * scale + oy };
    };

    const srcCanvas = document.createElement("canvas");
    const sctx = srcCanvas.getContext("2d")!;

    const frame = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      const vw = video.videoWidth || 1, vh = video.videoHeight || 1;
      const scale = Math.max(w / vw, h / vh);
      const ox = (w - vw * scale) / 2, oy = (h - vh * scale) / 2;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // draw mirrored, cover-fit video
      ctx.save();
      ctx.translate(ox + vw * scale, oy);
      ctx.scale(-scale, scale);
      ctx.drawImage(video, 0, 0, vw, vh);
      ctx.restore();

      const det = detect(video);
      const boxes: Box[] = [];
      if (det) {
        if (regionRef.current !== "hands") {
          for (const face of det.faces) {
            const pts = face.map((p) => cover(p.x, p.y));
            boxes.push(orientedBox(pts, eyeAngle(pts)));
          }
        }
        if (regionRef.current !== "face") {
          for (const hand of det.hands) {
            const pts = hand.map((p) => cover(p.x, p.y));
            boxes.push(orientedBox(pts, handAngle(pts)));
          }
        }
      }

      // pixelate inside each tilted box
      const px = pixelRef.current;
      for (const b of boxes) {
        const cols = Math.max(2, Math.round(b.w / px));
        const rows = Math.max(2, Math.round(b.h / px));
        srcCanvas.width = cols;
        srcCanvas.height = rows;
        sctx.imageSmoothingEnabled = false;
        sctx.drawImage(canvas, b.cx - b.w / 2, b.cy - b.h / 2, b.w, b.h, 0, 0, cols, rows);
        ctx.save();
        ctx.translate(b.cx, b.cy);
        ctx.rotate(b.angle);
        ctx.beginPath();
        ctx.rect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.clip();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(srcCanvas, 0, 0, cols, rows, -b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      }

      // tilted rectangle borders
      if (showBoxesRef.current) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        for (const b of boxes) {
          ctx.save();
          ctx.translate(b.cx, b.cy);
          ctx.rotate(b.angle);
          ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h);
          ctx.restore();
        }
      }

      // fps
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [status, detect]);

  const handleStart = () => start();

  return (
    <div className="relative h-screen w-screen bg-[#0a0a12] overflow-hidden">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {status === "ready" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-black/50 border border-white/10 text-xs text-zinc-300 backdrop-blur font-mono">
          pixelation · {fps} fps
        </div>
      )}

      {status !== "ready" && <StartOverlay status={status} error={error} onStart={handleStart} />}

      {status === "ready" && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 bg-[#0d0d16]/80 backdrop-blur border-t border-white/10">
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-300">
            Region
            <select value={region} onChange={(e) => setRegionBoth(e.target.value as typeof region)}>
              <option value="both">Face + Hands</option>
              <option value="face">Face</option>
              <option value="hands">Hands</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-[11px] text-zinc-300">
            Pixel
            <input
              type="range" min={6} max={28} value={pixel}
              onChange={(e) => setPixelBoth(Number(e.target.value))}
              className="accent-[#6d5cff] w-28"
            />
            <span className="font-mono text-zinc-400 w-6">{pixel}</span>
          </label>

          <label className="flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={showBoxes} onChange={(e) => setBoxesBoth(e.target.checked)}
              className="accent-[#6d5cff] h-3.5 w-3.5 cursor-pointer" />
            Tilted boxes
          </label>
        </div>
      )}
    </div>
  );
}