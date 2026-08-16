import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../../../hooks/useCameraInput";
import { usePointerController } from "../../../hooks/usePointerController";
import { AudioEngine } from "../../../engine/audio/AudioEngine";
import { Character } from "../../../character/Character";
import { CameraStartOverlay } from "../../../components/camera/CameraStartOverlay";
import { KidsCameraStage } from "../../../components/camera/KidsCameraStage";
import { KidsButton } from "../../../components/ui/KidsButton";
import { GameProgress } from "../../../components/ui/GameProgress";
import { Confetti } from "../../../components/feedback/Confetti";
import { voice } from "../../../engine/voice/VoiceService";

const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
const NOTE_FREQS = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88];
const MELODY = [0, 2, 4, 2, 0];

const ROOTS = [
  { label: "C", semitones: 0 }, { label: "C♯", semitones: 1 },
  { label: "D", semitones: 2 }, { label: "E♭", semitones: 3 },
  { label: "E", semitones: 4 }, { label: "F", semitones: 5 },
  { label: "F♯", semitones: 6 }, { label: "G", semitones: 7 },
  { label: "A♭", semitones: 8 }, { label: "A", semitones: 9 },
  { label: "B♭", semitones: 10 }, { label: "B", semitones: 11 },
];

const CHORDS = [
  { label: "Major", short: "maj", emoji: "☀️", intervals: [0, 4, 7] },
  { label: "Minor", short: "min", emoji: "🌙", intervals: [0, 3, 7] },
  { label: "Sus 2", short: "sus2", emoji: "🫧", intervals: [0, 2, 7] },
  { label: "Sus 4", short: "sus4", emoji: "🚀", intervals: [0, 5, 7] },
  { label: "Augmented", short: "aug", emoji: "🔆", intervals: [0, 4, 8] },
  { label: "Diminished", short: "dim", emoji: "🌘", intervals: [0, 3, 6] },
  { label: "Minor 7", short: "m7", emoji: "💫", intervals: [0, 3, 7, 10] },
  { label: "Seventh", short: "7", emoji: "🌈", intervals: [0, 4, 7, 10] },
  { label: "Major 7", short: "maj7", emoji: "✨", intervals: [0, 4, 7, 11] },
];

type Mode = "wheel" | "free" | "follow";
type HandDot = { x: number; y: number; color: string };

