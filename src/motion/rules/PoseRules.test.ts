import { describe, it, expect } from "vitest";
import { jointAngle, dist } from "./angles";
import { evaluatePoseRules, poseMatched } from "./PoseRules";
import type { NormalizedPoint, PoseJoints } from "../../vision/types";

const p = (x: number, y: number): NormalizedPoint => ({ x, y, z: 0 });

describe("jointAngle", () => {
  it("computes a right angle", () => {
    expect(jointAngle(p(0, 1), p(0, 0), p(1, 0))).toBeCloseTo(90, 1);
  });
  it("computes a straight angle", () => {
    expect(jointAngle(p(0, 1), p(0, 0), p(0, -1))).toBeCloseTo(180, 1);
  });
  it("avoids NaN on degenerate input", () => {
    expect(Number.isFinite(jointAngle(p(0, 0), p(0, 0), p(0, 0)))).toBe(true);
  });
});

describe("dist", () => {
  it("computes euclidean distance", () => {
    expect(dist(p(0, 0), p(3, 4))).toBe(5);
  });
});

// Build a 33-point default pose: shoulders mid, wrists/hands below shoulders.
function makePose(overrides: Partial<Record<number, NormalizedPoint>> = {}): NormalizedPoint[] {
  const lm: NormalizedPoint[] = Array.from({ length: 33 }, () => p(0.5, 0.5));
  // shoulders at y=0.4, hips at y=0.6, knees 0.7, ankles 0.85
  lm[11] = p(0.4, 0.4); lm[12] = p(0.6, 0.4); // shoulders
  lm[23] = p(0.4, 0.6); lm[24] = p(0.6, 0.6); // hips
  lm[25] = p(0.4, 0.7); lm[26] = p(0.6, 0.7); // knees
  lm[27] = p(0.4, 0.85); lm[28] = p(0.6, 0.85); // ankles
  lm[15] = p(0.4, 0.55); lm[16] = p(0.6, 0.55); // wrists (below shoulders)
  lm[13] = p(0.4, 0.48); lm[14] = p(0.6, 0.48); // elbows
  lm[0] = p(0.5, 0.35); // nose
  for (const [k, v] of Object.entries(overrides)) {
    if (v) lm[Number(k)] = v;
  }
  return lm;
}

const joints: PoseJoints = {};

describe("evaluatePoseRules / poseMatched", () => {
  it("detects bothHandsUp when wrists are above shoulders", () => {
    const lm = makePose({ 15: p(0.4, 0.2), 16: p(0.6, 0.2) });
    expect(poseMatched(lm, joints, ["bothHandsUp"])).toBe(true);
  });

  it("does not match bothHandsUp when hands are down", () => {
    const lm = makePose();
    expect(poseMatched(lm, joints, ["bothHandsUp"])).toBe(false);
  });

  it("detects leftHandUp with only the left hand raised", () => {
    const lm = makePose({ 15: p(0.4, 0.2) });
    expect(evaluatePoseRules(lm, joints, ["leftHandUp", "rightHandUp"])).toEqual(["leftHandUp"]);
  });

  it("returns empty for a pose with too few landmarks", () => {
    expect(evaluatePoseRules([], joints, ["bothHandsUp"])).toEqual([]);
  });
});