import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../hooks/useCameraInput";
import { Character } from "../character/Character";
import { KidsButton } from "../components/ui/KidsButton";
import { KidsCameraStage } from "../components/camera/KidsCameraStage";
import { CameraStartOverlay } from "../components/camera/CameraStartOverlay";
import { Confetti } from "../components/feedback/Confetti";
import { voice } from "../engine/voice/VoiceService";
import { HoldDetector, TemporalSmoothing } from "../vision/stabilization/stabilization";

type Step = "intro" | "camera" | "wave" | "fingers" | "done";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [mayaState, setMayaState] = useState<Parameters<typeof Character>[0]["state"]>("happy");
  const [bubble, setBubble] = useState("Hi! I'm MAYA! 👋");
  const [burst, setBurst] = useState(0);
  const [seenCount, setSeenCount] = useState<number | null>(null);

  const stepRef = useRef<Step>("intro");
  const sm = useRef(new TemporalSmoothing<number>(5));
  const heldCount = useRef(new HoldDetector<number>(650));
  const doneRef = useRef(false);

  useEffect(() => { stepRef.current = step; }, [step]);

  const { vision, mock, startCamera, startMock } = useCameraInput({
    requirements: { hands: true },
    onFrame: (f) => {
      if (stepRef.current !== "fingers" || doneRef.current) return;
      if (!f.hands.length) {
        sm.current.clear();
        heldCount.current.reset();
        setSeenCount((count) => count === null ? count : null);
        return;
      }
      const total = f.hands.reduce((s, h) => s + (h.fingerCount ?? 0), 0);
      sm.current.push(total);
      const mode = sm.current.read();
      setSeenCount((count) => count === mode ? count : mode);
      const stable = mode === null ? null : heldCount.current.update(mode, f.timestamp);
      if (stable === 3) {
        doneRef.current = true;
        setMayaState("celebrating");
        setBubble("Perfect! Let's play! 🎉");
        setBurst((b) => b + 1);
        voice().speak("Perfect! Let's play!");
        setTimeout(() => navigate("/learn/finger-math"), 1400);
      }
    },
  });

  // listen for a real wave during the wave step
  const waveRef = useRef(false);
  useEffect(() => {
    if (step !== "wave" || waveRef.current) return;
    const off = vision.bus.on("WAVE", () => {
      if (waveRef.current || stepRef.current !== "wave") return;
      waveRef.current = true;
      setMayaState("celebrating");
      setBubble("Yay! I can see you! 🎉");
      setBurst((b) => b + 1);
      voice().speak("Yay! I can see you!");
      setTimeout(() => {
        sm.current.clear();
        heldCount.current.reset();
        setSeenCount(null);
        setStep("fingers");
        stepRef.current = "fingers";
        setMayaState("waiting");
        setBubble("Show me THREE fingers!");
        voice().speak("Show me three fingers!");
      }, 1600);
    });
    return () => off();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, vision]);

  const say = (text: string, state: Parameters<typeof Character>[0]["state"] = "happy") => {
    setBubble(text);
    setMayaState(state);
    voice().speak(text);
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col items-center justify-start gap-5 overflow-y-auto bg-gradient-to-b from-[#fff6ec] to-[#eef2ff] px-5 py-20 sm:justify-center">
      {/* floating shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 h-6 w-6 rounded-full bg-[#ffd166] opacity-40 anim-floaty" />
        <div className="absolute bottom-16 right-12 h-5 w-5 rounded-full bg-[#06d6a0] opacity-40 anim-floaty" style={{ animationDelay: "0.6s" }} />
        <div className="absolute top-1/2 right-8 h-4 w-4 rounded-full bg-[#ff9db8] opacity-50 anim-floaty" style={{ animationDelay: "1s" }} />
      </div>

      <Confetti trigger={burst} />

      {(step === "wave" || step === "fingers") && !mock && vision.status !== "ready" && (
        <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
      )}

      {/* intro */}
      {step === "intro" && (
        <>
          <Character state={mayaState} message="Hi! I'm MAYA!" size={180} />
          <div className="text-center">
            <h1 className="text-3xl font-black text-[#3a3352]">Want to play?</h1>
            <p className="mt-1 text-sm font-semibold text-[#8a7f9e]">I'll teach you with your body!</p>
          </div>
          <KidsButton onClick={() => { say("I use the camera so I can see your moves!", "speaking"); setStep("camera"); }}>LET'S PLAY</KidsButton>
        </>
      )}

      {/* camera intro */}
      {step === "camera" && (
        <>
          <Character state="speaking" message={bubble} size={160} />
          <p className="text-xs text-[#8a7f9e] max-w-xs text-center px-4">
            Your camera helps me see your moves. We don't save your video. 💜
          </p>
          <KidsButton
            onClick={() => {
              startCamera();
              setStep("wave");
              say("Wave hello so I can see you!", "wave");
            }}
          >
            TURN ON CAMERA
          </KidsButton>
          <button onClick={() => { startMock(); setStep("wave"); say("Wave hello so I can see you!", "wave"); }} className="text-xs underline text-[#8a7f9e]">Use mock (no camera) for testing</button>
        </>
      )}

      {/* wave step */}
      {step === "wave" && (
        <section className="relative z-10 grid w-full max-w-4xl items-center gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-3 rounded-[2rem] border-4 border-white bg-white/70 p-5 text-center shadow-lg">
            <Character state="wave" size={112} />
            <h1 className="text-3xl font-black text-[#3a3352]">Wave hello! 👋</h1>
            <p className="font-bold text-[#746a89]">{bubble}</p>
          </div>
          <KidsCameraStage vision={vision} hint="Move your hand side to side 👋" className="aspect-[4/3] w-full min-h-[280px] sm:min-h-[360px]">
            {mock && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <span className="text-zinc-300 text-sm">🖐️ mock mode</span>
                <KidsButton variant="secondary" size="md" onClick={() => vision.bus.emit({ type: "WAVE", timestamp: performance.now(), confidence: 1 })}>
                  Simulate wave
                </KidsButton>
              </div>
            )}
          </KidsCameraStage>
        </section>
      )}

      {/* fingers step */}
      {step === "fingers" && (
        <section className="relative z-10 grid w-full max-w-4xl items-center gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-[2rem] border-4 border-white bg-white/75 p-5 text-center shadow-lg">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#8a78e8]">Show me</div>
            <div className="text-8xl font-black leading-none text-[#6d5cff] drop-shadow-[0_5px_0_#d9d2ff]">3</div>
            <div className="text-2xl font-black text-[#51496b]">fingers!</div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Character state="waiting" size={74} />
              <p className="max-w-32 text-left text-sm font-bold leading-tight text-[#746a89]">Hold them still for Maya.</p>
            </div>
          </div>
          <KidsCameraStage vision={vision} hint="Keep your whole palm in the frame ✋" className="aspect-[4/3] w-full min-h-[280px] sm:min-h-[360px]">
            {!mock && (
              <div className="absolute left-3 top-3 z-10 rounded-2xl bg-white/90 px-4 py-2 shadow-lg backdrop-blur" aria-live="polite">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#817795]">Maya sees</div>
                <div className="text-2xl font-black text-[#6d5cff]">{seenCount === null ? "Finding hand…" : `${seenCount} finger${seenCount === 1 ? "" : "s"}`}</div>
              </div>
            )}
            {mock && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto bg-[#332d46]/75 py-4">
                <span className="text-zinc-300 text-sm">🖐️ mock mode</span>
                {[0,1,2,3].map((n) => (
                  <KidsButton key={n} variant="secondary" size="md" onClick={() => {
                    if (vision.provider && "setScenario" in vision.provider) {
                      (vision.provider as any).setScenario({ hands: [{ fingers: n }] });
                    }
                  }}>
                    {n} finger{n === 1 ? "" : "s"}
                  </KidsButton>
                ))}
              </div>
            )}
          </KidsCameraStage>
        </section>
      )}

      {/* done — quick thanks before navigating */}
      {step === "done" && (
        <Character state="celebrating" message="Ready to play!" size={160} />
      )}

      <button onClick={() => navigate("/")} className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#eadff5] text-[#3a3352] text-sm font-medium hover:bg-white">
        ← Back
      </button>
    </div>
  );
}
