// Stabilization utilities for noisy CV signals. Pure logic — unit-testable.

/** Reports the most frequent value observed over a sliding window (mode). */
export class TemporalSmoothing<T extends string | number> {
  private window: T[] = [];
  private size: number;

  constructor(size: number) {
    this.size = size;
  }

  push(value: T): void {
    this.window.push(value);
    if (this.window.length > this.size) this.window.shift();
  }

  /** Most common value in the window, or null when empty. */
  read(): T | null {
    if (!this.window.length) return null;
    const counts = new Map<T, number>();
    let best = this.window[0], bestN = 0;
    for (const v of this.window) {
      const n = (counts.get(v) ?? 0) + 1;
      counts.set(v, n);
      if (n > bestN) { bestN = n; best = v; }
    }
    return best;
  }

  clear() { this.window = []; }
}

/** Only reports a value after it has been observed continuously for holdMs. */
export class HoldDetector<T> {
  private candidate: T | undefined;
  private candidateSince = 0;
  private emitted: T | undefined;
  private holdMs: number;

  constructor(holdMs: number) {
    this.holdMs = holdMs;
  }

  /** Feed a sample with a timestamp (ms). Returns the accepted value or null. */
  update(value: T | undefined, now: number): T | null {
    if (value !== this.candidate) {
      this.candidate = value;
      this.candidateSince = now;
    }
    if (value === undefined || value === null) {
      this.emitted = undefined;
      return null;
    }
    if (now - this.candidateSince >= this.holdMs) {
      this.emitted = value;
      return value;
    }
    return this.emitted === value ? value : null;
  }

  reset() {
    this.candidate = undefined;
    this.emitted = undefined;
    this.candidateSince = 0;
  }
}

/** Suppresses rapid toggling: only emits a state change after quietMs passes. */
export class Debouncer {
  private lastEmit = -Infinity;
  private quietMs: number;

  constructor(quietMs: number) {
    this.quietMs = quietMs;
  }

  /** Returns true if enough time has passed since the last accepted event. */
  gate(now: number): boolean {
    if (now - this.lastEmit >= this.quietMs) {
      this.lastEmit = now;
      return true;
    }
    return false;
  }
}

/** Simple EMA low-pass for smooth continuous values (e.g. hand position). */
export class VelocityFilter {
  private value: number | null = null;
  private alpha: number;

  constructor(alpha: number) {
    this.alpha = alpha;
  }

  filter(v: number): number {
    this.value = this.value === null ? v : this.alpha * v + (1 - this.alpha) * this.value;
    return this.value;
  }

  reset() { this.value = null; }
}