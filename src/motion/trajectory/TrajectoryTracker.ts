// Finger-trajectory tracker: turns the index fingertip into a draggable pen.

export interface TrajectoryPoint {
  x: number; // screen px
  y: number; // screen px
  t: number; // ms timestamps
}

export interface TrajectoryTrackerArgs {
  onPoint?: (p: { x: number; y: number }) => void;
  onStrokeEnd?: (points: TrajectoryPoint[]) => void;
  minDistance?: number; // px between recorded points
  alpha?: number;       // EMA smoothing 0..1 (higher = more smoothing)
}

/**
 * Collects a stroke (a trail of smoothed points) while the finger is present.
 * When the hand disappears the stroke ends and is handed to onStrokeEnd.
 */
export class TrajectoryTracker {
  private trail: TrajectoryPoint[] = [];
  private ax: number | null = null;
  private ay: number | null = null;
  private onPoint?: (p: { x: number; y: number }) => void;
  private onStrokeEnd?: (points: TrajectoryPoint[]) => void;
  private minDistance: number;
  private alpha: number;

  constructor(args: TrajectoryTrackerArgs = {}) {
    this.onPoint = args.onPoint;
    this.onStrokeEnd = args.onStrokeEnd;
    this.minDistance = args.minDistance ?? 4;
    this.alpha = args.alpha ?? 0.55;
  }

  get isEmpty() { return this.trail.length === 0; }
  get length() { return this.trail.length; }

  update(pos: { x: number; y: number } | null, now: number) {
    if (!pos) { this.endStroke(); return; }
    const sx = this.ax === null ? pos.x : this.alpha * pos.x + (1 - this.alpha) * this.ax;
    const sy = this.ay === null ? pos.y : this.alpha * pos.y + (1 - this.alpha) * this.ay;
    this.ax = sx;
    this.ay = sy;
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(sx - last.x, sy - last.y) > this.minDistance) {
      this.trail.push({ x: sx, y: sy, t: now });
      this.onPoint?.({ x: sx, y: sy });
    }
  }

  endStroke() {
    if (this.trail.length >= 2) this.onStrokeEnd?.([...this.trail]);
    this.clear();
  }

  clear() {
    this.trail = [];
    this.ax = this.ay = null;
  }
}