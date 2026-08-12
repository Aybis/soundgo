import { describe, it, expect } from "vitest";
import { countExtendedFingers, isPinch } from "./fingers";
import type { NormalizedPoint } from "../types";

const p = (x: number, y: number): NormalizedPoint => ({ x, y, z: 0 });

// Build 21 landmarks with a given number of extended fingers (0..5).
function hand(fingers: number): NormalizedPoint[] {
  const lm: NormalizedPoint[] = Array.from({ length: 21 }, () => p(0.5, 0.5));
  lm[0] = p(0.5, 0.8); // wrist far below
  const tips = [4, 8, 12, 16, 20];
  const joints = [3, 6, 10, 14, 18];
  for (let f = 0; f < 5; f++) {
    const x = 0.5 + (f - 2) * 0.05;
    lm[joints[f]] = p(x, 0.5);
    lm[tips[f]] = p(x, f < fingers ? 0.3 : 0.6);
  }
  return lm;
}

describe("countExtendedFingers", () => {
  it("counts zero fingers", () => {
    expect(countExtendedFingers(hand(0))).toBe(0);
  });
  it("counts three fingers", () => {
    expect(countExtendedFingers(hand(3))).toBe(3);
  });
  it("counts five", () => {
    expect(countExtendedFingers(hand(5))).toBe(5);
  });
  it("returns 0 for malformed input", () => {
    expect(countExtendedFingers([])).toBe(0);
  });
});

describe("isPinch", () => {
  it("detects a pinch when index and thumb tips are close", () => {
    const lm = hand(2);
    lm[8] = p(0.48, 0.3); // index tip
    lm[4] = p(0.5, 0.3); // thumb tip close
    lm[0] = p(0.5, 0.05); // wrist far → small relative distance
    expect(isPinch(lm)).toBe(true);
  });
});