import { Link } from "react-router-dom";
import { Character } from "../character/Character";
import { ActivityTile } from "../components/ui/ActivityTile";
import type { IllustrationVariant } from "../components/illustrations/Illustration";

const GAMES: { to: string; title: string; variant: IllustrationVariant; color: string; sub?: string; soon?: boolean }[] = [
  { to: "/create/air-draw", title: "Air Draw", variant: "air-writing", color: "from-[#ffb36b] to-[#ff8c42]", sub: "Draw with your finger!" },
  { to: "/create/air-drawing", title: "Air Drawing", variant: "create", color: "from-[#7ee8c4] to-[#06d6a0]", sub: "More drawing", soon: true },
  { to: "/create/tangle", title: "Tangle", variant: "create", color: "from-[#7cc4ff] to-[#3b9ef5]", sub: "Squiggly fun", soon: true },
];

export default function CreateHub() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff1e6] to-[#eef2ff] flex flex-col items-center justify-center gap-6 px-6">
      <Link to="/" className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#ffdcc3] text-[#3a3352] text-sm font-medium hover:bg-white">← Home</Link>
      <Character state="happy" message="Let's create something!" size={130} />
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {GAMES.map((g) => g.soon ? (
          <div key={g.to} className={`rounded-[2.2rem] bg-gradient-to-br ${g.color} p-4 flex flex-col items-center text-center opacity-40 grayscale cursor-not-allowed`}>
            <span className="mt-1 text-lg font-extrabold text-white drop-shadow-sm leading-tight">{g.title}</span>
            <span className="mt-1 text-[10px] font-bold text-white bg-white/25 px-2 py-0.5 rounded-full">coming soon</span>
          </div>
        ) : (
          <ActivityTile key={g.to} to={g.to} title={g.title} variant={g.variant} color={g.color} sub={g.sub} />
        ))}
      </div>
    </div>
  );
}