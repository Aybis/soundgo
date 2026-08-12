import { Character } from "../character/Character";
import { GameCard } from "../components/game/GameCard";
import type { IllustrationVariant } from "../components/illustrations/Illustration";

const GAMES: { to: string; title: string; sub: string; variant: IllustrationVariant; color: string; soon?: boolean }[] = [
  { to: "/learn/finger-math", title: "Finger Math", sub: "Show the right number!", variant: "finger-math", color: "from-[#ffd1e8] to-[#ff9db8]" },
  { to: "/learn/grab-answer", title: "Grab the Answer", sub: "Point & pinch your answer!", variant: "grab-answer", color: "from-[#ffe9c9] to-[#ffd166]" },
  { to: "/learn/air-writing", title: "Air Writing", sub: "Trace letters in the air", variant: "air-writing", color: "from-[#c9f0e0] to-[#7ee8c4]", soon: true },
  { to: "/learn/simon", title: "Simon Says", sub: "Copy the moves!", variant: "copy-pose", color: "from-[#e4dcff] to-[#b7a6ff]", soon: true },
];

export default function LearnHub() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] flex flex-col items-center justify-center gap-6 px-6">
      <Character state="happy" message="Pick a game to learn!" size={130} />
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {GAMES.map((g) => (
          <GameCard key={g.to} {...g} />
        ))}
      </div>
    </div>
  );
}