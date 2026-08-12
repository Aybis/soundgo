import { useCallback, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export type HandStatus = "idle" | "loading" | "ready" | "error";

export interface HandPoint {
  // normalized landmarks [0..1] relative to video frame
  x: number; // 0 = left
  y: number; // 0 = top
  z: number;
}

export interface DetectedHands {
  // control point = index fingertip (landmark 8)
  points: HandPoint[];
  handCount: number;
}

export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<HandStatus>("idle");
  const [error, setError] = useState("");
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  const start = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const video = videoRef.current;
      if (!video) throw new Error("Video element not mounted");
      video.srcObject = stream;
      await video.play();

      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 2,
      });
      landmarkerRef.current = landmarker;
      setStatus("ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("error");
    }
  }, [videoRef]);

  // CPU cost note: land CPU fallback when GPU delegate fails to initialize.
  const detect = useCallback((video: HTMLVideoElement): DetectedHands | null => {
    const lm = landmarkerRef.current;
    if (!lm) return null;
    let results;
    try {
      results = lm.detectForVideo(video, performance.now());
    } catch {
      return null;
    }
    const points: HandPoint[] = [];
    if (results.landmarks) {
      for (const hand of results.landmarks) {
        const tip = hand[8]; // index fingertip
        points.push({ x: tip.x, y: tip.y, z: tip.z ?? 0 });
      }
    }
    return { points, handCount: points.length };
  }, []);

  return { status, error, start, detect };
}