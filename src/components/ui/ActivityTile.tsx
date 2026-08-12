import { Link } from "react-router-dom";
import { Illustration } from "../illustrations/Illustration";
import type { IllustrationVariant } from "../illustrations/Illustration";

interface Props {
  to: string;
  title: string;
  variant: IllustrationVariant;
  color: string;
  sub?: string;
}

/** A big, world-like activity tile (replaces small dashboard cards). */
export function ActivityTile({ to, title, variant, color, sub }: Props) {
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br ${color} p-4 flex flex-col items-center justify-end text-center shadow-lg transition-all hover:scale-[1.05] hover:-rotate-1 hover:shadow-2xl`}
    >
      <Illustration variant={variant} className="w-28 h-28 -mt-2 group-hover:scale-110 group-hover:-rotate-3 transition-transform drop-shadow-lg" />
      <span className="mt-1 text-xl font-extrabold text-white drop-shadow-sm leading-tight">{title}</span>
      {sub && <span className="text-[11px] font-semibold text-white/85 leading-tight">{sub}</span>}
    </Link>
  );
}