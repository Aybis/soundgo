import type { NormalizedPoint } from "../types";

export interface CameraOptions {
  width?: number;
  height?: number;
  mirrored?: boolean; // mirror the preview for natural self-view
}

export interface CameraInfo {
  width: number;
  height: number;
  fps: number;
}

/**
 * Owns the single camera lifecycle for the whole app. One getUserMedia stream,
 * one <video> element, centralized mirroring + coordinate mapping so every
 * game maps normalized vision coords → screen coords identically.
 */
export class CameraManager {
  readonly video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private mirrored = true;
  private info: CameraInfo = { width: 0, height: 0, fps: 0 };

  constructor() {
    this.video = document.createElement("video");
    this.video.playsInline = true;
    this.video.muted = true;
  }

  get isRunning() { return !!this.stream; }
  get currentInfo() { return this.info; }
  get isMirrored() { return this.mirrored; }

  async start(opts: CameraOptions = {}): Promise<void> {
    if (this.stream) return;
    this.mirrored = opts.mirrored ?? true;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: opts.width ?? 1280 },
        height: { ideal: opts.height ?? 720 },
      },
      audio: false,
    });
    this.stream = stream;
    this.video.srcObject = stream;
    await this.video.play();
    this.info.width = this.video.videoWidth;
    this.info.height = this.video.videoHeight;
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
  }

  /**
   * Map a normalized vision coordinate to CSS-pixel screen coordinates,
   * accounting for the video's object-fit "cover" scaling and mirroring.
   */
  mapToScreen(nx: number, ny: number, w: number, h: number): { x: number; y: number } {
    const vw = this.info.width || 1;
    const vh = this.info.height || 1;
    const scale = Math.max(w / vw, h / vh);
    const ox = (w - vw * scale) / 2;
    const oy = (h - vh * scale) / 2;
    const x = this.mirrored ? (1 - nx) * vw * scale + ox : nx * vw * scale + ox;
    const y = ny * vh * scale + oy;
    return { x, y };
  }

  /** Convenience: batch-map a point. */
  mapPoint(p: NormalizedPoint, w: number, h: number) {
    return this.mapToScreen(p.x, p.y, w, h);
  }
}