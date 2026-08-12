import { Link } from "react-router-dom";
import { Illustration } from "../illustrations/Illustration";
import type { IllustrationVariant } from "../illustrations/Illustration";

interface Props {
  to: string;
  title: string;
  sub: string;
  variant: IllustrationVariant;
  color: string;
  soon?: boolean;
}

/** Big, colorful game card for the kids' hubs — illustration not icon. */
export function GameCard({ to, title, sub, variant, color, soon }: Props) {
  return (
    <Link
      to={to}
      onClick={(e) => { if (soon) e.preventDefault(); }}
      className={`group rounded-[1.8rem] overflow-hidden bg-gradient-to-br ${color} p-4 flex flex-col items-center text-center shadow-md hover:shadow-2xl hover:scale-[1.04] hover:-rotate-1 transition-all ring-0 ${soon ? "opacity-60 cursor-not-allowed grayscale" : "hover:ring-4"}`}
    >
      <Illustration variant={variant} className="w-24 h-24 group-hover:scale-110 group-hover:-rotate-3 transition-transform drop-shadow-md" />
      <span className="mt-2 text-lg font-extrabold text-white drop-shadow-sm leading-tight">{title}</span>
      <span className="text-[11px] font-semibold text-white/85 leading-tight">{sub}</span>
      {soon && <span className="mt-1 text-[10px] font-bold text-white bg-white/25 px-2 py-0.5 rounded-full">coming soon</span>}
    </Link>
  );
}