import { useCallback, useEffect, useRef, useState } from "react";
import { CameraManager } from "../vision/core/CameraManager";
import { VisionEngine } from "../vision/core/VisionEngine";
import type { VisionStats } from "../vision/core/VisionEngine";
import type { VisionFrame, VisionRequirements } from "../vision/types";
import type { VisionProvider } from "../vision/providers/VisionProvider";
import { MediaPipeVisionProvider } from "../vision/providers/MediaPipeVisionProvider";
import { MockVisionProvider } from "../vision/providers/MockVisionProvider";
import type { MockScenario } from "../vision/providers/MockVisionProvider";
import { MotionBus } from "../motion/events";
import { HandInterpreter } from "../motion/interpreters/HandInterpreter";
import { PoseInterpreter } from "../motion/interpreters/PoseInterpreter";

export type VisionStatus = "idle" | "loading" | "ready" | "error";

export interface UseVisionOptions {
  requirements: VisionRequirements;
  onFrame?: (frame: VisionFrame) => void;
  onEvent?: (event: Parameters<MotionBus["emit"]>[0]) => void;
  targetFps?: number;
  mock?: boolean; // use MockVisionProvider (no camera needed)
  mockScenario?: MockScenario; // applied to the mock provider on start
  autoStart?: boolean;
}

/**
 * One-stop React binding to the whole camera→vision→motion pipeline.
 * Owns the single CameraManager + VisionEngine + interpreters + MotionBus.
 */
export function useVision(opts: UseVisionOptions) {
  const [status, setStatus] = useState<VisionStatus>("idle");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<VisionStats>({ cameraFps: 0, inferenceFps: 0, inferenceMs: 0 });

  const camRef = useRef<CameraManager | null>(null);
  const engineRef = useRef<VisionEngine | null>(null);
  const busRef = useRef<MotionBus | null>(null);
  const providerRef = useRef<VisionProvider | null>(null);
  const latestFrameRef = useRef<VisionFrame | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  if (!camRef.current) camRef.current = new CameraManager();
  if (!busRef.current) busRef.current = new MotionBus();

  const start = useCallback(async () => {
    const o = optsRef.current;
    setStatus("loading");
    setError("");
    const cam = camRef.current!;
    const bus = busRef.current!;
    bus.clear();

    try {
      if (!o.mock) {
        await cam.start();
      }
      const provider: VisionProvider = o.mock ? new MockVisionProvider() : new MediaPipeVisionProvider();
      providerRef.current = provider;
      if (o.mock && o.mockScenario) (provider as MockVisionProvider).setScenario(o.mockScenario);
      await provider.initialize(o.requirements);

      const handInt = new HandInterpreter(bus);
      const poseInt = new PoseInterpreter(bus);

      const engine = new VisionEngine(provider, cam.video, {
        targetFps: o.targetFps ?? 30,
        requiresVideo: !o.mock,
        onFrame: (frame) => {
          latestFrameRef.current = frame;
          handInt.process(frame, frame.timestamp);
          poseInt.process(frame, frame.timestamp);
          o.onFrame?.(frame);
        },
      });
      engineRef.current = engine;
      engine.start();

      // forward motion bus events to the component
      const fwd = (e: Parameters<MotionBus["emit"]>[0]) => o.onEvent?.(e);
      const unsubs: (() => void)[] = [];
      const types = [
        "HAND_RAISED","HAND_LOWERED","PINCH_START","PINCH_END","FINGER_COUNT_CHANGED",
        "POINTING","WAVE","CLAP","HEAD_LEFT","HEAD_RIGHT","HEAD_NOD","HEAD_SHAKE",
        "POSE_MATCHED","SQUAT_STARTED","SQUAT_BOTTOM","SQUAT_COMPLETED",
        "BALANCE_STARTED","BALANCE_LOST","JUMP_STARTED","JUMP_COMPLETED",
      ] as const;
      for (const t of types) unsubs.push(bus.on(t, fwd));

      setStatus("ready");

      return () => {
        unsubs.forEach((u) => u());
        engine.stop();
        provider.destroy();
        if (!o.mock) cam.stop();
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
      return () => {};
    }
  }, []);

  // stats polling
  useEffect(() => {
    const id = setInterval(() => {
      const e = engineRef.current;
      if (e) setStats(e.getStats());
    }, 500);
    return () => clearInterval(id);
  }, [status]);

  const setRequirements = useCallback((r: VisionRequirements) => {
    engineRef.current?.setRequirements(r);
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    if (!optsRef.current.mock) camRef.current?.stop();
    setStatus("idle");
  }, []);

  return {
    status,
    error,
    stats,
    videoElement: camRef.current!.video,
    camera: camRef.current!,
    latestFrame: latestFrameRef,
    bus: busRef.current!,
    provider: providerRef.current,
    start,
    stop,
    setRequirements,
  };
}