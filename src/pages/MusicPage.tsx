import { useCallback, useEffect, useRef, useState } from "react";
import { ControlBar, DEFAULT_CONTROLS } from "../components/ControlBar";
import type { Controls } from "../components/ControlBar";
import { StartOverlay } from "../components/StartOverlay";
import { useHandTracking } from "../hooks/useHandTracking";
import { ChordSynth } from "../engine/audio";
import {
  CHORDS, CHROMATIC, NATURALS,
  inScale, letterToSemitone, midiToFreq, rangeBaseMidi, snapToScale,
} from "../engine/music";

interface Wheel {
  cx: number; cy: number; r: number; count: number;
}

const ACCENT = "#6d5cff";

export default function MusicPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { status, error, start, detect } = useHandTracking(videoRef);

  const [controls, setControls] = useState<Controls>(DEFAULT_CONTROLS);
  const controlsRef = useRef<Controls>(DEFAULT_CONTROLS);
  const synthRef = useRef<ChordSynth | null>(null);
  const [badge, setBadge] = useState({ root: "C", chord: "maj" });

  const setControlsBoth = useCallback((c: Controls) => {
    setControls(c);
    controlsRef.current = c;
    synthRef.current?.setWave(c.wave as OscillatorType);
  }, []);

  // main engine loop (runs once camera is ready)
  useEffect(() => {
    if (status !== "ready") return;
    const canvas = canvasRef.current!;
    const video = videoRef.current!;
    const ctx = canvas.getContext("2d")!;
    if (!synthRef.current) synthRef.current = new ChordSynth();
    const synth = synthRef.current;
    synth.ensure();
    synth.resume();

    let raf = 0;
    let lastChordKey = "";

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const layout = (w: number, h: number): [Wheel, Wheel] => {
      const r = Math.min(h * 0.34, w * 0.20);
      return [
        { cx: w * 0.28, cy: h * 0.46, r, count: 0 },
        { cx: w * 0.72, cy: h * 0.46, r, count: CHORDS.length },
      ];
    };

    // Slot i lives at angle (i/count)*2PI - PI/2 (slot 0 at top, clockwise).
    // Fraction 0.0 = top, 0.25 = right, 0.5 = bottom, 0.75 = left.
    const angleFrac = (dx: number, dy: number) => {
      let a = Math.atan2(dy, dx) + Math.PI / 2;
      a = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      return a / (2 * Math.PI);
    };

    const drawWheel = (
      wheel: Wheel,
      labels: string[],
      highlight: number | null,
      activeSlots: number[],
      centerLabel: string,
    ) => {
      const { cx, cy, r } = wheel;
      const count = labels.length;
      const seg = (Math.PI * 2) / count;

      // highlight wedge (what the hand currently points at)
      if (highlight !== null) {
        const a0 = (highlight / count) * Math.PI * 2 - Math.PI / 2 - seg / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, a0, a0 + seg);
        ctx.closePath();
        ctx.fillStyle = "rgba(109,92,255,0.22)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, r, a0, a0 + seg);
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + Math.cos(a) * (r - 0.18 * r);
        const x2 = cx + Math.cos(a) * r;
        const y1 = cy + Math.sin(a) * (r - 0.18 * r);
        const y2 = cy + Math.sin(a) * r;
        const isHL = highlight === i;
        const isActive = activeSlots.includes(i);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isHL
          ? ACCENT
          : isActive
            ? "rgba(255,255,255,0.35)"
            : "rgba(255,255,255,0.12)";
        ctx.lineWidth = isHL ? 3 : 1.5;
        ctx.stroke();
        // label
        const lr = r - 0.34 * r;
        const lx = cx + Math.cos(a) * lr;
        const ly = cy + Math.sin(a) * lr;
        ctx.font = "600 " + Math.round(r * 0.16) + "px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isHL ? ACCENT : "rgba(255,255,255,0.55)";
        ctx.fillText(labels[i], lx, ly);
      }
      // center caption
      ctx.font = "600 " + Math.round(r * 0.11) + "px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(centerLabel, cx, cy);
    };

    const compute = (w: number, h: number, hands: { x: number; y: number }[]) => {
      const c = controlsRef.current;
      const [left, right] = layout(w, h);
      left.count = c.simple ? NATURALS.length : CHROMATIC.length;

      // assign hands to wheels by screen x
      const sorted = [...hands].sort((a, b) => a.x - b.x);
      const leftHand = sorted[0];
      const rightHand = sorted[1];

      const readWheel = (hand: { x: number; y: number } | undefined, wheel: Wheel) => {
        if (!hand) return null;
        const dx = hand.x - wheel.cx;
        const dy = hand.y - wheel.cy;
        const dist = Math.hypot(dx, dy);
        if (dist > wheel.r * 1.7) return null; // hand moved away
        return angleFrac(dx, dy);
      };

      const lFrac = readWheel(leftHand, left);
      const rFrac = readWheel(rightHand, right);

      // ---- root note (left wheel) ----
      let rootSemitone: number;
      let rootLabel: string;
      let rootIndex: number | null = null;
      if (lFrac !== null) {
        if (c.snap) {
          const i = Math.round(lFrac * left.count) % left.count;
          rootIndex = i;
          rootSemitone = c.simple ? letterToSemitone(NATURALS[i]) : i;
          rootLabel = c.simple ? NATURALS[i] : CHROMATIC[(i + 12) % 12];
          if (c.scale !== "Chromatic") rootSemitone = snapToScale(rootSemitone, c.scale);
        } else {
          rootSemitone = lFrac * 12;
          rootLabel = "~";
        }
      } else {
        rootSemitone = 3;
        rootLabel = "C";
      }

      // ---- chord (right wheel) ----
      let chordIndex = 0;
      if (rFrac !== null) {
        chordIndex = Math.round(rFrac * CHORDS.length) % CHORDS.length;
      }
      const chord = CHORDS[chordIndex].intervals;
      const chordName = CHORDS[chordIndex].name;

      const mode = c.mode;
      let freqs: number[];
      const baseMidi = rangeBaseMidi(c.range) + rootSemitone;
      if (mode === "two-hand") {
        freqs = chord.map((iv) => midiToFreq(baseMidi + iv));
      } else {
        // melody: pitch follows right hand vertical position
        if (rightHand) {
          const frac = 1 - rightHand.y / h;
          const melodyMidi = rangeBaseMidi(c.range) + frac * 24;
          freqs = [midiToFreq(melodyMidi), ...chord.map((iv) => midiToFreq(rangeBaseMidi(c.range) - 12 + iv))];
        } else {
          freqs = chord.map((iv) => midiToFreq(baseMidi + iv));
        }
      }

      return { freqs, rootLabel, chordName, rootIndex, chordIndex };
    };

    const frame = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const [left, right] = layout(w, h);
      left.count = controlsRef.current.simple ? NATURALS.length : CHROMATIC.length;

      ctx.clearRect(0, 0, w, h);

      // hands
      const det = detect(video);
      const screen: { x: number; y: number }[] = [];
      if (det) {
        for (const p of det.points) {
          const vw = video.videoWidth || 1;
          const vh = video.videoHeight || 1;
          const scale = Math.max(w / vw, h / vh);
          const ox = (w - vw * scale) / 2;
          const oy = (h - vh * scale) / 2;
          // mirrored x (camera is mirrored on screen)
          screen.push({ x: (1 - p.x) * vw * scale + ox, y: p.y * vh * scale + oy });
        }
      }

      const res = compute(w, h, screen);
      const key = res.freqs.map((f) => f.toFixed(1)).join(",") + "|" + res.rootLabel + res.chordName;
      if (key !== lastChordKey) {
        lastChordKey = key;
        synth.play(res.freqs);
        setBadge({ root: res.rootLabel, chord: res.chordName });
      }

      // scale-active slots (notes that belong to the scale)
      const c = controlsRef.current;
      const activeSlotsL: number[] = [];
      for (let i = 0; i < left.count; i++) {
        const sem = c.simple ? letterToSemitone(NATURALS[i]) : i;
        if (inScale(sem, c.scale)) activeSlotsL.push(i);
      }

      const leftLabels = c.simple ? NATURALS : CHROMATIC;
      const rightLabels = CHORDS.map((c2) => c2.name);
      drawWheel(left, leftLabels, res.rootIndex, activeSlotsL, res.rootLabel);
      drawWheel(right, rightLabels, res.chordIndex, [], CHORDS[res.chordIndex].name);

      // hand cursors
      for (const h of screen) {
        ctx.beginPath();
        ctx.arc(h.x, h.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = ACCENT;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(h.x, h.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(109,92,255,0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      synth.stop();
    };
  }, [status, detect]);

  const handleStart = () => {
    synthRef.current?.ensure();
    synthRef.current?.resume();
    start();
  };

  return (
    <div className="relative h-screen w-screen bg-[#0a0a12] overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-40 -scale-x-100"
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {status === "ready" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-black/50 border border-white/10 text-sm text-zinc-200 backdrop-blur">
          <span className="text-[#6d5cff] font-semibold">{badge.root}</span>
          <span className="text-zinc-400"> · </span>
          <span className="text-zinc-200 font-semibold">{badge.chord}</span>
        </div>
      )}

      {status !== "ready" && <StartOverlay status={status} error={error} onStart={handleStart} />}

      {status === "ready" && (
        <div className="absolute inset-x-0 bottom-0 z-10">
          <ControlBar controls={controls} onChange={setControlsBoth} />
        </div>
      )}
    </div>
  );
}