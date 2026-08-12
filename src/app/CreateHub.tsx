import { Character } from "../character/Character";
import { GameCard } from "../components/game/GameCard";
import type { IllustrationVariant } from "../components/illustrations/Illustration";

const GAMES: { to: string; title: string; sub: string; variant: IllustrationVariant; color: string; soon?: boolean }[] = [
  { to: "/create/air-writing", title: "Air Writing", sub: "Trace letters in the air", variant: "air-writing", color: "from-[#c9f0e0] to-[#7ee8c4]" },
  { to: "/create/air-drawing", title: "Air Drawing", sub: "Draw with your finger", variant: "create", color: "from-[#ffe9c9] to-[#ffd166]", soon: true },
  { to: "/create/tangle", title: "Tangle", sub: "Draw squiggles!", variant: "create", color: "from-[#ffd1e8] to-[#ff9db8]", soon: true },
];

export default function CreateHub() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] flex flex-col items-center justify-center gap-6 px-6">
      <Character state="happy" message="Let's create something!" size={130} />
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {GAMES.map((g) => (
          <GameCard key={g.to} {...g} />
        ))}
      </div>
    </div>
  );
}