interface Props {
  current: number;
  total: number;
  /** e.g. "⭐" or "●" */
  icon?: string;
  className?: string;
}

/** Chunky kid-friendly progress (stars / dots). */
export function GameProgress({ current, total, icon = "●", className = "" }: Props) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`text-2xl transition-all ${
            i < current ? "scale-110 opacity-100" : "opacity-30 grayscale"
          }`}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}