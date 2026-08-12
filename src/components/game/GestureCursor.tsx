import type { ControllerPointer } from "../../hooks/usePointerController";

interface Props {
  pointer: ControllerPointer;
  visible?: boolean;
}

/** The on-screen cursor for hand (and mouse) control. */
export function GestureCursor({ pointer, visible = true }: Props) {
  if (!visible || !pointer.present) return null;
  const color = pointer.pinching ? "#06d6a0" : pointer.source === "mouse" ? "#3a3352" : "#6d5cff";
  return (
    <div
      className="pointer-events-none fixed z-40"
      style={{ left: pointer.x, top: pointer.y, transform: "translate(-50%, -50%)" }}
    >
      {/* outer ring */}
      <div
        className="rounded-full transition-transform"
        style={{
          width: pointer.pinching ? 46 : 34,
          height: pointer.pinching ? 46 : 34,
          border: `3px solid ${color}`,
          opacity: 0.7,
        }}
      />
      {/* center dot */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 8, height: 8, backgroundColor: color }}
      />
      {pointer.pinching && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-[#06d6a0]">
          ●
        </div>
      )}
    </div>
  );
}