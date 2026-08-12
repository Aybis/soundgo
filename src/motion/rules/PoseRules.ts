import type { NormalizedPoint, PoseJoints } from "../../vision/types";
import { jointAngle, dist } from "./angles";

// MediaPipe pose landmark indices
const L_SHO = 11, R_SHO = 12, L_ELB = 13, R_ELB = 14, L_WRI = 15, R_WRI = 16;
const L_HIP = 23, R_HIP = 24, L_KNE = 25, R_KNE = 26, L_ANK = 27, R_ANK = 28;
const NOSE = 0;

export type PoseRuleId =
  | "bothHandsUp"
  | "leftHandUp"
  | "rightHandUp"
  | "armsExtended"
  | "handsNearHead"
  | "handsOnHips"
  | "starPose"
  | "touchHead"
  | "oneFootRaised"
  | "leftKneeBelowThreshold"
  | "rightKneeBelowThreshold";

export interface PoseRuleContext {
  landmarks: NormalizedPoint[];
  joints: PoseJoints;
}

// "above" = smaller normalized y (0 = top of frame)

export const POSE_RULES: Record<PoseRuleId, (ctx: PoseRuleContext) => boolean> = {
  leftHandUp: ({ landmarks }) => landmarks[L_WRI]?.y < landmarks[L_SHO]?.y - 0.05,
  rightHandUp: ({ landmarks }) => landmarks[R_WRI]?.y < landmarks[R_SHO]?.y - 0.05,
  bothHandsUp: ({ landmarks }) =>
    landmarks[L_WRI]?.y < landmarks[L_SHO]?.y - 0.05 && landmarks[R_WRI]?.y < landmarks[R_SHO]?.y - 0.05,
  armsExtended: ({ landmarks }) =>
    jointAngle(landmarks[L_SHO], landmarks[L_ELB], landmarks[L_WRI]) > 150 &&
    jointAngle(landmarks[R_SHO], landmarks[R_ELB], landmarks[R_WRI]) > 150,
  handsNearHead: ({ landmarks }) =>
    dist(landmarks[L_WRI], landmarks[NOSE]) < 0.18 && dist(landmarks[R_WRI], landmarks[NOSE]) < 0.18,
  handsOnHips: ({ landmarks }) =>
    dist(landmarks[L_WRI], landmarks[L_HIP]) < 0.18 && dist(landmarks[R_WRI], landmarks[R_HIP]) < 0.18,
  starPose: ({ landmarks }) =>
    landmarks[L_WRI].y < landmarks[L_SHO].y && landmarks[R_WRI].y < landmarks[R_SHO].y &&
    Math.abs(landmarks[L_WRI].x - landmarks[R_WRI].x) > 0.5,
  touchHead: ({ landmarks }) =>
    dist(landmarks[L_WRI], landmarks[NOSE]) < 0.12 || dist(landmarks[R_WRI], landmarks[NOSE]) < 0.12,
  oneFootRaised: ({ landmarks }) =>
    landmarks[L_ANK].y < landmarks[L_KNE].y + 0.05 || landmarks[R_ANK].y < landmarks[R_KNE].y + 0.05,
  leftKneeBelowThreshold: ({ joints }) => (joints.leftKnee ?? 180) < 120,
  rightKneeBelowThreshold: ({ joints }) => (joints.rightKnee ?? 180) < 120,
};

/** Evaluate a pose definition; returns the list of rules that currently match. */
export function evaluatePoseRules(
  landmarks: NormalizedPoint[],
  joints: PoseJoints,
  ruleIds: PoseRuleId[],
): PoseRuleId[] {
  if (!landmarks || landmarks.length < 33) return [];
  const ctx: PoseRuleContext = { landmarks, joints };
  return ruleIds.filter((id) => POSE_RULES[id]?.(ctx) ?? false);
}

/** All rules of a pose matched? */
export function poseMatched(landmarks: NormalizedPoint[], joints: PoseJoints, ruleIds: PoseRuleId[]): boolean {
  return evaluatePoseRules(landmarks, joints, ruleIds).length === ruleIds.length;
}