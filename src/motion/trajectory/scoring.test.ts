import { describe, it, expect } from "vitest";
import { resample, normalize, traceScore } from "./scoring";

const line = (n: number) => Array.from({ length: n }, (_, i) => ({ x: i / (n - 1), y: 0.5 }));

describe("resample", () => {
  it("produces exactly n points", () => {
    expect(resample(line(10), 40).length).toBe(40);
  });
  it("handles a single point", () => {
    expect(resample([{ x: 1, y: 1 }], 5).length).toBe(5);
  });
});

describe("traceScore", () => {
  it("scores a near-perfect trace high", () => {
    const template = line(20);
    const trail = line(20).map((p) => ({ x: p.x + 0.005, y: p.y + 0.005 })); // tiny offset
    const { score, ok } = traceScore(template, trail);
    expect(ok).toBe(true);
    expect(score).toBeGreaterThan(80);
  });

  it("fails a short/scattered trace", () => {
    const template = line(20);
    const trail = [{ x: 0, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 1 }];
    const { score, ok } = traceScore(template, trail);
    expect(ok).toBe(false);
    expect(score).toBeLessThan(55);
  });

  it("is forgiving to a wobbly but on-path trace", () => {
    const template = line(20);
    const trail = Array.from({ length: 40 }, (_, i) => ({
      x: i / 39,
      y: 0.5 + Math.sin(i * 0.8) * 0.03, // wobble but on the line
    }));
    const { ok } = traceScore(template, trail);
    expect(ok).toBe(true);
  });
});

describe("normalize", () => {
  it("maps into a unit box", () => {
    const pts = normalize([{ x: 10, y: 20 }, { x: 30, y: 60 }]);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(1);
    }
  });
});