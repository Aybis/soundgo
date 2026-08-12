import { describe, it, expect } from "vitest";
import { Debouncer, HoldDetector, TemporalSmoothing, VelocityFilter } from "./stabilization";

describe("TemporalSmoothing", () => {
  it("returns the most frequent value in the window", () => {
    const s = new TemporalSmoothing(5);
    [3, 3, 3, 4].forEach((v) => s.push(v));
    expect(s.read()).toBe(3);
  });

  it("filters a single-frame flicker", () => {
    const s = new TemporalSmoothing(5);
    // 3,4,3,4,4,3 → most common is 3 (3×) vs 4 (3×) tie; pushes keep oldest out
    [3, 4, 3, 4, 3].forEach((v) => s.push(v));
    expect(s.read()).toBe(3);
  });

  it("returns null when empty", () => {
    expect(new TemporalSmoothing(3).read()).toBeNull();
  });
});

describe("HoldDetector", () => {
  it("only accepts a value after it is held for holdMs", () => {
    const h = new HoldDetector<number>(200);
    expect(h.update(3, 0)).toBeNull();
    expect(h.update(3, 100)).toBeNull();
    expect(h.update(3, 250)).toBe(3);
  });

  it("resets when the candidate changes", () => {
    const h = new HoldDetector<number>(200);
    h.update(3, 0);
    h.update(3, 150);
    h.update(4, 160); // changed candidate
    expect(h.update(4, 200)).toBeNull(); // not held long enough
    expect(h.update(4, 400)).toBe(4);
  });

  it("returns null for undefined", () => {
    const h = new HoldDetector<number>(100);
    expect(h.update(undefined, 0)).toBeNull();
  });
});

describe("Debouncer", () => {
  it("gates rapid events", () => {
    const d = new Debouncer(150);
    expect(d.gate(0)).toBe(true);
    expect(d.gate(50)).toBe(false);
    expect(d.gate(200)).toBe(true);
  });
});

describe("VelocityFilter", () => {
  it("smooths a signal", () => {
    const f = new VelocityFilter(0.5);
    expect(f.filter(10)).toBe(10); // first value passes through
    expect(f.filter(0)).toBe(5);
    expect(f.filter(0)).toBe(2.5);
  });
});