export default function AirPianoPage() {
  const navigate = useNavigate();
  const [mayaState, setMayaState] = useState<"happy" | "celebrating" | "waiting">("happy");
  const [active, setActive] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("wheel");
  const [melodyIdx, setMelodyIdx] = useState(0);
  const [burst, setBurst] = useState(0);
  const [rootIndex, setRootIndex] = useState(0);
  const [chordIndex, setChordIndex] = useState(0);
  const [handDots, setHandDots] = useState<HandDot[]>([]);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const rootWheelRef = useRef<HTMLDivElement | null>(null);
  const chordWheelRef = useRef<HTMLDivElement | null>(null);
  const lastNote = useRef(-1);
  const audioRef = useRef<AudioEngine | null>(null);
  const melodyIdxRef = useRef(0);
  const modeRef = useRef<Mode>("wheel");
  const rootIndexRef = useRef(0);
  const chordIndexRef = useRef(0);
  const lastDotKey = useRef("");

  const { vision, mock, startCamera, startMock } = useCameraInput({ requirements: { hands: true } });
  const visionRef = useRef(vision);
  visionRef.current = vision;
  const { pointer } = usePointerController(vision, stageRef, true);

  useEffect(() => { melodyIdxRef.current = melodyIdx; }, [melodyIdx]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { rootIndexRef.current = rootIndex; }, [rootIndex]);
  useEffect(() => { chordIndexRef.current = chordIndex; }, [chordIndex]);

  function getAudio() {
    if (!audioRef.current) audioRef.current = new AudioEngine();
    audioRef.current.ensure();
    audioRef.current.resume();
    return audioRef.current;
  }

  function playNote(idx: number) {
    getAudio().playNote(NOTE_FREQS[idx], { group: "music", type: "triangle", duration: 0.45, volume: 0.5 });
    setActive(idx);
    setMayaState("celebrating");
    window.setTimeout(() => setMayaState(modeRef.current === "follow" ? "waiting" : "happy"), 300);
  }

  function playWheelChord(root = rootIndexRef.current, chord = chordIndexRef.current) {
    const base = 261.63 * Math.pow(2, ROOTS[root].semitones / 12);
    const frequencies = CHORDS[chord].intervals.map((semitones) => base * Math.pow(2, semitones / 12));
    getAudio().playChord(frequencies, 0.18);
    setMayaState("celebrating");
  }

  function hitFollowTarget(idx: number) {
    if (idx !== MELODY[melodyIdxRef.current]) return;
    playNote(idx);
    const next = melodyIdxRef.current + 1;
    if (next >= MELODY.length) {
      setMelodyIdx(0);
      melodyIdxRef.current = 0;
      setBurst((b) => b + 1);
      setMayaState("celebrating");
      voice().speak("Great job!");
      window.setTimeout(() => setMayaState("waiting"), 900);
    } else {
      setMelodyIdx(next);
      melodyIdxRef.current = next;
    }
  }

  useEffect(() => {
    if (modeRef.current === "wheel") return;
    if (!pointer.present) { lastNote.current = -1; setActive(null); return; }
    const idx = Math.min(NOTE_FREQS.length - 1, Math.max(0, Math.floor((pointer.x / window.innerWidth) * NOTE_FREQS.length)));
    if (idx === lastNote.current) return;
    lastNote.current = idx;
    if (modeRef.current === "follow") hitFollowTarget(idx);
    else playNote(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointer]);

  function wheelIndexAt(point: { x: number; y: number }, element: HTMLDivElement | null, count: number) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const dx = point.x - (rect.left + rect.width / 2);
    const dy = point.y - (rect.top + rect.height / 2);
    const radius = Math.min(rect.width, rect.height) / 2;
    const distance = Math.hypot(dx, dy);
    if (distance < radius * 0.25 || distance > radius * 1.08) return null;
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    return Math.round((angle / (Math.PI * 2)) * count) % count;
  }

  function updateWheelFromPoint(point: { x: number; y: number }) {
    const nextRoot = wheelIndexAt(point, rootWheelRef.current, ROOTS.length);
    const nextChord = wheelIndexAt(point, chordWheelRef.current, CHORDS.length);
    if (nextRoot !== null && nextRoot !== rootIndexRef.current) {
      rootIndexRef.current = nextRoot;
      setRootIndex(nextRoot);
    }
    if (nextChord !== null && nextChord !== chordIndexRef.current) {
      chordIndexRef.current = nextChord;
      setChordIndex(nextChord);
    }
  }

  useEffect(() => {
    if (mode !== "wheel") {
      setHandDots([]);
      audioRef.current?.stopMusic();
      return;
    }
    let raf = 0;
    const loop = () => {
      const currentVision = visionRef.current;
      const hands = currentVision.latestFrame.current?.hands ?? [];
      const dots = hands.map((hand, index) => {
        const point = currentVision.camera.mapPoint(hand.indexTip, window.innerWidth, window.innerHeight);
        updateWheelFromPoint(point);
        return { ...point, color: index === 0 ? "#ffd166" : "#06d6a0" };
      });
      const dotKey = dots.map((dot) => `${Math.round(dot.x / 5)}:${Math.round(dot.y / 5)}`).join("|");
      if (dotKey !== lastDotKey.current) {
        lastDotKey.current = dotKey;
        setHandDots(dots);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode === "wheel" && pointer.source === "mouse" && pointer.present) {
      updateWheelFromPoint(pointer);
      setHandDots([{ x: pointer.x, y: pointer.y, color: "#ffd166" }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointer, mode]);

  useEffect(() => {
    if (mode === "wheel" && vision.status === "ready") playWheelChord(rootIndex, chordIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootIndex, chordIndex, mode]);

  useEffect(() => () => audioRef.current?.stopMusic(), []);

  function beginCamera(useMock: boolean) {
    getAudio();
    if (useMock) startMock();
    else startCamera();
    window.setTimeout(() => {
      if (modeRef.current === "wheel") playWheelChord();
    }, 250);
  }

  function chooseMode(next: Mode) {
    getAudio();
    setMode(next);
    lastNote.current = -1;
    if (next === "follow") {
      setMelodyIdx(0);
      melodyIdxRef.current = 0;
      setMayaState("waiting");
      voice().speak("Copy Maya. Move your hand to the glowing note.");
    } else if (next === "wheel") {
      voice().speak("Use the left wheel for a note and the right wheel for a chord.");
      window.setTimeout(() => playWheelChord(), 50);
    } else {
      audioRef.current?.stopMusic();
      setMayaState("happy");
    }
  }

  const target = mode === "follow" ? MELODY[melodyIdx] : null;

  return (
    <div ref={stageRef} className="relative h-[100dvh] w-screen overflow-hidden bg-gradient-to-b from-[#262238] to-[#504676] text-[#3a3352]">
      <KidsCameraStage vision={vision} className="!absolute inset-0 z-0 h-full w-full !rounded-none" hint={mode === "wheel" ? "Move one hand over each wheel 🎵" : undefined}>
        <div className={`pointer-events-none absolute inset-0 z-10 ${mode === "wheel" ? "bg-[#0f0d18]/65" : "bg-gradient-to-b from-[#f0eaff]/95 to-[#eef2ff]/95"}`} />

        {mode === "wheel" && (
          <main className="absolute inset-0 z-20 flex flex-col items-center px-2 pb-12 pt-16 text-white sm:px-5 sm:pb-14 sm:pt-20">
            <div className="rounded-full border border-white/20 bg-black/55 px-5 py-2 text-sm font-black shadow-xl backdrop-blur-md sm:text-lg">
              {ROOTS[rootIndex].label} · {CHORDS[chordIndex].short} ◯
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center gap-1 sm:gap-5 lg:gap-8">
              <GestureWheel wheelRef={rootWheelRef} title="ROOT NOTE" items={ROOTS.map((root) => root.label)} activeIndex={rootIndex} centerTop={ROOTS[rootIndex].label} centerBottom="ROOT" color="#ffd166" />
              <GestureWheel wheelRef={chordWheelRef} title="CHORD TYPE" items={CHORDS.map((chord) => chord.short)} activeIndex={chordIndex} centerTop={CHORDS[chordIndex].short} centerBottom="CHORD" color="#73f0c8" />
            </div>

            <div className="pointer-events-none absolute bottom-14 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-black/55 px-4 py-2 text-xs font-bold text-white/90 backdrop-blur sm:text-sm">
              Left hand = root note <span className="mx-2 text-white/40">•</span> Right hand = chord
            </div>

            {handDots.map((dot, index) => (
              <div key={index} className="pointer-events-none absolute z-40 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white text-lg shadow-[0_0_24px_rgba(255,255,255,0.8)]" style={{ left: dot.x, top: dot.y, backgroundColor: dot.color }} aria-hidden="true">☝️</div>
            ))}
          </main>
        )}
      </KidsCameraStage>

      <button onClick={() => navigate("/music")} aria-label="Back" className="absolute left-3 top-3 z-30 min-h-11 rounded-full border-2 border-white/70 bg-white/90 px-3 text-sm font-extrabold shadow-lg sm:left-5 sm:top-5 sm:px-4">← <span className="hidden sm:inline">Back</span></button>

      {!mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={() => beginCamera(false)} onUseMock={() => beginCamera(true)} />
      )}
      <Confetti trigger={burst} />

      <div className="absolute right-3 top-3 z-30 flex gap-1 rounded-full bg-white/80 p-1.5 shadow-lg backdrop-blur sm:right-5 sm:top-5 sm:gap-2">
        <button onClick={() => chooseMode("wheel")} className={`min-h-10 rounded-full px-3 text-xs font-black sm:px-4 sm:text-sm ${mode === "wheel" ? "bg-[#6d5cff] text-white" : "text-[#3a3352]"}`}>🎡 Wheels</button>
        <button onClick={() => chooseMode("free")} className={`min-h-10 rounded-full px-3 text-xs font-black sm:px-4 sm:text-sm ${mode === "free" ? "bg-[#6d5cff] text-white" : "text-[#3a3352]"}`}>🎹 Piano</button>
        <button onClick={() => chooseMode("follow")} className={`min-h-10 rounded-full px-3 text-xs font-black sm:px-4 sm:text-sm ${mode === "follow" ? "bg-[#06a981] text-white" : "text-[#3a3352]"}`}>✨ Copy Maya</button>
      </div>

      {mode !== "wheel" && (
        <>
          <div className="pointer-events-none absolute left-1/2 top-20 z-10 flex -translate-x-1/2 flex-col items-center gap-1">
            <Character state={mayaState} message={mode === "follow" ? `Play ${NOTE_NAMES[target ?? 0]}!` : "Move your hand to play!"} size={110} />
          </div>

          <div className="absolute left-1/2 top-56 z-10 -translate-x-1/2 text-center">
            <div className="text-5xl font-black text-[#6d5cff]">{active !== null ? NOTE_NAMES[active] : "🎹"}</div>
            {mode === "follow" ? <div className="mt-2"><GameProgress current={melodyIdx} total={MELODY.length} icon="🎵" /></div> : <div className="mt-1 whitespace-nowrap text-sm font-bold text-[#8a7f9e]">Move your hand left ↔ right to play!</div>}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex h-44">
            {NOTE_NAMES.map((note, index) => {
              const isTarget = mode === "follow" && index === target;
              return (
                <div key={note} className={`flex flex-1 flex-col items-center justify-end border-r border-[#eadff5] pb-3 transition-all ${isTarget ? "animate-pulse bg-[#06d6a0] text-white" : active === index ? "bg-[#6d5cff] text-white" : "bg-white/90 text-[#3a3352]"}`}>
                  <span className={`font-black ${isTarget ? "text-2xl" : "text-lg"}`}>{note}</span>
                  {isTarget && <span className="text-xs font-bold">👆 play me!</span>}
                </div>
              );
            })}
          </div>

          {mock && (
            <div className="absolute bottom-48 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {mode === "follow" ? <KidsButton variant="secondary" size="md" onClick={() => hitFollowTarget(target ?? 0)}>Play {NOTE_NAMES[target ?? 0]} (mock)</KidsButton> : <span className="rounded-full border border-[#eadff5] bg-white/80 px-3 py-1.5 text-xs text-[#8a7f9e]">🖐️ mock · move your mouse across the keys</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface GestureWheelProps {
  wheelRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  items: string[];
  activeIndex: number;
  centerTop: string;
  centerBottom: string;
  color: string;
}

function GestureWheel({ wheelRef, title, items, activeIndex, centerTop, centerBottom, color }: GestureWheelProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="sr-only">{title}</div>
      <div ref={wheelRef} className="relative aspect-square w-[min(47vw,76vh)] rounded-full border-2 border-white/30 bg-black/5 shadow-[inset_0_0_70px_rgba(255,255,255,0.04)]">
        <div className="absolute inset-[13%] rounded-full border border-white/10" />
        {items.map((item, index) => {
          const angle = (index / items.length) * Math.PI * 2 - Math.PI / 2;
          const left = 50 + Math.cos(angle) * 41;
          const top = 50 + Math.sin(angle) * 41;
          const selected = index === activeIndex;
          return (
            <div key={`${item}-${index}`} className={`absolute grid min-h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full px-2 text-center text-sm font-black transition-all sm:min-h-11 sm:min-w-11 sm:text-xl lg:text-3xl ${selected ? "scale-125 text-white" : "text-white/70"}`} style={{ left: `${left}%`, top: `${top}%`, textShadow: selected ? `0 0 18px ${color}, 0 2px 4px #000` : "0 2px 4px #000" }}>
              {item}
            </div>
          );
        })}
        <div className="absolute left-1/2 top-1/2 flex size-[34%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center">
          <span className="max-w-[90%] text-3xl font-black leading-tight text-white sm:text-5xl lg:text-7xl" style={{ textShadow: "0 3px 12px rgba(0,0,0,.8)" }}>{centerTop}</span>
          <span className="mt-1 text-[10px] font-black tracking-[0.2em] text-white/55 sm:text-base">{centerBottom}</span>
        </div>
      </div>
    </div>
  );
}
