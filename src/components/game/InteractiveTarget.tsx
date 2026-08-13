import type { GrabOption } from "../../content/grab-answer";
import { AnimalIllustration } from "../illustrations/AnimalIllustration";
import { animalConversation } from "../../content/conversation";
import { loadSettings } from "../../state/settings";

interface Props {
  option: GrabOption;
  x: number;
  y: number;
  selected: boolean;
  onSelect: () => void;
}

/** Large, playful camera-selection target. Animals render as picture cards. */
export function InteractiveTarget({ option, x, y, selected, onSelect }: Props) {
  const style: React.CSSProperties = { left: x, top: y, transform: "translate(-50%, -50%)" };
  const isAnimal = Boolean(option.animalId);

  return (
    <button
      onMouseDown={onSelect}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={style}
      className={`absolute rounded-[2rem] px-4 py-3 text-xl font-black shadow-lg transition-all duration-150 cursor-pointer select-none bg-white/95 text-[#3a3352] hover:scale-105 ${selected ? "scale-110 ring-4 ring-[#6d5cff]/50" : ""} ${isAnimal ? "w-40 min-h-40" : "min-w-28"}`}
    >
      {isAnimal ? (
        <div className="flex flex-col items-center gap-1">
          <AnimalIllustration animal={option.animalId!} className="w-28 h-28" />
          <span>{animalConversation(option.animalId!, loadSettings().language).label}</span>
        </div>
      ) : option.kind === "color" ? (
        <span className="inline-block h-16 w-16 rounded-full border-4 border-white shadow-inner" style={{ backgroundColor: option.value }} />
      ) : (
        <span className="text-3xl">{option.emoji ?? option.label}</span>
      )}
    </button>
  );
}