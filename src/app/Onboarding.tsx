import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCameraInput } from "../hooks/useCameraInput";
import { Character } from "../character/Character";
import { KidsButton } from "../components/ui/KidsButton";
import { KidsCameraStage } from "../components/camera/KidsCameraStage";
import { CameraStartOverlay } from "../components/camera/CameraStartOverlay";
import { Confetti } from "../components/feedback/Confetti";
import { voice } from "../engine/voice/VoiceService";
import { TemporalSmoothing } from "../vision/stabilization/stabilization";

type Step = "intro" | "camera" | "wave" | "fingers" | "done";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [mayaState, setMayaState] = useState<Parameters<typeof Character>[0]["state"]>("happy");
  const [bubble, setBubble] = useState("Hi! I'm MAYA! 👋");
  const [burst, setBurst] = useState(0);

  const stepRef = useRef<Step>("intro");
  const sm = useRef(new TemporalSmoothing<number>(5));
  const doneRef = useRef(false);

  useEffect(() => { stepRef.current = step; }, [step]);

  const { vision, mock, startCamera, startMock } = useCameraInput({
    requirements: { hands: true },
    onFrame: (f) => {
      if (stepRef.current !== "fingers" || doneRef.current) return;
      if (!f.hands.length) return;
      const total = f.hands.reduce((s, h) => s + (h.fingerCount ?? 0), 0);
      sm.current.push(total);
      const mode = sm.current.read();
      if (mode === 3) {
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
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#eef2ff] flex flex-col items-center justify-center gap-5 px-5">
      {/* floating shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 h-6 w-6 rounded-full bg-[#ffd166] opacity-40 anim-floaty" />
        <div className="absolute bottom-16 right-12 h-5 w-5 rounded-full bg-[#06d6a0] opacity-40 anim-floaty" style={{ animationDelay: "0.6s" }} />
        <div className="absolute top-1/2 right-8 h-4 w-4 rounded-full bg-[#ff9db8] opacity-50 anim-floaty" style={{ animationDelay: "1s" }} />
      </div>

      <Confetti trigger={burst} />

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
          {mock && (
            <button onClick={startMock} className="text-xs underline text-[#8a7f9e]">Use mock (no camera) for testing</button>
          )}
        </>
      )}

      {/* wave step */}
      {step === "wave" && (
        <>
          <Character state="wave" message={bubble} size={150} />
          <KidsCameraStage vision={vision} hint="Wave hello! 👋" className="w-[min(90vw,420px)] h-56">
            {!mock && vision.status !== "ready" && (
              <CameraStartOverlay status={vision.status} error={vision.error} mock={mock} onStart={startCamera} onUseMock={startMock} />
            )}
            {mock && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <span className="text-zinc-300 text-sm">🖐️ mock mode</span>
                <KidsButton variant="secondary" size="md" onClick={() => vision.bus.emit({ type: "WAVE", timestamp: performance.now(), confidence: 1 })}>
                  Simulate wave
                </KidsButton>
              </div>
            )}
          </KidsCameraStage>
        </>
      )}

      {/* fingers step */}
      {step === "fingers" && (
        <>
          <Character state="waiting" message={bubble} size={150} />
          <KidsCameraStage vision={vision} hint="Show me 3 fingers ✌️" className="w-[min(90vw,420px)] h-56">
            {mock && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <span className="text-zinc-300 text-sm">🖐️ mock mode</span>
                {[0,1,2,3].map((n) => (
                  <KidsButton key={n} variant="secondary" size="md" onClick={() => {
                    if (vision.provider && "setScenario" in vision.provider) {
                      (vision.provider as any).setScenario({ hands: [{ fingers: n }] });
                    }
                  }}>
                    {n} fingers
                  </KidsButton>
                ))}
              </div>
            )}
          </KidsCameraStage>
        </>
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