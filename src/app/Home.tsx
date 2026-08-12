import { Link } from "react-router-dom";
import { Character } from "../character/Character";
import { Illustration } from "../components/illustrations/Illustration";
import type { IllustrationVariant } from "../components/illustrations/Illustration";

const CATEGORIES: { id: string; title: string; sub: string; to: string; variant: IllustrationVariant; color: string; ring: string }[] = [
  { id: "learn", title: "Learn", sub: "Numbers & ABC", to: "/learn", variant: "learn", color: "from-[#ffd1e8] to-[#ff9db8]", ring: "hover:ring-[#ff6b9d]" },
  { id: "move", title: "Move", sub: "Play with your body", to: "/move", variant: "move", color: "from-[#c9f0e0] to-[#7ee8c4]", ring: "hover:ring-[#06d6a0]" },
  { id: "music", title: "Music", sub: "Make sound", to: "/music", variant: "music", color: "from-[#e4dcff] to-[#b7a6ff]", ring: "hover:ring-[#6d5cff]" },
  { id: "create", title: "Create", sub: "Imagine & draw", to: "/create", variant: "create", color: "from-[#ffe9c9] to-[#ffd166]", ring: "hover:ring-[#f5a623]" },
];

export default function Home() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#f3ecff] flex flex-col items-center justify-center gap-6 px-5">
      {/* playful floating background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-8 h-6 w-6 rounded-full bg-[#ffd166] opacity-40 animate-bounce" />
        <div className="absolute top-24 right-12 h-4 w-4 rounded-full bg-[#ff9db8] opacity-50 animate-pulse" />
        <div className="absolute bottom-24 left-10 h-5 w-5 rounded-full bg-[#06d6a0] opacity-40 animate-bounce" style={{ animationDelay: "0.4s" }} />
        <div className="absolute bottom-16 right-16 h-7 w-7 rounded-full bg-[#6d5cff] opacity-30 animate-pulse" style={{ animationDelay: "0.2s" }} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <Character state="happy" message="Hi! Let's play 👋" size={150} />
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to={c.to}
            className={`group relative rounded-[2rem] overflow-hidden bg-gradient-to-br ${c.color} p-5 flex flex-col items-center text-center shadow-md hover:shadow-2xl hover:scale-[1.03] hover:-rotate-1 transition-all ring-0 ${c.ring}`}
          >
            <Illustration variant={c.variant} className="w-28 h-28 group-hover:scale-110 group-hover:-rotate-3 transition-transform drop-shadow-md" />
            <span className="mt-2 text-2xl font-extrabold text-white drop-shadow-sm">{c.title}</span>
            <span className="text-xs font-semibold text-white/85">{c.sub}</span>
          </Link>
        ))}
      </div>

    </div>
  );
}