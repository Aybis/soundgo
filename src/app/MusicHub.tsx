import { Character } from "../character/Character";
import { GameCard } from "../components/game/GameCard";
import type { IllustrationVariant } from "../components/illustrations/Illustration";

const GAMES: { to: string; title: string; sub: string; variant: IllustrationVariant; color: string }[] = [
  { to: "/music/air-piano", title: "Air Piano", sub: "Wave to play!", variant: "air-piano", color: "from-[#e4dcff] to-[#b7a6ff]" },
  { to: "/music/air-drums", title: "Air Drums", sub: "Hit the drums!", variant: "air-drums", color: "from-[#ffd1e8] to-[#ff9db8]" },
  { to: "/music/beat", title: "Follow the Beat", sub: "Clap along!", variant: "beat", color: "from-[#ffe9c9] to-[#ffd166]" },
];

export default function MusicHub() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] flex flex-col items-center justify-center gap-6 px-6">
      <Character state="excited" message="Let's make music!" size={130} />
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {GAMES.map((g) => (
          <GameCard key={g.to} {...g} />
        ))}
      </div>
    </div>
  );
}