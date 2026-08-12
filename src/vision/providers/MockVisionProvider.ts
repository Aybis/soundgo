import type { VisionProvider } from "./VisionProvider";
import type { VisionFrame, VisionRequirements, HandState, NormalizedPoint } from "../types";

/**
 * Simulated VisionProvider — no camera needed. Lets devs and automated tests
 * drive finger count, hand position, pinch, pose, and head movement without a
 * physical webcam. Game logic that consumes VisionFrames works identically.
 */
export class MockVisionProvider implements VisionProvider {
  private req: VisionRequirements = {};
  private scenario: MockScenario = {};
  private t = 0;

  initialize(req: VisionRequirements) { this.req = req; return Promise.resolve(); }
  setRequirements(req: VisionRequirements) { this.req = req; }
  destroy() { return Promise.resolve(); }

  /** Programmatically drive the simulation. */
  setScenario(s: MockScenario) { this.scenario = s; }

  processFrame(_video: HTMLVideoElement): VisionFrame {
    this.t += 1000 / 30; // ~30fps sim
    const ts = this.t;
    const frame: VisionFrame = { timestamp: ts, hands: [], performance: { inferenceMs: 1 } };

    if (this.req.hands) {
      const hands = this.scenario.hands ?? [];
      frame.hands = hands.map((h, i) => {
        const fingerCount = typeof h.fingers === "number" ? h.fingers : 3;
        const baseX = h.x ?? 0.3 + i * 0.4;
        const baseY = h.y ?? 0.5;
        const wave = h.wave ? Math.sin(ts / 120) * 0.15 : 0;
        const indexTip: NormalizedPoint = { x: baseX + wave, y: baseY - 0.1, z: 0 };
        const hand: HandState = {
          handedness: i === 0 ? "left" : "right",
          landmarks: makeHand(indexTip.x, indexTip.y, fingerCount),
          wrist: { x: indexTip.x, y: indexTip.y + 0.35, z: 0 },
          indexTip,
          thumbTip: { x: indexTip.x - 0.02, y: indexTip.y + 0.02, z: 0 },
          fingerCount,
          pinch: h.pinch ?? false,
          velocity: { x: wave, y: 0 },
          confidence: 0.97,
        };
        return hand;
      });
    }

    if (this.req.pose && this.scenario.pose) {
      // 33 mediapipe pose landmarks at neutral positions
      const p = (x: number, y: number): NormalizedPoint => ({ x, y, z: 0 });
      const landmarks: NormalizedPoint[] = Array.from({ length: 33 }, () => p(0.5, 0.5));
      landmarks[11] = p(0.4, 0.4); landmarks[12] = p(0.6, 0.4); // shoulders
      landmarks[23] = p(0.4, 0.6); landmarks[24] = p(0.6, 0.6); // hips
      landmarks[25] = p(0.4, 0.7); landmarks[26] = p(0.6, 0.7); // knees
      landmarks[27] = p(0.4, 0.85); landmarks[28] = p(0.6, 0.85); // ankles
      frame.pose = { landmarks, joints: this.scenario.pose.joints ?? {}, confidence: 0.95 };
    }

    return frame;
  }
}

export interface MockHand {
  x?: number;
  y?: number;
  fingers?: number;
  pinch?: boolean;
  wave?: boolean;
}

export interface MockScenario {
  hands?: MockHand[];
  pose?: { joints?: { leftKnee?: number; rightKnee?: number; leftHip?: number; rightHip?: number } };
}

function makeHand(cx: number, cy: number, fingers: number): NormalizedPoint[] {
  const base = (x: number, y: number): NormalizedPoint => ({ x, y, z: 0 });
  const lm: NormalizedPoint[] = Array.from({ length: 21 }, () => base(cx, cy));
  lm[0] = base(cx, cy + 0.35); // wrist
  const fingerTips = [4, 8, 12, 16, 20];
  const joints = [3, 6, 10, 14, 18]; // thumb IP + finger PIPs
  for (let f = 0; f < 5; f++) {
    const x = cx + (f - 2) * 0.05;
    lm[joints[f]] = base(x, cy + 0.05); // knuckle
    const extended = f < fingers;
    lm[fingerTips[f]] = base(x, extended ? cy - 0.12 : cy + 0.08);
  }
  return lm;
}