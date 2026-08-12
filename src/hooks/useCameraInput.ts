import { useCallback, useState } from "react";
import { useVision } from "./useVision";
import type { VisionFrame, VisionRequirements } from "../vision/types";
import type { MockScenario } from "../vision/providers/MockVisionProvider";

export interface CameraInputOptions {
  requirements: VisionRequirements;
  onFrame?: (frame: VisionFrame) => void;
  mockScenario?: MockScenario;
}

/**
 * Consistent camera input for every game. Real camera is the default; mock is
 * only a testing fallback. `startCamera` must be called from a user gesture
 * (the browser requires it for getUserMedia). `startMock` needs no gesture.
 */
export function useCameraInput(opts: CameraInputOptions) {
  const [mock, setMock] = useState(false);
  const vision = useVision({
    requirements: opts.requirements,
    mock,
    mockScenario: opts.mockScenario,
    onFrame: opts.onFrame,
  });

  const startCamera = useCallback(() => {
    setMock(false);
    void vision.start(false);
  }, [vision]);

  const startMock = useCallback(() => {
    setMock(true);
    void vision.start(true);
  }, [vision]);

  return { vision, mock, startCamera, startMock };
}