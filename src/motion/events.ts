// Semantic motion events — the language between the vision layer and games.
// Games consume these; game components never touch normalized landmarks.

export type MotionEventType =
  | "HAND_RAISED"
  | "HAND_LOWERED"
  | "PINCH_START"
  | "PINCH_END"
  | "FINGER_COUNT_CHANGED"
  | "POINTING"
  | "WAVE"
  | "CLAP"
  | "HEAD_LEFT"
  | "HEAD_RIGHT"
  | "HEAD_NOD"
  | "HEAD_SHAKE"
  | "POSE_MATCHED"
  | "SQUAT_STARTED"
  | "SQUAT_BOTTOM"
  | "SQUAT_COMPLETED"
  | "BALANCE_STARTED"
  | "BALANCE_LOST"
  | "JUMP_STARTED"
  | "JUMP_COMPLETED";

export interface MotionEvent {
  type: MotionEventType;
  timestamp: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export type MotionEventCallback = (event: MotionEvent) => void;

/** Tiny typed event bus for motion events. */
export class MotionBus {
  private listeners = new Map<MotionEventType, Set<MotionEventCallback>>();

  on(type: MotionEventType, cb: MotionEventCallback): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(cb);
    return () => this.listeners.get(type)?.delete(cb);
  }

  emit(event: MotionEvent) {
    this.listeners.get(event.type)?.forEach((cb) => cb(event));
  }

  clear() { this.listeners.clear(); }
}