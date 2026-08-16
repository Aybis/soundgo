import type { NormalizedPoint } from "../types";

// MediaPipe hand landmark indices
const MCP = { thumb: 2, index: 5, middle: 9, ring: 13, pinky: 17 };
const PIP = { index: 6, middle: 10, ring: 14, pinky: 18 };
const IP = { thumb: 3 }; // thumb IP joint
const TIP = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };

const dist = (a: NormalizedPoint, b: NormalizedPoint) => Math.hypot(a.x - b.x, a.y - b.y);

/** Angle (degrees) at vertex `b` between vectors `b→a` and `b→c`. */
function jointAngle(a: NormalizedPoint, b: NormalizedPoint, c: NormalizedPoint): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m1 = Math.hypot(v1.x, v1.y), m2 = Math.hypot(v2.x, v2.y);
  if (!m1 || !m2) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * 180) / Math.PI;
}

// A finger counts as "extended" when its joints are roughly straight.
// Angle-based (not image Y) so it stays correct whether the hand is flipped,
// mirrored, or pointing toward the camera — and a slightly curled finger stops
// counting, which the old `tip.y < pip.y` test failed to do.
const STRAIGHT = 145; // degrees

function palmCenter(landmarks: NormalizedPoint[]): NormalizedPoint {
  const palm = [landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
  return {
    x: palm.reduce((sum, point) => sum + point.x, 0) / palm.length,
    y: palm.reduce((sum, point) => sum + point.y, 0) / palm.length,
    z: palm.reduce((sum, point) => sum + (point.z ?? 0), 0) / palm.length,
  };
}

/**
 * Count extended fingers (0..5) using joint collinearity. Robust to hand
 * orientation, mirroring, and slight curling.
 */
export function countExtendedFingers(landmarks: NormalizedPoint[]): number {
  if (!landmarks || landmarks.length < 21) return 0;
  let count = 0;
  for (const f of ["index", "middle", "ring", "pinky"] as const) {
    if (jointAngle(landmarks[MCP[f]], landmarks[PIP[f]], landmarks[TIP[f]]) > STRAIGHT) count++;
  }

  // A folded thumb can still look perfectly straight at the IP joint. That is
  // the common reason a child's "three" is read as four. Require the thumb tip
  // to also travel clearly away from the palm. The radial test is independent
  // of handedness, camera mirroring and hand rotation.
  const center = palmCenter(landmarks);
  const handSize = dist(landmarks[0], landmarks[MCP.middle]) || 1e-6;
  const thumbIsStraight = jointAngle(
    landmarks[MCP.thumb],
    landmarks[IP.thumb],
    landmarks[TIP.thumb],
  ) > 135;
  const thumbOpenness = dist(landmarks[TIP.thumb], center) - dist(landmarks[MCP.thumb], center);
  if (thumbIsStraight && thumbOpenness / handSize > 0.12) count++;
  return count;
}

/**
 * Pinch: index tip close to thumb tip, normalized by hand size
 * (wrist → middle MCP) so it works at any distance.
 */
export function isPinch(landmarks: NormalizedPoint[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const handSize = dist(landmarks[0], landmarks[9]) || 1e-6;
  return dist(landmarks[TIP.index], landmarks[TIP.thumb]) / handSize < 0.35;
}

/** Wrist position (normalized) — useful as a proxy for "hand here". */
export function wristOf(landmarks: NormalizedPoint[]): NormalizedPoint {
  return landmarks[0] ?? { x: 0, y: 0, z: 0 };
}
