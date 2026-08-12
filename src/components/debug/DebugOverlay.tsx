import type { VisionStats } from "../../vision/core/VisionEngine";
import type { VisionFrame } from "../../vision/types";

interface Props {
  stats: VisionStats;
  frame?: VisionFrame | null;
  events: string[];
}

/** Developer-only overlay. Never shown to children. */
export function DebugOverlay({ stats, frame, events }: Props) {
  const hands = frame?.hands ?? [];
  const pose = frame?.pose;
  return (
    <div className="absolute top-20 right-4 z-50 w-56 rounded-lg bg-black/70 border border-white/10 backdrop-blur p-3 font-mono text-[10px] leading-relaxed text-zinc-200 pointer-events-none">
      <div className="text-emerald-400 font-semibold mb-1">DEV OVERLAY</div>
      <Row k="Cam FPS" v={String(stats.cameraFps)} />
      <Row k="Infer FPS" v={String(stats.inferenceFps)} />
      <Row k="Infer ms" v={String(stats.inferenceMs.toFixed(1))} />
      <Row k="Hands" v={String(hands.length)} />
      {hands.map((h, i) => (
        <Row
          key={i}
          k={`${h.handedness} fingers`}
          v={`${h.fingerCount}${h.pinch ? " · pinch" : ""}`}
        />
      ))}
      <Row k="Pose" v={pose ? "detected" : "—"} />
      {pose && (
        <>
          <Row k="L knee" v={Math.round(pose.joints.leftKnee ?? 0).toString()} />
          <Row k="R knee" v={Math.round(pose.joints.rightKnee ?? 0).toString()} />
        </>
      )}
      <div className="text-zinc-500 mt-1">events:</div>
      <div className="max-h-28 overflow-hidden text-amber-300">{events.slice(-5).join("\n")}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-400">{k}</span>
      <span className="text-white">{v}</span>
    </div>
  );
}