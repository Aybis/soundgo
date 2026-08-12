import { Character } from "../character/Character";
import { GameCard } from "../components/game/GameCard";
import type { IllustrationVariant } from "../components/illustrations/Illustration";

const GAMES: { to: string; title: string; sub: string; variant: IllustrationVariant; color: string }[] = [
  { to: "/move/copy-pose", title: "Copy the Pose", sub: "Copy MAYA's moves!", variant: "copy-pose", color: "from-[#c9f0e0] to-[#7ee8c4]" },
  { to: "/move/squat", title: "Squat Challenge", sub: "Squat down & up!", variant: "squat", color: "from-[#ffe9c9] to-[#ffd166]" },
  { to: "/move/balance", title: "Balance", sub: "Stand on one leg!", variant: "balance", color: "from-[#ffd1e8] to-[#ff9db8]" },
];

export default function MoveHub() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] flex flex-col items-center justify-center gap-6 px-6">
      <Character state="excited" message="Let's move our bodies!" size={130} />
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {GAMES.map((g) => (
          <GameCard key={g.to} {...g} />
        ))}
      </div>
    </div>
  );
}