import { describe, it, expect } from "vitest";
import { PoseInterpreter } from "./PoseInterpreter";
import { MotionBus } from "../events";
import type { VisionFrame, NormalizedPoint } from "../../vision/types";

// Neutral 33-point pose: standing, ankles below knees (not one-foot-raised).
function poseFrame(knee: number, now: number): VisionFrame {
  const p = (x: number, y: number): NormalizedPoint => ({ x, y, z: 0 });
  const landmarks: NormalizedPoint[] = Array.from({ length: 33 }, () => p(0.5, 0.5));
  landmarks[25] = p(0.4, 0.7); landmarks[26] = p(0.6, 0.7); // knees
  landmarks[27] = p(0.4, 0.85); landmarks[28] = p(0.6, 0.85); // ankles (on ground)
  return {
    timestamp: now,
    hands: [],
    pose: { landmarks, joints: { leftKnee: knee, rightKnee: knee }, confidence: 0.9 },
    performance: { inferenceMs: 1 },
  };
}

describe("PoseInterpreter squat state machine", () => {
  it("counts one rep for a full squat and emits the event sequence", () => {
    const bus = new MotionBus();
    const events: string[] = [];
    const sub = (t: any) => events.push(t.type);
    const types = ["SQUAT_STARTED", "SQUAT_BOTTOM", "SQUAT_COMPLETED"] as const;
    types.forEach((t) => bus.on(t, sub));

    const interp = new PoseInterpreter(bus);
    interp.process(poseFrame(170, 0), 0); // standing
    interp.process(poseFrame(110, 100), 100); // descending
    interp.process(poseFrame(90, 200), 200); // bottom
    interp.process(poseFrame(130, 300), 300); // ascending
    interp.process(poseFrame(160, 400), 400); // back to standing

    expect(events).toEqual(["SQUAT_STARTED", "SQUAT_BOTTOM", "SQUAT_COMPLETED"]);
    expect(interp.repCount).toBe(1);
  });

  it("does not count a partial squat that bails out", () => {
    const bus = new MotionBus();
    const interp = new PoseInterpreter(bus);
    interp.process(poseFrame(170, 0), 0);
    interp.process(poseFrame(110, 100), 100); // descend
    interp.process(poseFrame(160, 200), 200); // bailed out before bottom
    expect(interp.repCount).toBe(0);
  });

  it("requires reaching bottom before completion", () => {
    const bus = new MotionBus();
    const events: string[] = [];
    bus.on("SQUAT_COMPLETED" as any, () => events.push("done"));
    const interp = new PoseInterpreter(bus);
    interp.process(poseFrame(170, 0), 0);
    interp.process(poseFrame(110, 100), 100); // descending, not bottom
    interp.process(poseFrame(160, 200), 200); // back standing without bottom
    expect(events).toEqual([]);
    expect(interp.repCount).toBe(0);
  });
});