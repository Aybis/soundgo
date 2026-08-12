import type { NormalizedPoint } from "../types";

// MediaPipe hand landmark indices
const TIP = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
const PIP = { index: 6, middle: 10, ring: 14, pinky: 18 };

const dist = (a: NormalizedPoint, b: NormalizedPoint) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Count extended fingers (0..5). Handedness-agnostic so it stays correct
 * whether or not the camera preview is mirrored.
 */
export function countExtendedFingers(landmarks: NormalizedPoint[]): number {
  if (!landmarks || landmarks.length < 21) return 0;
  let count = 0;

  // 4 fingers: tip must be above (smaller y) its pip
  for (const f of ["index", "middle", "ring", "pinky"] as const) {
    if (landmarks[TIP[f]].y < landmarks[PIP[f]].y) count++;
  }

  // thumb (handedness-agnostic): an extended thumb's tip is farther from the
  // wrist than its own IP joint; a tucked thumb curls back toward the palm.
  const thumbExtended =
    dist(landmarks[TIP.thumb], landmarks[0]) > dist(landmarks[3], landmarks[0]) * 1.05;
  if (thumbExtended) count++;

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