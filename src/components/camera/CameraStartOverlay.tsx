import type { VisionStatus } from "../../hooks/useVision";

interface Props {
  status: VisionStatus;
  error: string;
  mock: boolean;
  onStart: () => void;
  onUseMock: () => void;
}

/**
 * Consistent camera gate for every game. Real camera is the default; the
 * mock fallback is only for testing without a camera. Shown whenever the
 * camera isn't ready (idle or error).
 */
export function CameraStartOverlay({ status, error, mock, onStart, onUseMock }: Props) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm">
      <div className="text-2xl font-bold text-white">MAYA needs the camera 📷</div>
      <div className="text-sm text-white/70 max-w-xs text-center leading-relaxed">
        We play together with your camera — allow it when your browser asks!
      </div>

      {status === "loading" && (
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <span className="h-3 w-3 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
          Turning on camera…
        </div>
      )}

      {status === "error" && (
        <div className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/30 text-red-200 text-xs max-w-xs text-center">
          {error}
        </div>
      )}

      {status !== "loading" && (
        <button
          onClick={onStart}
          className="px-8 py-3 rounded-full bg-[#6d5cff] text-white font-semibold text-sm hover:bg-[#5a4ce6] transition-colors"
        >
          {status === "error" ? "Retry camera" : "Start camera"}
        </button>
      )}

      <button onClick={onUseMock} className="text-white/50 text-xs underline hover:text-white/80">
        {mock ? "Using mock — switch to camera" : "Use mock (no camera) for testing"}
      </button>
    </div>
  );
}