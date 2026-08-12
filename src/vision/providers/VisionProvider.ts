import type { VisionFrame, VisionRequirements } from "../types";

/**
 * Games and the VisionEngine must never depend on MediaPipe directly.
 * Everything vision-related goes through this interface so a Mock provider
 * (tests / dev) and future native or remote providers can plug in.
 */
export interface VisionProvider {
  initialize(req: VisionRequirements): Promise<void>;
  setRequirements(req: VisionRequirements): void;
  /** Run inference on the current video frame and return a normalized frame. */
  processFrame(video: HTMLVideoElement): VisionFrame;
  destroy(): Promise<void>;
}