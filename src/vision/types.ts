// Normalized vision types — the internal language between the camera and games.
// Coordinates are normalized [0..1] relative to the video frame (0,0 = top-left),
// regardless of the underlying provider (MediaPipe, mock, future native).

export interface NormalizedPoint {
  x: number;
  y: number;
  z: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface HandState {
  handedness: "left" | "right";
  landmarks: NormalizedPoint[];
  wrist: NormalizedPoint;
  indexTip: NormalizedPoint;
  thumbTip: NormalizedPoint;
  fingerCount: number; // 0..5 extended fingers
  pinch: boolean;      // index tip close to thumb tip
  velocity: Vector2;   // normalized units / second
  confidence: number;
}

export interface FaceState {
  landmarks: NormalizedPoint[];
  headYaw: number;    // degrees, left/right turn
  headPitch: number;  // degrees, up/down (nod)
  headRoll: number;   // degrees, tilt
}

export interface PoseJoints {
  leftElbow?: number;
  rightElbow?: number;
  leftKnee?: number;
  rightKnee?: number;
  leftShoulder?: number;
  rightShoulder?: number;
  // hip flexion (useful for squats)
  leftHip?: number;
  rightHip?: number;
}

export interface PoseState {
  landmarks: NormalizedPoint[];
  joints: PoseJoints;
  confidence: number;
}

export interface VisionFrame {
  timestamp: number;
  hands: HandState[];
  face?: FaceState;
  pose?: PoseState;
  performance: {
    inferenceMs: number;
  };
}

// Which models the current activity needs. Only these are loaded and run.
export interface VisionRequirements {
  hands?: boolean;
  face?: boolean;
  pose?: boolean;
}