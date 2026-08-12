import { Link } from "react-router-dom";
import { Character } from "../character/Character";
import { ActivityTile } from "../components/ui/ActivityTile";
import type { IllustrationVariant } from "../components/illustrations/Illustration";

const GAMES: { to: string; title: string; variant: IllustrationVariant; color: string; sub?: string; soon?: boolean }[] = [
  { to: "/music/air-piano", title: "Air Piano", variant: "air-piano", color: "from-[#b7a6ff] to-[#6d5cff]", sub: "Wave to play!" },
  { to: "/music/air-drums", title: "Air Drums", variant: "air-drums", color: "from-[#ff9db8] to-[#ff6b9d]", sub: "Hit the drums!" },
  { to: "/music/beat", title: "Follow the Beat", variant: "beat", color: "from-[#ffb36b] to-[#ff8c42]", sub: "Clap along!" },
];

export default function MusicHub() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#f0eaff] to-[#eef2ff] flex flex-col items-center justify-center gap-6 px-6">
      <Link to="/" className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#e4dcff] text-[#3a3352] text-sm font-medium hover:bg-white">← Home</Link>
      <Character state="excited" message="Let's make music!" size={130} />
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {GAMES.map((g) => (
          <ActivityTile key={g.to} to={g.to} title={g.title} variant={g.variant} color={g.color} sub={g.sub} />
        ))}
      </div>
    </div>
  );
}