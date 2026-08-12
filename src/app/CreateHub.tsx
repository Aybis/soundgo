import { Link } from "react-router-dom";
import { Character } from "../character/Character";

const GAMES = [
  { to: "/create/air-writing", emoji: "✍️", title: "Air Writing", sub: "Trace letters in the air!" },
  { to: "/create/sound-painting", emoji: "🎨", title: "Sound Painting", sub: "Draw music with your finger!", soon: true },
  { to: "/create/air-drawing", emoji: "🖌️", title: "Air Drawing", sub: "Free draw in the air!", soon: true },
];

export default function CreateHub() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] flex flex-col items-center justify-center gap-6 px-6">
      <Character state="excited" message="Let's create together!" size={130} />
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {GAMES.map((g) => (
          <Link
            key={g.to}
            to={g.to}
            onClick={(e) => { if (g.soon) e.preventDefault(); }}
            className={`group rounded-3xl bg-white/80 border border-[#eadff5] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-5 flex flex-col items-center text-center ${g.soon ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="text-4xl mb-2">{g.emoji}</span>
            <span className="font-bold text-[#3a3352]">{g.title}</span>
            <span className="text-xs text-[#8a7f9e] mt-1">{g.sub}</span>
            {g.soon && <span className="text-[10px] text-[#6d5cff] font-semibold mt-2">coming soon</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}