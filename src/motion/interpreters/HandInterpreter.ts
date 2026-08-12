import type { VisionFrame } from "../../vision/types";
import type { MotionEventType } from "../events";
import { MotionBus } from "../events";
import { Debouncer, HoldDetector, TemporalSmoothing } from "../../vision/stabilization/stabilization";

/**
 * Turns raw hand vision state into semantic MotionEvents.
 * Finger count is stabilized (temporal mode + hold) so a single flickering
 * frame never produces a wrong answer. Does all the noise-filtering a game
 * shouldn't have to think about.
 */
export class HandInterpreter {
  private fingerSm = new TemporalSmoothing<number>(5);
  private fingerHold = new HoldDetector<number>(350);
  private pinchGap = new Debouncer(120);
  private raisedHold = new HoldDetector<boolean>(250);
  private wave = new WaveDetector(1200, 3);

  private lastAcceptedCount: number | null = null;
  private lastPinch = false;
  private lastRaised = false;

  /** y below this (normalized) counts as "hand raised". */
  private raisedY = 0.4;

  private bus: MotionBus;

  constructor(bus: MotionBus) {
    this.bus = bus;
  }

  setRaisedThreshold(y: number) { this.raisedY = y; }

  process(frame: VisionFrame, now: number) {
    const hand = frame.hands[0];
    if (!hand) {
      if (this.lastRaised) {
        this.emit("HAND_LOWERED", now, 0.5);
        this.lastRaised = false;
      }
      return;
    }

    // --- stabilized finger count ---
    this.fingerSm.push(hand.fingerCount);
    const mode = this.fingerSm.read();
    const accepted = mode !== null ? this.fingerHold.update(mode, now) : null;
    if (accepted !== null && accepted !== this.lastAcceptedCount) {
      this.lastAcceptedCount = accepted;
      this.emit("FINGER_COUNT_CHANGED", now, hand.confidence, { count: accepted });
      if (accepted === 1) this.emit("POINTING", now, hand.confidence);
    }

    // --- pinch edges ---
    if (hand.pinch !== this.lastPinch) {
      this.lastPinch = hand.pinch;
      if (this.pinchGap.gate(now)) {
        this.emit(hand.pinch ? "PINCH_START" : "PINCH_END", now, hand.confidence);
      }
    }

    // --- hand raised / lowered ---
    const raised = hand.wrist.y < this.raisedY;
    const raisedAccepted = this.raisedHold.update(raised, now);
    if (raisedAccepted !== null && raisedAccepted !== this.lastRaised) {
      this.lastRaised = raisedAccepted;
      this.emit(raisedAccepted ? "HAND_RAISED" : "HAND_LOWERED", now, hand.confidence);
    }

    // --- wave ---
    if (this.wave.update(hand.indexTip.x, now)) {
      this.emit("WAVE", now, hand.confidence);
    }
  }

  private emit(
    type: MotionEventType,
    timestamp: number,
    confidence: number,
    metadata?: Record<string, unknown>,
  ) {
    this.bus.emit({ type, timestamp, confidence, metadata });
  }
}

/** Detects a wave: periodic reversals of horizontal hand motion within a window. */
export class WaveDetector {
  private reversals: number[] = [];
  private lastX: number | null = null;
  private lastDir: number | null = null;
  private lastEmit = 0;
  private windowMs: number;
  private minReversals: number;

  constructor(windowMs: number, minReversals: number) {
    this.windowMs = windowMs;
    this.minReversals = minReversals;
  }

  /** Returns true once when enough direction changes accumulate in the window. */
  update(x: number, now: number): boolean {
    if (this.lastX !== null) {
      const dx = x - this.lastX;
      if (Math.abs(dx) > 0.004) {
        const dir = dx > 0 ? 1 : -1;
        if (this.lastDir !== null && dir !== this.lastDir) {
          this.reversals.push(now);
        }
        this.lastDir = dir;
      }
    }
    this.lastX = x;
    this.reversals = this.reversals.filter((t) => now - t <= this.windowMs);
    if (this.reversals.length >= this.minReversals && now - this.lastEmit > 800) {
      this.lastEmit = now;
      this.reversals = [];
      this.lastDir = null;
      return true;
    }
    return false;
  }
}