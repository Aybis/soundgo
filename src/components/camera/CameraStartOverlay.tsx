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
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-[#3a3352]/55 p-5 backdrop-blur-md">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[2.25rem] border-4 border-white bg-[#fff8ed] px-6 py-7 text-center shadow-2xl sm:px-9">
        <div className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-[#e9e4ff] text-4xl" aria-hidden="true">📷</div>
        <div className="text-2xl font-black leading-tight text-[#3a3352] sm:text-3xl">Let Maya see your moves!</div>
        <div className="max-w-xs text-base font-semibold leading-relaxed text-[#746a89]">
          Ask a grown-up to help turn on the camera. Your video stays on this device.
        </div>

      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm font-bold text-[#6d5cff]">
          <span className="h-4 w-4 rounded-full border-2 border-[#6d5cff] border-t-transparent animate-spin" />
          Waking up the camera…
        </div>
      )}

      {status === "error" && (
        <div className="max-w-xs rounded-2xl border-2 border-[#ff9db8] bg-[#fff0f4] px-4 py-3 text-sm font-bold text-[#a53b5b]">
          Camera needs help: {error}
        </div>
      )}

      {status !== "loading" && (
        <button
          onClick={onStart}
          className="min-h-14 rounded-full bg-[#6d5cff] px-9 py-3 text-lg font-black text-white shadow-[0_6px_0_#4a3fd1] transition-all hover:bg-[#5a4ce6] active:translate-y-1 active:shadow-none"
        >
          {status === "error" ? "TRY AGAIN" : "TURN ON CAMERA"}
        </button>
      )}

      <button onClick={onUseMock} className="text-xs font-bold text-[#9a90ad] underline hover:text-[#6d5cff]">
        {mock ? "Using mock — switch to camera" : "Use mock (no camera) for testing"}
      </button>
      </div>
    </div>
  );
}
