import { describe, it, expect } from "vitest";
import { countExtendedFingers, isPinch } from "./fingers";
import type { NormalizedPoint } from "../types";

const p = (x: number, y: number): NormalizedPoint => ({ x, y, z: 0 });

// Build 21 landmarks with a given number of extended fingers (0..5).
// Extended fingers are geometrically straight (mcp→pip→tip collinear) which is
// what the angle-based detector measures; curled fingers bend at the pip.
function hand(fingers: number, flip = false): NormalizedPoint[] {
  const lm: NormalizedPoint[] = Array.from({ length: 21 }, () => p(0.5, 0.5));
  lm[0] = p(0.5, 0.9); // wrist
  const groups: [number, number, number][] = [
    [2, 3, 4], // thumb
    [5, 6, 8], // index
    [9, 10, 12], // middle
    [13, 14, 16], // ring
    [17, 18, 20], // pinky
  ];
  groups.forEach(([mcp, pip, tip], f) => {
    const x = 0.5 + (f - 2) * 0.05;
    const extended = f < fingers;
    lm[mcp] = p(x, 0.5);
    lm[pip] = extended ? p(x, 0.42) : p(x, 0.5);
    lm[tip] = extended ? p(x, 0.3) : p(x, 0.55);
  });
  if (flip) {
    // mirror the whole hand in x — a flipped hand must still read the same
    for (let i = 0; i <= 20; i++) lm[i] = p(1 - lm[i].x, lm[i].y);
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
  it("returns the same count when the hand is flipped/mirrored", () => {
    for (let n = 0; n <= 5; n++) {
      expect(countExtendedFingers(hand(n, true))).toBe(n);
    }
  });
  it("does not count a slightly curled finger as extended", () => {
    const lm = hand(2); // index+middle extended
    // curl the ring finger a little (still somewhat up) — must NOT count
    lm[13] = p(0.4, 0.5);
    lm[14] = p(0.4, 0.44);
    lm[16] = p(0.42, 0.5);
    expect(countExtendedFingers(lm)).toBe(2);
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