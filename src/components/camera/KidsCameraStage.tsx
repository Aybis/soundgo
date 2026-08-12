import type { ReactNode } from "react";
import type { useCameraInput } from "../../hooks/useCameraInput";

interface Props {
  vision: ReturnType<typeof useCameraInput>["vision"];
  hint?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Kid-friendly camera stage. Wraps the raw video in a soft vignette, glow and
 * floating particles so it feels like a magical portal — never a webcam demo.
 * No debug/latency/landmark info is ever shown to children.
 */
export function KidsCameraStage({ vision, hint, className = "", children }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] bg-black/70 ${className}`}>
      {/* live video */}
      <div
        className="absolute inset-0"
        ref={(el) => {
          if (el && vision.videoElement && !el.contains(vision.videoElement)) el.appendChild(vision.videoElement);
        }}
      />
      <style>{`video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}`}</style>

      {/* soft vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />

      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 30%, rgba(109,92,255,0.18), transparent 60%)" }} />

      {/* floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {AMBIENT.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.s, height: p.s,
              background: p.c,
              opacity: 0.5,
              animation: `floaty ${p.d}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* friendly hint */}
      {hint && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
          <span className="px-4 py-2 rounded-full bg-black/40 backdrop-blur text-white text-sm font-bold">{hint}</span>
        </div>
      )}

      {/* game overlays */}
      {children}
    </div>
  );
}

const AMBIENT = [
  { x: 12, y: 20, s: 8, c: "#ffd166", d: 4, delay: "0s" },
  { x: 82, y: 15, s: 6, c: "#ff9db8", d: 5, delay: "0.6s" },
  { x: 20, y: 78, s: 7, c: "#06d6a0", d: 4.5, delay: "1s" },
  { x: 88, y: 70, s: 9, c: "#b7a6ff", d: 5.5, delay: "0.3s" },
  { x: 50, y: 8, s: 5, c: "#ffd166", d: 4, delay: "0.8s" },
  { x: 30, y: 50, s: 6, c: "#ff9db8", d: 5, delay: "1.4s" },
  { x: 70, y: 45, s: 5, c: "#06d6a0", d: 4.5, delay: "0.2s" },
];