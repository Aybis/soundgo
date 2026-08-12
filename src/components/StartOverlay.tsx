import type { HandStatus } from "../hooks/useHandTracking";

export function StartOverlay({
  status,
  error,
  onStart,
}: {
  status: HandStatus;
  error: string;
  onStart: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black/85 backdrop-blur-sm">
      <h1 className="text-5xl sm:text-6xl font-light tracking-[0.3em] text-white uppercase">
        sound<span className="text-[#6d5cff]">go</span>
      </h1>
      <p className="text-zinc-400 text-sm text-center px-6 max-w-sm leading-relaxed">
        There are two modes. Have fun! You'll need to allow camera access to play.
      </p>

      {status === "error" && (
        <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs max-w-sm text-center">
          Camera error: {error}
        </div>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <span className="h-3 w-3 rounded-full border-2 border-zinc-500 border-t-transparent animate-spin" />
          Loading hand tracker…
        </div>
      )}

      {status !== "loading" && (
        <button
          onClick={onStart}
          className="px-8 py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-zinc-200 transition-colors"
        >
          Start
        </button>
      )}
    </div>
  );
}