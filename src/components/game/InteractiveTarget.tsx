import type { GrabOption } from "../../content/grab-answer";

interface Props {
  option: GrabOption;
  x: number;
  y: number;
  selected: boolean;
  onSelect: () => void;
}

/**
 * A floating selectable target. Games lay these out; selection is driven by
 * the pointer (hand pinch or mouse). Renders text, emoji or color swatch.
 */
export function InteractiveTarget({ option, x, y, selected, onSelect }: Props) {
  const style: React.CSSProperties = {
    left: x,
    top: y,
    transform: "translate(-50%, -50%)",
  };

  return (
    <button
      onMouseEnter={() => {}}
      onMouseDown={onSelect}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={style}
      className={`absolute rounded-3xl px-6 py-5 text-2xl font-bold shadow-lg transition-all duration-150 cursor-pointer select-none ${
        selected
          ? "bg-[#6d5cff] text-white scale-110 ring-4 ring-[#6d5cff]/40"
          : "bg-white/90 text-[#3a3352] hover:scale-105"
      }`}
    >
      {option.kind === "color" ? (
        <span
          className="inline-block h-12 w-12 rounded-full border-4 border-white shadow-inner"
          style={{ backgroundColor: option.value }}
        />
      ) : (
        option.label
      )}
    </button>
  );
}