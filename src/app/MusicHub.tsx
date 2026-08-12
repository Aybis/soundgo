import { Link } from "react-router-dom";
import { Character } from "../character/Character";

const GAMES = [
  { to: "/music/air-piano", emoji: "🎹", title: "Air Piano", sub: "Wave to play notes!" },
  { to: "/music/air-drums", emoji: "🥁", title: "Air Drums", sub: "Hit the invisible drums!" },
  { to: "/music/beat", emoji: "👏", title: "Follow the Beat", sub: "Clap along!" },
];

export default function MusicHub() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] flex flex-col items-center justify-center gap-6 px-6">
      <Character state="excited" message="Let's make music!" size={130} />
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {GAMES.map((g) => (
          <Link
            key={g.to}
            to={g.to}
            className="group rounded-3xl bg-white/80 border border-[#eadff5] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-5 flex flex-col items-center text-center"
          >
            <span className="text-4xl mb-2">{g.emoji}</span>
            <span className="font-bold text-[#3a3352]">{g.title}</span>
            <span className="text-xs text-[#8a7f9e] mt-1">{g.sub}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}