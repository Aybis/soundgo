import { Link } from "react-router-dom";
import { Character } from "../character/Character";
import { ActivityTile } from "../components/ui/ActivityTile";
import { KidsButton } from "../components/ui/KidsButton";

export default function Home() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] via-[#fdf0ff] to-[#eef2ff]">
      {/* playful floating background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-8 left-10 h-8 w-8 rounded-full bg-[#ffd166] opacity-40 anim-floaty" />
        <div className="absolute top-20 right-14 h-5 w-5 rounded-full bg-[#ff9db8] opacity-50 anim-floaty" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-24 left-12 h-6 w-6 rounded-full bg-[#06d6a0] opacity-40 anim-floaty" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-16 right-16 h-9 w-9 rounded-full bg-[#6d5cff] opacity-25 anim-floaty" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/3 left-1/4 h-4 w-4 rounded-full bg-[#b7a6ff] opacity-40 anim-floaty" style={{ animationDelay: "0.8s" }} />
        <div className="absolute top-1/2 right-1/4 h-4 w-4 rounded-full bg-[#ffd166] opacity-40 anim-floaty" style={{ animationDelay: "2s" }} />
      </div>

      {/* hero */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-5 px-5">
        {/* logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight text-[#3a3352]">MAYA</span>
          <span className="px-2 py-0.5 rounded-full bg-[#6d5cff]/10 text-[#6d5cff] text-xs font-extrabold tracking-widest">KIDS</span>
        </div>

        <Character state="happy" message="Hi, explorer! 👋" size={170} />

        <div className="text-center">
          <h1 className="text-4xl font-black text-[#3a3352]">What should we play?</h1>
          <p className="mt-1 text-sm font-semibold text-[#8a7f9e]">Move. Play. Learn.</p>
        </div>

        <KidsButton onClick={() => (window.location.href = "/onboarding")}>LET'S PLAY</KidsButton>

        {/* world grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-2">
          <ActivityTile to="/learn" title="Learn" variant="learn" color="from-[#7cc4ff] to-[#3b9ef5]" sub="Numbers & ABC" />
          <ActivityTile to="/move" title="Move" variant="move" color="from-[#7ee8c4] to-[#06d6a0]" sub="Play with your body" />
          <ActivityTile to="/music" title="Music" variant="music" color="from-[#b7a6ff] to-[#6d5cff]" sub="Make sound" />
          <ActivityTile to="/create" title="Create" variant="create" color="from-[#ffb36b] to-[#ff8c42]" sub="Imagine & draw" />
        </div>

        {/* discreet parent entry */}
        <Link to="/parent" className="mt-1 text-xs font-semibold text-[#b0a8c4] hover:text-[#6d5cff] transition-colors">
          👪 Parents
        </Link>
      </div>
    </div>
  );
}