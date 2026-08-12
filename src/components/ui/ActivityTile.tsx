import { Link } from "react-router-dom";
import { Illustration } from "../illustrations/Illustration";
import type { IllustrationVariant } from "../illustrations/Illustration";

interface Props {
  to: string;
  title: string;
  variant: IllustrationVariant;
  color: string;
  sub?: string;
  compact?: boolean;
}

/** A big, world-like activity tile (replaces small dashboard cards). */
export function ActivityTile({ to, title, variant, color, sub, compact }: Props) {
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br ${color} p-3 flex flex-col items-center justify-end text-center shadow-md transition-all hover:scale-[1.05] hover:-rotate-1 hover:shadow-xl`}
    >
      <Illustration variant={variant} className={compact ? "w-16 h-16" : "w-24 h-24"} />
      <span className="mt-0.5 text-lg font-extrabold text-white drop-shadow-sm leading-tight">{title}</span>
      {sub && <span className="text-[10px] font-semibold text-white/85 leading-tight">{sub}</span>}
    </Link>
  );
}