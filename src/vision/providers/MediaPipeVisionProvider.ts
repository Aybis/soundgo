import { FilesetResolver, FaceLandmarker, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { VisionProvider } from "./VisionProvider";
import type { VisionFrame, VisionRequirements, NormalizedPoint, HandState, FaceState, PoseState } from "../types";
import { countExtendedFingers, isPinch } from "../hands/fingers";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODELS = {
  hand: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  face: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  pose: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
};

interface Vec { x: number; y: number; }

/**
 * MediaPipe-backed VisionProvider. Single adapter for hand + face + pose.
 * Only the models required by the active activity are loaded/run (see
 * VisionRequirements), so Finger Math doesn't pay for pose, etc.
 */
export class MediaPipeVisionProvider implements VisionProvider {
  private vision: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>> | null = null;
  private handLm: HandLandmarker | null = null;
  private faceLm: FaceLandmarker | null = null;
  private poseLm: PoseLandmarker | null = null;
  private req: VisionRequirements = {};
  private prevHand: (Vec | null)[] = [null, null];
  private prevHandT = 0;

  async initialize(req: VisionRequirements) {
    this.req = req;
    if (!this.vision) this.vision = await FilesetResolver.forVisionTasks(WASM_URL);
    await this.build();
  }

  setRequirements(req: VisionRequirements) {
    this.req = req;
    // rebuild is async; fire and forget — models load lazily on next frames
    void this.build();
  }

  private async build() {
    if (!this.vision) return;
    const opts = { runningMode: "VIDEO" as const, numHands: 2, numPoses: 1, numFaces: 2 };
    if (this.req.hands && !this.handLm) {
      this.handLm = await HandLandmarker.createFromOptions(this.vision, {
        baseOptions: { modelAssetPath: MODELS.hand, delegate: "GPU" },
        runningMode: "VIDEO", numHands: 2,
      });
    }
    if (this.req.face && !this.faceLm) {
      this.faceLm = await FaceLandmarker.createFromOptions(this.vision, {
        baseOptions: { modelAssetPath: MODELS.face, delegate: "GPU" },
        runningMode: "VIDEO", numFaces: 2, outputFaceBlendshapes: false,
      });
    }
    if (this.req.pose && !this.poseLm) {
      this.poseLm = await PoseLandmarker.createFromOptions(this.vision, {
        baseOptions: { modelAssetPath: MODELS.pose, delegate: "GPU" },
        runningMode: "VIDEO", numPoses: 1,
      });
    }
    void opts;
  }

  processFrame(video: HTMLVideoElement): VisionFrame {
    const t0 = performance.now();
    const t = performance.now();
    const frame: VisionFrame = {
      timestamp: t,
      hands: [],
      performance: { inferenceMs: 0 },
    };

    if (this.handLm) {
      try {
        const r = this.handLm.detectForVideo(video, t);
        frame.hands = (r.landmarks ?? []).map((lm, i) => {
          const points: NormalizedPoint[] = lm.map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0 }));
          const indexTip = points[8];
          const thumbTip = points[4];
          // velocity (normalized / s)
          const prev = this.prevHand[i];
          const dt = Math.max(1e-3, (t - this.prevHandT) / 1000);
          const velocity = prev
            ? { x: (indexTip.x - prev.x) / dt, y: (indexTip.y - prev.y) / dt }
            : { x: 0, y: 0 };
          this.prevHand[i] = { x: indexTip.x, y: indexTip.y };
          const state: HandState = {
            handedness: (r.handednesses?.[i]?.[0]?.categoryName ?? "right").toLowerCase() as "left" | "right",
            landmarks: points,
            wrist: points[0],
            indexTip,
            thumbTip,
            fingerCount: countExtendedFingers(points),
            pinch: isPinch(points),
            velocity,
            confidence: r.handednesses?.[i]?.[0]?.score ?? 0.5,
          };
          return state;
        });
      } catch { frame.hands = []; }
    }

    if (this.faceLm) {
      try {
        const r = this.faceLm.detectForVideo(video, t);
        const f = r.faceLandmarks?.[0];
        if (f) {
          const landmarks: NormalizedPoint[] = f.map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0 }));
          frame.face = this.faceFromLandmarks(landmarks);
        }
      } catch { frame.face = undefined; }
    }

    if (this.poseLm) {
      try {
        const r = this.poseLm.detectForVideo(video, t);
        const p = r.landmarks?.[0];
        if (p) {
          const landmarks: NormalizedPoint[] = p.map((pt) => ({ x: pt.x, y: pt.y, z: pt.z ?? 0 }));
          frame.pose = this.poseFromLandmarks(landmarks);
        }
      } catch { frame.pose = undefined; }
    }

    this.prevHandT = t;
    frame.performance.inferenceMs = performance.now() - t0;
    return frame;
  }

  private faceFromLandmarks(lm: NormalizedPoint[]): FaceState {
    // eyes: 33 (left outer), 263 (right outer); nose: 1; chin: 152
    const l = lm[33], r = lm[263], nose = lm[1], chin = lm[152];
    const roll = Math.atan2(l.y - r.y, l.x - r.x) * (180 / Math.PI);
    const faceW = Math.hypot(l.x - r.x, l.y - r.y) || 1e-6;
    const yaw = (nose.x - (l.x + r.x) / 2) / (faceW / 2) * 45;
    const pitch = (nose.y - (l.y + r.y) / 2) / faceW * 60;
    void chin;
    return { landmarks: lm, headYaw: yaw, headPitch: pitch, headRoll: roll };
  }

  private poseFromLandmarks(lm: NormalizedPoint[]): PoseState {
    const ang = (a: number, b: number, c: number) => {
      const p = lm[a], q = lm[b], r = lm[c];
      const v1 = { x: p.x - q.x, y: p.y - q.y };
      const v2 = { x: r.x - q.x, y: r.y - q.y };
      const dot = v1.x * v2.x + v1.y * v2.y;
      const m1 = Math.hypot(v1.x, v1.y), m2 = Math.hypot(v2.x, v2.y);
      if (!m1 || !m2) return 0;
      return (Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * 180) / Math.PI;
    };
    // MediaPipe pose indices: 11 l.shoulder 12 r.shoulder 13 l.elbow 14 r.elbow
    // 15 l.wrist 16 r.wrist 23 l.hip 24 r.hip 25 l.knee 26 r.knee 27 l.ankle 28 r.ankle
    return {
      landmarks: lm,
      joints: {
        leftElbow: ang(11, 13, 15),
        rightElbow: ang(12, 14, 16),
        leftKnee: ang(23, 25, 27),
        rightKnee: ang(24, 26, 28),
        leftShoulder: ang(13, 11, 23),
        rightShoulder: ang(14, 12, 24),
        leftHip: ang(11, 23, 25),
        rightHip: ang(12, 24, 26),
      },
      confidence: 0.5,
    };
  }

  async destroy() {
    this.handLm?.close();
    this.faceLm?.close();
    this.poseLm?.close();
    this.handLm = this.faceLm = this.poseLm = null;
    this.vision = null;
  }
}