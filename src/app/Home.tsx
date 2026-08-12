import { Link } from "react-router-dom";
import { useState } from "react";
import { Character } from "../character/Character";

const CATEGORIES = [
  { id: "learn", emoji: "🔢", title: "Learn", sub: "Numbers, ABC & more", to: "/learn" },
  { id: "move", emoji: "🏃", title: "Move", sub: "Play with your body", to: "/move" },
  { id: "music", emoji: "🎵", title: "Music", sub: "Make sound", to: "/music" },
  { id: "create", emoji: "🎨", title: "Create", sub: "Imagine & draw", to: "/create" },
];

export default function Home() {
  const [tip, setTip] = useState<string | null>(null);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] flex flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3">
        <Character state="happy" message="Hi! Let's play 👋" size={150} />
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to={c.to ?? "#"}
            onClick={(e) => {
              if (!c.to) {
                e.preventDefault();
                setTip(`${c.title} is coming soon!`);
                setTimeout(() => setTip(null), 1800);
              }
            }}
            className="group rounded-3xl bg-white/80 border border-[#eadff5] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-6 flex flex-col items-center text-center"
          >
            <span className="text-4xl mb-3">{c.emoji}</span>
            <span className="text-xl font-bold text-[#3a3352]">{c.title}</span>
            <span className="text-xs text-[#8a7f9e] mt-1">{c.sub}</span>
          </Link>
        ))}
      </div>

      {tip && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-[#6d5cff] text-white text-sm shadow-lg">
          {tip}
        </div>
      )}
    </div>
  );
}