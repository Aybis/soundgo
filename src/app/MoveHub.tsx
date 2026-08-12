import { Link } from "react-router-dom";
import { Character } from "../character/Character";
import { ActivityTile } from "../components/ui/ActivityTile";
import type { IllustrationVariant } from "../components/illustrations/Illustration";

const GAMES: { to: string; title: string; variant: IllustrationVariant; color: string; sub?: string; soon?: boolean }[] = [
  { to: "/move/copy-me", title: "Copy Me", variant: "copy-pose", color: "from-[#7ee8c4] to-[#06d6a0]", sub: "Copy MAYA's moves!" },
  { to: "/move/squat", title: "Squat Challenge", variant: "squat", color: "from-[#ffb36b] to-[#ff8c42]", sub: "Squat down & up!" },
  { to: "/move/balance", title: "Balance", variant: "balance", color: "from-[#ff9db8] to-[#ff6b9d]", sub: "Stand on one leg!" },
];

export default function MoveHub() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#e7fbf2] to-[#eef2ff] flex flex-col items-center justify-center gap-6 px-6">
      <Link to="/" className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#d1f2e4] text-[#3a3352] text-sm font-medium hover:bg-white">← Home</Link>
      <Character state="excited" message="Let's move our bodies!" size={130} />
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {GAMES.map((g) => (
          <ActivityTile key={g.to} to={g.to} title={g.title} variant={g.variant} color={g.color} sub={g.sub} />
        ))}
      </div>
    </div>
  );
}