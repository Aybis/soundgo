import type { VisionFrame } from "../../vision/types";
import type { CameraManager } from "../../vision/core/CameraManager";
import { HoldDetector, VelocityFilter } from "../../vision/stabilization/stabilization";

export interface PointerState {
  x: number;
  y: number;
  pinching: boolean;
  present: boolean; // a hand is actually being tracked
}

/**
 * Turns the index fingertip into a virtual pointer with smoothing + pinch hold.
 * Games/builders reuse this instead of hand-rolling selection logic.
 */
export class GesturePointer {
  private sx = new VelocityFilter(0.4);
  private sy = new VelocityFilter(0.4);
  private pinch = new HoldDetector<boolean>(140);
  private lastX = 0;
  private lastY = 0;

  update(frame: VisionFrame | null, cam: CameraManager, w: number, h: number, now: number): PointerState {
    const hand = frame?.hands?.[0];
    if (!hand) {
      return { x: this.lastX, y: this.lastY, pinching: false, present: false };
    }
    const p = cam.mapToScreen(hand.indexTip.x, hand.indexTip.y, w, h);
    this.lastX = this.sx.filter(p.x);
    this.lastY = this.sy.filter(p.y);
    const pinching = this.pinch.update(hand.pinch, now) === true;
    return { x: this.lastX, y: this.lastY, pinching, present: true };
  }
}