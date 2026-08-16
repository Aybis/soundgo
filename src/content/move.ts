import type { PoseRuleId } from "../motion/rules/PoseRules";

// MOVE content — copy-pose list, squat targets, balance targets.

export interface PoseDef {
  id: string;
  name: string;
  emoji: string;
  rules: PoseRuleId[];
  hint: string;
  steps: string[];
}

export const POSES: PoseDef[] = [
  { id: "left-up", name: "Left hand up", emoji: "🤚", rules: ["leftHandUp"], hint: "Raise your LEFT hand!", steps: ["Face the camera", "Keep both feet still", "Lift your LEFT hand high", "Hold the pose"] },
  { id: "right-up", name: "Right hand up", emoji: "✋", rules: ["rightHandUp"], hint: "Raise your RIGHT hand!", steps: ["Face the camera", "Keep both feet still", "Lift your RIGHT hand high", "Hold the pose"] },
  { id: "both-up", name: "Both hands up", emoji: "🙌", rules: ["bothHandsUp"], hint: "Raise BOTH hands!", steps: ["Face the camera", "Stand tall", "Lift BOTH hands high", "Hold the pose"] },
  { id: "star", name: "Star pose", emoji: "⭐", rules: ["starPose"], hint: "Make a giant STAR!", steps: ["Step your feet apart", "Stretch both arms wide", "Make your body a star", "Hold the pose"] },
  { id: "head", name: "Touch your head", emoji: "🤲", rules: ["touchHead"], hint: "Touch your HEAD!", steps: ["Face the camera", "Stand tall", "Touch your head with one hand", "Hold the pose"] },
  { id: "hips", name: "Hands on hips", emoji: "🧍", rules: ["handsOnHips"], hint: "Hands on your HIPS!", steps: ["Face the camera", "Stand tall", "Put BOTH hands on your hips", "Hold the pose"] },
  { id: "bird", name: "Bird", emoji: "🐦", rules: ["armsExtended", "bothHandsUp"], hint: "Lift your WINGS!", steps: ["Face the camera", "Stretch both arms straight", "Lift your wings up high", "Hold the pose"] },
  { id: "flamingo", name: "Flamingo", emoji: "🦩", rules: ["oneFootRaised"], hint: "Stand on ONE leg!", steps: ["Stand where Maya can see you", "Keep one foot on the floor", "Lift your other foot", "Balance and hold"] },
];

export const SQUAT_TARGETS = [5, 8, 10];
export const BALANCE_TARGETS = [5, 8, 10]; // seconds

export function poseById(id: string): PoseDef {
  return POSES.find((p) => p.id === id) ?? POSES[0];
}
