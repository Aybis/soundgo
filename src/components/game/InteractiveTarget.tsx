import type { GrabOption } from "../../content/grab-answer";
import { animalConversation } from "../../content/conversation";
import { loadSettings } from "../../state/settings";

interface Props {
  option: GrabOption;
  x: number;
  y: number;
  selected: boolean;
  feedback?: "correct" | "wrong" | null;
  onSelect: () => void;
}

/** Large, playful camera-selection target. Animals render as picture cards. */
export function InteractiveTarget({ option, x, y, selected, feedback = null, onSelect }: Props) {
  const style: React.CSSProperties = { left: x, top: y, transform: "translate(-50%, -50%)" };
  const isPicture = Boolean(option.imageSrc);
  const picturePosition = option.imagePosition ?? `${(option.imageIndex ?? 0) * 25}% 50%`;
  const displayLabel = option.animalId
    ? animalConversation(option.animalId, loadSettings().language).label
    : option.label;

  return (
    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      aria-label={displayLabel}
      style={style}
      className={`absolute rounded-[1.75rem] px-3 py-3 text-xl font-black shadow-lg transition-all duration-150 cursor-pointer select-none bg-white/95 text-[#3a3352] hover:scale-105 ${selected && !feedback ? "scale-110 ring-4 ring-[#6d5cff] shadow-[0_0_28px_rgba(109,92,255,0.45)]" : ""} ${feedback === "correct" ? "scale-110 ring-4 ring-emerald-400 bg-emerald-50" : ""} ${feedback === "wrong" ? "anim-wiggle ring-4 ring-rose-400 bg-rose-50" : ""} ${isPicture ? "w-[clamp(5.75rem,24vw,10rem)] min-h-[clamp(7rem,27vw,11rem)]" : "min-w-[clamp(5.5rem,22vw,8rem)]"}`}
    >
      {isPicture ? (
        <div className="flex flex-col items-center gap-1">
          <span
            role="img"
            aria-label={option.imageAlt ?? displayLabel}
            className="block aspect-square w-full bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${option.imageSrc})`,
              backgroundSize: option.imageSize ?? "500% 100%",
              backgroundPosition: picturePosition,
            }}
          />
          <span className="text-base sm:text-lg">{displayLabel}</span>
        </div>
      ) : option.kind === "color" ? (
        <span className="inline-block h-16 w-16 rounded-full border-4 border-white shadow-inner" style={{ backgroundColor: option.value }} />
      ) : (
        <span className="text-3xl">{option.emoji ?? option.label}</span>
      )}
    </button>
  );
}
