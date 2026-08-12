import type { VisionFrame, VisionRequirements } from "../types";
import type { VisionProvider } from "../providers/VisionProvider";

export interface VisionEngineOptions {
  targetFps?: number; // max inference rate (default 30)
  requiresVideo?: boolean; // false for mock providers (no real video frames)
  onFrame: (frame: VisionFrame) => void;
}

export interface VisionStats {
  cameraFps: number;
  inferenceFps: number;
  inferenceMs: number;
}

/**
 * Runs the single inference loop. Reads the active provider, throttles to
 * targetFps (skipping frames when the device is slow), and delivers normalized
 * VisionFrames to the subscribed game. One loop shared by all activities.
 */
export class VisionEngine {
  private provider: VisionProvider;
  private video: HTMLVideoElement;
  private onFrame: (f: VisionFrame) => void;
  private targetFps: number;
  private requiresVideo: boolean;
  private raf = 0;
  private running = false;
  private lastInference = 0;
  private stats: VisionStats = { cameraFps: 0, inferenceFps: 0, inferenceMs: 0 };
  private camFrames = 0;
  private infFrames = 0;
  private lastSecond = 0;

  constructor(provider: VisionProvider, video: HTMLVideoElement, opts: VisionEngineOptions) {
    this.provider = provider;
    this.video = video;
    this.onFrame = opts.onFrame;
    this.targetFps = opts.targetFps ?? 30;
    this.requiresVideo = opts.requiresVideo ?? true;
  }

  setRequirements(req: VisionRequirements) {
    this.provider.setRequirements(req);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastSecond = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  getStats() { return this.stats; }

  private loop = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);

    // camera fps
    this.camFrames++;

    // throttle inference
    const intervalMs = 1000 / this.targetFps;
    if (now - this.lastInference < intervalMs) return;
    this.lastInference = now;

    // only infer when the video actually has a frame (skip for mock providers)
    if (this.requiresVideo && !this.video.videoWidth) return;

    const frame = this.provider.processFrame(this.video);
    this.infFrames++;
    this.stats.inferenceMs = frame.performance.inferenceMs;
    this.onFrame(frame);

    // per-second stats
    if (now - this.lastSecond >= 1000) {
      this.stats.cameraFps = Math.round((this.camFrames * 1000) / (now - this.lastSecond));
      this.stats.inferenceFps = Math.round((this.infFrames * 1000) / (now - this.lastSecond));
      this.camFrames = 0;
      this.infFrames = 0;
      this.lastSecond = now;
    }
  };
}