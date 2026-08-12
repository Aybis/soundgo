import { useEffect, useRef, useState } from "react";
import type { useVision } from "./useVision";
import { POSE_RULES } from "../motion/rules/PoseRules";
import type { PoseRuleId } from "../motion/rules/PoseRules";

type Vision = ReturnType<typeof useVision>;

export interface SesPoseControllerState {
  /** Rules currently satisfied by the live pose. */
  matched: PoseRuleId[];
  /** A pose is detected at all. */
  detected: boolean;
  /** Calibration reference (neutral standing body). */
  calibration: { shoulderY: number; hipY: number; height: number } | null;
}

export const ALL_POSE_RULES = Object.keys(POSE_RULES) as PoseRuleId[];

/**
 * Evaluates semantic pose rules against the live frame + does one-time body
 * calibration. Games check whether their target pose's rules are all in
 * `matched`, and handle their own hold timing.
 */
export function usePoseController(vision: Vision, enabled = true) {
  const [state, setState] = useState<SesPoseControllerState>({
    matched: [],
    detected: false,
    calibration: null,
  });
  const calibration = useRef<SesPoseControllerState["calibration"]>(null);
  const [calibrating, setCalibrating] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const loop = () => {
      const frame = vision.latestFrame?.current ?? null;
      const pose = frame?.pose;

      if (pose && pose.landmarks && pose.landmarks.length >= 33 && !calibration.current) {
        const shoulderY = (pose.landmarks[11].y + pose.landmarks[12].y) / 2;
        const hipY = (pose.landmarks[23].y + pose.landmarks[24].y) / 2;
        calibration.current = { shoulderY, hipY, height: Math.abs(hipY - shoulderY) };
        setCalibrating(false);
      }

      const matched: PoseRuleId[] = [];
      if (pose && pose.landmarks.length >= 33) {
        for (const id of ALL_POSE_RULES) {
          if (POSE_RULES[id]({ landmarks: pose.landmarks, joints: pose.joints })) matched.push(id);
        }
      }

      const next: SesPoseControllerState = { matched, detected: !!pose, calibration: calibration.current };
      setState(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [enabled, vision]);

  return { ...state, calibrating };
}