import { useCallback, useRef, useState } from "react";
import { FilesetResolver, FaceLandmarker, HandLandmarker } from "@mediapipe/tasks-vision";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export type CamStatus = "idle" | "loading" | "ready" | "error";

export interface LandmarkPoint { x: number; y: number; z: number; }

export interface LandmarkFrame {
  faces: LandmarkPoint[][];
  hands: LandmarkPoint[][];
}

export function useWebcamLandmarkers(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<CamStatus>("idle");
  const [error, setError] = useState("");
  const faceRef = useRef<FaceLandmarker | null>(null);
  const handRef = useRef<HandLandmarker | null>(null);

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
      const [face, hand] = await Promise.all([
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
          runningMode: "VIDEO",
          outputFaceBlendshapes: false,
          numFaces: 2,
        }),
        HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL, delegate: "GPU" },
          runningMode: "VIDEO",
          numHands: 2,
        }),
      ]);
      faceRef.current = face;
      handRef.current = hand;
      setStatus("ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("error");
    }
  }, [videoRef]);

  const detect = useCallback((video: HTMLVideoElement): LandmarkFrame | null => {
    const faceLm = faceRef.current;
    const handLm = handRef.current;
    if (!faceLm && !handLm) return null;
    const t = performance.now();
    const frame: LandmarkFrame = { faces: [], hands: [] };
    try {
      if (faceLm) {
        const r = faceLm.detectForVideo(video, t);
        if (r.faceLandmarks) frame.faces = r.faceLandmarks;
      }
      if (handLm) {
        const r = handLm.detectForVideo(video, t);
        if (r.landmarks) frame.hands = r.landmarks;
      }
    } catch {
      return frame;
    }
    return frame;
  }, []);

  return { status, error, start, detect };
}