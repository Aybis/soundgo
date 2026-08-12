import { MayaSVG } from "./MayaSVG";
import type { MayaState } from "./types";

interface Props {
  state: MayaState;
  message?: string | null;
  size?: number;
  className?: string;
}

/** MAYA — the guide/friend. Renders the character + a speech bubble. */
export function Character({ state, message, size = 160, className = "" }: Props) {
  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {message && (
        <div className="relative mb-2 rounded-2xl rounded-br-sm bg-white text-[#3a3352] px-4 py-2 text-sm font-medium shadow-lg max-w-[220px] text-center">
          {message}
          <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-white" />
        </div>
      )}
      <div className="animate-[maya-bob_2.5s_ease-in-out_infinite]">
        <MayaSVG state={state} size={size} />
      </div>
      <style>{`@keyframes maya-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}