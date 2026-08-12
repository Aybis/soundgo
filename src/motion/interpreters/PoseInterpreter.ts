import type { VisionFrame } from "../../vision/types";
import type { MotionEventType } from "../events";
import { MotionBus } from "../events";
import { POSE_RULES } from "../rules/PoseRules";

type SquatState = "STANDING" | "DESCENDING" | "BOTTOM" | "ASCENDING";

/**
 * Turns pose vision into semantic events. Owns the squat state machine
 * (won't count repeated frames as reps) and a simple balance tracker.
 */
export class PoseInterpreter {
  private bus: MotionBus;
  private squatState: SquatState = "STANDING";
  private reps = 0;
  private balanceStart: number | null = null;

  constructor(bus: MotionBus) {
    this.bus = bus;
  }

  get repCount() { return this.reps; }

  process(frame: VisionFrame, now: number) {
    const pose = frame.pose;
    if (!pose || !pose.landmarks || pose.landmarks.length < 33) return;
    const { landmarks, joints } = pose;

    // squat: use the smaller knee angle as the driver
    const knee = Math.min(joints.leftKnee ?? 180, joints.rightKnee ?? 180);
    this.updateSquat(knee, now);

    // balance: one foot raised
    const raised = POSE_RULES.oneFootRaised({ landmarks, joints });
    this.updateBalance(raised, now);
  }

  private updateSquat(knee: number, now: number) {
    switch (this.squatState) {
      case "STANDING":
        if (knee < 120) { this.squatState = "DESCENDING"; this.emit("SQUAT_STARTED", now); }
        break;
      case "DESCENDING":
        if (knee < 95) { this.squatState = "BOTTOM"; this.emit("SQUAT_BOTTOM", now); }
        else if (knee >= 120) { this.squatState = "STANDING"; } // bailed out
        break;
      case "BOTTOM":
        if (knee >= 120) { this.squatState = "ASCENDING"; }
        break;
      case "ASCENDING":
        if (knee >= 150) {
          this.squatState = "STANDING";
          this.reps++;
          this.emit("SQUAT_COMPLETED", now, { reps: this.reps });
        } else if (knee < 95) { this.squatState = "BOTTOM"; }
        break;
    }
  }

  private updateBalance(raised: boolean, now: number) {
    if (raised && this.balanceStart === null) {
      this.balanceStart = now;
      this.emit("BALANCE_STARTED", now);
    } else if (!raised && this.balanceStart !== null) {
      const dur = now - this.balanceStart;
      this.balanceStart = null;
      if (dur > 500) this.emit("BALANCE_LOST", now, { durationMs: dur });
    }
  }

  private emit(type: MotionEventType, timestamp: number, metadata?: Record<string, unknown>) {
    this.bus.emit({ type, timestamp, confidence: 0.9, metadata });
  }
}