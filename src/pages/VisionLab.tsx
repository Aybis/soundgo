import { useEffect, useRef, useState } from "react";
import { useVision } from "../hooks/useVision";
import type { VisionFrame } from "../vision/types";
import type { MockScenario } from "../vision/providers/MockVisionProvider";
import { MockVisionProvider } from "../vision/providers/MockVisionProvider";
import { DebugOverlay } from "../components/debug/DebugOverlay";

export default function VisionLab() {
  const [mock, setMock] = useState(true);
  const [running, setRunning] = useState(false);
  const [scenario, setScenarioState] = useState<MockScenario>({});
  const [frame, setFrame] = useState<VisionFrame | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const frameRef = useRef<VisionFrame | null>(null);
  const eventsRef = useRef<string[]>([]);

  const vision = useVision({
    requirements: { hands: true, pose: true },
    mock,
    mockScenario: scenario,
    onFrame: (f) => {
      frameRef.current = f;
      if (Math.random() < 0.3) setFrame(f);
    },
    onEvent: (e) => {
      eventsRef.current = [...eventsRef.current.slice(-8), e.type];
      setEvents(eventsRef.current);
    },
  });

  useEffect(() => {
    if (running) {
      vision.stop();
      void vision.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mock]);

  const setScenario = (sc: MockScenario) => {
    setScenarioState(sc);
    // apply live if the mock provider already exists
    if (vision.provider instanceof MockVisionProvider) vision.provider.setScenario(sc);
  };

  const primary = frame?.hands?.[0];

  return (
    <div className="relative h-screen w-screen bg-[#0a0a12] overflow-hidden">
      {/* mount the single camera video element */}
      <div
        ref={(el) => {
          if (el && !el.contains(vision.videoElement)) el.appendChild(vision.videoElement);
        }}
        className="absolute inset-0 opacity-40"
      >
        <style>{`video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}`}</style>
      </div>

      <DebugOverlay stats={vision.stats} frame={frame} events={events} />

      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-wrap items-center gap-3 p-4 bg-black/60 border-t border-white/10 text-sm">
        <button
          onClick={() => { setRunning((r) => !r); if (!running) void vision.start(); else vision.stop(); }}
          className="px-4 py-2 rounded-full bg-[#6d5cff] text-white font-medium"
        >
          {running ? "Stop" : "Start"}
        </button>
        <label className="flex items-center gap-2 text-zinc-300">
          <input type="checkbox" checked={mock} onChange={(e) => setMock(e.target.checked)} className="accent-[#6d5cff]" />
          Mock provider
        </label>

        {mock && (
          <div className="flex items-center gap-2">
            {(mock as boolean) && (
              <>
                <button onClick={() => setScenario({ hands: [{ fingers: 3 }] })} className="px-3 py-1.5 rounded-full bg-white/10 text-zinc-200">3 fingers</button>
                <button onClick={() => setScenario({ hands: [{ fingers: 5 }] })} className="px-3 py-1.5 rounded-full bg-white/10 text-zinc-200">5 fingers</button>
                <button onClick={() => setScenario({ hands: [{ fingers: 1 }] })} className="px-3 py-1.5 rounded-full bg-white/10 text-zinc-200">1 finger</button>
                <button onClick={() => setScenario({ hands: [{ fingers: 3, wave: true }] })} className="px-3 py-1.5 rounded-full bg-white/10 text-zinc-200">wave</button>
                <button onClick={() => setScenario({ pose: { joints: { leftKnee: 80, rightKnee: 80 } } })} className="px-3 py-1.5 rounded-full bg-white/10 text-zinc-200">squat</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 text-center">
        <div className="text-6xl font-bold text-white">{primary?.fingerCount ?? "—"}</div>
        <div className="text-zinc-400 text-sm mt-1">fingers{primary?.pinch ? " · 📌 pinch" : ""}</div>
        {frame?.pose && (
          <div className="text-zinc-400 text-xs mt-1">
            knees {Math.round(frame.pose.joints.leftKnee ?? 0)}° / {Math.round(frame.pose.joints.rightKnee ?? 0)}°
          </div>
        )}
      </div>
    </div>
  );
}