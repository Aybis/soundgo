import { useEffect, useRef, useState } from "react";
import { useHandTracking } from "../hooks/useHandTracking";
import { ChordSynth } from "../engine/audio";
import { SONGS } from "../engine/songs";
import type { Song, SongEvent } from "../engine/songs";
import { CHORDS, NATURALS, midiToFreq, rangeBaseMidi } from "../engine/music";
import { StartOverlay } from "../components/StartOverlay";

const ACCENT = "#6d5cff";
const HIT_WINDOW = 0.18; // seconds
const PERFECT_WINDOW = 0.06;
const NATURAL_SEMITONES: Record<string, number> = { A: 0, B: 2, C: 3, D: 5, E: 7, F: 8, G: 10 };
const LEFT_COUNT = 7; // A B C D E F G
const RIGHT_COUNT = CHORDS.length;

interface Hud { score: number; combo: number; maxCombo: number; perfect: number; good: number; miss: number; }
type Screen = "select" | "playing" | "done";

export default function PlayPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { status, error, start, detect } = useHandTracking(videoRef);

  const [screen, setScreen] = useState<Screen>("select");
  const [song, setSong] = useState<Song | null>(null);
  const [hud, setHud] = useState<Hud>({ score: 0, combo: 0, maxCombo: 0, perfect: 0, good: 0, miss: 0 });
  const [grade, setGrade] = useState("—");

  const startSong = (s: Song) => {
    setSong(s);
    setScreen("playing");
  };

  useEffect(() => {
    if (screen !== "playing" || status !== "ready" || !song) return;
    const canvas = canvasRef.current!;
    const video = videoRef.current!;
    const ctx = canvas.getContext("2d")!;
    const synth = new ChordSynth();
    synth.ensure();
    synth.resume();

    const bps = song.bpm / 60;
    const lead = song.lead;
    const startTime = performance.now();
    const n = song.events.length;
    const hitScored = new Array(n).fill(false);
    const played = new Array(n).fill(false);
    let nextEvent = 0;
    let raf = 0;
    let lastHudKey = "";

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const layout = (w: number, h: number) => {
      const r = Math.min(h * 0.34, w * 0.20);
      return [
        { cx: w * 0.28, cy: h * 0.46, r },
        { cx: w * 0.72, cy: h * 0.46, r },
      ];
    };

    const angleFrac = (dx: number, dy: number) => {
      let a = Math.atan2(dy, dx) + Math.PI / 2;
      a = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      return a / (2 * Math.PI);
    };
    const slotAngle = (i: number, count: number) => (i / count) * Math.PI * 2 - Math.PI / 2;

    const evTime = (ev: SongEvent) => ev.beat / bps;
    const freqsFor = (ev: SongEvent) => {
      const base = rangeBaseMidi(3) + NATURAL_SEMITONES[ev.root];
      return CHORDS[ev.chord].intervals.map((iv) => midiToFreq(base + iv));
    };

    const drawWheel = (
      wheel: { cx: number; cy: number; r: number },
      labels: string[],
      target: number | null,
      centerLabel: string,
    ) => {
      const { cx, cy, r } = wheel;
      const count = labels.length;
      const seg = (Math.PI * 2) / count;
      if (target !== null) {
        const a0 = slotAngle(target, count) - seg / 2;
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
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let i = 0; i < count; i++) {
        const a = slotAngle(i, count);
        const x1 = cx + Math.cos(a) * (r * 0.82);
        const x2 = cx + Math.cos(a) * r;
        const y1 = cy + Math.sin(a) * (r * 0.82);
        const y2 = cy + Math.sin(a) * r;
        const isHL = target === i;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isHL ? ACCENT : "rgba(255,255,255,0.14)";
        ctx.lineWidth = isHL ? 3 : 1.5;
        ctx.stroke();
        const lr = r * 0.66;
        ctx.font = "600 " + Math.round(r * 0.16) + "px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isHL ? ACCENT : "rgba(255,255,255,0.55)";
        ctx.fillText(labels[i], cx + Math.cos(a) * lr, cy + Math.sin(a) * lr);
      }
      ctx.font = "600 " + Math.round(r * 0.11) + "px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(centerLabel, cx, cy);
    };

    const frame = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const [left, right] = layout(w, h);
      ctx.clearRect(0, 0, w, h);

      const elapsed = (performance.now() - startTime) / 1000;

      // hands → screen (mirrored)
      const screen: { x: number; y: number }[] = [];
      const det = detect(video);
      if (det) {
        const vw = video.videoWidth || 1, vh = video.videoHeight || 1;
        const scale = Math.max(w / vw, h / vh);
        const ox = (w - vw * scale) / 2, oy = (h - vh * scale) / 2;
        for (const p of det.points) {
          screen.push({ x: (1 - p.x) * vw * scale + ox, y: p.y * vh * scale + oy });
        }
      }

      // current hand selections
      const sorted = [...screen].sort((a, b) => a.x - b.x);
      let leftSel: number | null = null, rightSel: number | null = null;
      const readL = (s: { x: number; y: number } | undefined, wheel: { cx: number; cy: number; r: number }, count: number) => {
        if (!s) return null;
        if (Math.hypot(s.x - wheel.cx, s.y - wheel.cy) > wheel.r * 1.7) return null;
        return Math.round(angleFrac(s.x - wheel.cx, s.y - wheel.cy) * count) % count;
      };
      leftSel = readL(sorted[0], left, LEFT_COUNT);
      rightSel = readL(sorted[1], right, RIGHT_COUNT);

      // --- gameplay logic ---
      let targetRoot: number | null = null;
      let targetChord: number | null = null;
      if (nextEvent < n) {
        const ev = song.events[nextEvent];
        const t = evTime(ev);
        const diff = elapsed - t;

        // play the chord when it lands
        if (!played[nextEvent] && elapsed >= t - 0.02) {
          played[nextEvent] = true;
          synth.play(freqsFor(ev));
        }

        // hit or miss
        if (Math.abs(diff) <= HIT_WINDOW) {
          const rootSlot = NATURALS.indexOf(ev.root);
          if (leftSel === rootSlot && rightSel === ev.chord && !hitScored[nextEvent]) {
            hitScored[nextEvent] = true;
            const perfect = Math.abs(diff) <= PERFECT_WINDOW;
            const hud = scoreRef.current;
            hud.score += perfect ? 100 : 50;
            hud.combo += 1;
            hud.maxCombo = Math.max(hud.maxCombo, hud.combo);
            if (perfect) hud.perfect++; else hud.good++;
            nextEvent++;
          }
        } else if (diff > HIT_WINDOW) {
          if (!hitScored[nextEvent]) {
            const hud = scoreRef.current;
            hud.miss++;
            hud.combo = 0;
            hitScored[nextEvent] = true;
          }
          nextEvent++;
        }

        // guidance: show target on wheels
        if (nextEvent < n) {
          targetRoot = NATURALS.indexOf(song.events[nextEvent].root);
          targetChord = song.events[nextEvent].chord;
        }
      }

      // end of song
      if (nextEvent >= n && elapsed > songSecondsRef.current + 1) {
        const hud = scoreRef.current;
        const acc = (hud.perfect + hud.good) / n;
        const g = acc >= 0.9 ? "S" : acc >= 0.75 ? "A" : acc >= 0.5 ? "B" : "C";
        setGrade(g);
        setScreen("done");
        cancelAnimationFrame(raf);
        synth.stop();
        return;
      }

      // draw wheels + target
      drawWheel(left, NATURALS, targetRoot, targetRoot !== null ? NATURALS[targetRoot] : "ROOT");
      drawWheel(right, CHORDS.map((c) => c.name), targetChord, targetChord !== null ? CHORDS[targetChord].name : "CHORD");

      // falling notes
      for (let i = nextEvent; i < n; i++) {
        const ev = song.events[i];
        const t = evTime(ev);
        const remain = t - elapsed;
        if (remain < 0 || remain > lead) continue;
        const p = remain / lead; // 1 → 0
        const rootSlot = NATURALS.indexOf(ev.root);
        // left marker
        const lr = left.r + p * left.r * 0.5;
        const la = slotAngle(rootSlot, LEFT_COUNT);
        mark(left.cx + Math.cos(la) * lr, left.cy + Math.sin(la) * lr, NATURALS[rootSlot], p);
        // right marker
        const rr = right.r + p * right.r * 0.5;
        const ra = slotAngle(ev.chord, RIGHT_COUNT);
        mark(right.cx + Math.cos(ra) * rr, right.cy + Math.sin(ra) * rr, CHORDS[ev.chord].name, p);
      }

      // hand cursors
      for (const s of screen) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = ACCENT;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(109,92,255,0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // progress bar
      const prog = Math.min(1, elapsed / songSecondsRef.current);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(0, h - 3, w, 3);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(0, h - 3, w * prog, 3);

      // hud (on change)
      const hud = scoreRef.current;
      const key = hud.score + "|" + hud.combo + "|" + hud.perfect + hud.good + hud.miss;
      if (key !== lastHudKey) {
        lastHudKey = key;
        setHud({ score: hud.score, combo: hud.combo, maxCombo: hud.maxCombo, perfect: hud.perfect, good: hud.good, miss: hud.miss });
      }

      raf = requestAnimationFrame(frame);
    };

    const mark = (x: number, y: number, label: string, p: number) => {
      const r = 10 + p * 6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = p < 0.35 ? ACCENT : "rgba(109,92,255,0.55)";
      ctx.fill();
      ctx.font = "700 " + Math.round(r) + "px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(label, x, y);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      synth.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, status, song]);

  const scoreRef = useRef({ score: 0, combo: 0, maxCombo: 0, perfect: 0, good: 0, miss: 0 });
  const songSecondsRef = useRef(0);
  songSecondsRef.current = song ? song.events[song.events.length - 1].beat * (60 / song.bpm) + 2 : 0;

  const handleStart = () => start();

  return (
    <div className="relative h-screen w-screen bg-[#0a0a12] overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover opacity-40 -scale-x-100"
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {status !== "ready" && <StartOverlay status={status} error={error} onStart={handleStart} />}

      {status === "ready" && screen === "select" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6">
          <h1 className="text-3xl font-light tracking-[0.2em] text-white uppercase">
            Choose a <span className="text-[#6d5cff]">song</span>
          </h1>
          <div className="flex flex-col gap-3 w-72">
            {SONGS.map((s) => (
              <button
                key={s.id}
                onClick={() => startSong(s)}
                className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#6d5cff] hover:bg-white/10 transition-colors text-left group"
              >
                <div className="text-white font-medium group-hover:text-[#a79bff]">{s.title}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  {s.bpm} BPM · {s.events.length} chords · left=root, right=chord
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {status === "ready" && screen === "playing" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
          <div className="px-4 py-1.5 rounded-full bg-black/50 border border-white/10 text-sm text-zinc-200 backdrop-blur">
            {song?.title}
          </div>
          <div className="px-4 py-1 rounded-full bg-black/40 border border-white/10 text-xs text-zinc-300 backdrop-blur font-mono">
            {hud.score} pts · combo <span className="text-[#6d5cff] font-semibold">x{hud.combo}</span> ·{" "}
            <span className="text-emerald-400">{hud.perfect}✓</span>{" "}
            <span className="text-amber-400">{hud.good}~</span>{" "}
            <span className="text-red-400">{hud.miss}✗</span>
          </div>
        </div>
      )}

      {status === "ready" && screen === "done" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/70 backdrop-blur-sm">
          <div className="text-5xl font-bold text-[#6d5cff]">{grade}</div>
          <div className="text-white text-2xl font-medium">{hud.score} pts</div>
          <div className="text-sm text-zinc-400">
            Perfect {hud.perfect} · Good {hud.good} · Miss {hud.miss} · Max combo {hud.maxCombo}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setScreen("select")}
              className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200"
            >
              Play again
            </button>
            {song && (
              <button
                onClick={() => startSong(song)}
                className="px-5 py-2 rounded-full bg-[#6d5cff] text-white text-sm font-medium hover:bg-[#5a4ce6]"
              >
                Replay {song.title}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}