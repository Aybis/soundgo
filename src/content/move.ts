import type { PoseRuleId } from "../motion/rules/PoseRules";

// MOVE content — copy-pose list, squat targets, balance targets.

export interface PoseDef {
  id: string;
  name: string;
  emoji: string;
  rules: PoseRuleId[];
  hint: string;
}

export const POSES: PoseDef[] = [
  { id: "left-up", name: "Left hand up", emoji: "🤚", rules: ["leftHandUp"], hint: "Raise your LEFT hand!" },
  { id: "right-up", name: "Right hand up", emoji: "✋", rules: ["rightHandUp"], hint: "Raise your RIGHT hand!" },
  { id: "both-up", name: "Both hands up", emoji: "🙌", rules: ["bothHandsUp"], hint: "Raise BOTH hands!" },
  { id: "star", name: "Star pose", emoji: "⭐", rules: ["starPose"], hint: "Make a giant STAR!" },
  { id: "head", name: "Touch your head", emoji: "🤲", rules: ["touchHead"], hint: "Touch your HEAD!" },
  { id: "hips", name: "Hands on hips", emoji: "🧍", rules: ["handsOnHips"], hint: "Hands on your HIPS!" },
  { id: "bird", name: "Bird", emoji: "🐦", rules: ["armsExtended", "bothHandsUp"], hint: "Spread your WINGS!" },
  { id: "flamingo", name: "Flamingo", emoji: "🦩", rules: ["oneFootRaised"], hint: "Stand on ONE leg!" },
];

export const SQUAT_TARGETS = [5, 8, 10];
export const BALANCE_TARGETS = [5, 8, 10]; // seconds

export function poseById(id: string): PoseDef {
  return POSES.find((p) => p.id === id) ?? POSES[0];
}