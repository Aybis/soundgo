import { Link } from "react-router-dom";
import { Character } from "../character/Character";
import { ActivityTile } from "../components/ui/ActivityTile";
import type { IllustrationVariant } from "../components/illustrations/Illustration";

const GAMES: { to: string; title: string; variant: IllustrationVariant; color: string; sub?: string; soon?: boolean }[] = [
  { to: "/learn/finger-math", title: "Finger Math", variant: "finger-math", color: "from-[#7cc4ff] to-[#3b9ef5]", sub: "Show the right number!" },
  { to: "/learn/grab-answer", title: "Grab the Answer", variant: "grab-answer", color: "from-[#ffb36b] to-[#ff8c42]", sub: "Point & pinch!" },
  { to: "/learn/air-writing", title: "Air Writing", variant: "air-writing", color: "from-[#7ee8c4] to-[#06d6a0]", sub: "Trace letters", soon: true },
  { to: "/learn/simon", title: "Simon Says", variant: "copy-pose", color: "from-[#b7a6ff] to-[#6d5cff]", sub: "Copy the moves", soon: true },
];

export default function LearnHub() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#e7f4ff] to-[#eef2ff] flex flex-col items-center justify-center gap-6 px-6">
      <Link to="/" className="absolute top-5 left-5 z-20 px-4 py-2 rounded-full bg-white/80 border border-[#dbeafe] text-[#3a3352] text-sm font-medium hover:bg-white">← Home</Link>
      <Character state="happy" message="Pick a game to learn!" size={130} />
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {GAMES.map((g) => g.soon ? (
          <div key={g.to} className={`rounded-[2.2rem] bg-gradient-to-br ${g.color} p-4 flex flex-col items-center text-center opacity-40 grayscale cursor-not-allowed`}>
            <IllustrationMini g={g} />
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

import { Illustration } from "../components/illustrations/Illustration";
function IllustrationMini({ g }: any) { return <Illustration variant={g.variant} className="w-24 h-24" />; }