import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./app/Home";
import LearnHub from "./app/LearnHub";
import MoveHub from "./app/MoveHub";
import CreateHub from "./app/CreateHub";
import MusicHub from "./app/MusicHub";
import MusicPage from "./pages/MusicPage";
import InteractionPage from "./pages/InteractionPage";
import PlayPage from "./pages/PlayPage";
import VisionLab from "./pages/VisionLab";
import FingerMathGame from "./activities/learn/finger-math/FingerMathGame";
import GrabAnswerGame from "./activities/learn/grab-answer/GrabAnswerGame";
import CopyPoseGame from "./activities/move/copy-pose/CopyPoseGame";
import SquatGame from "./activities/move/squat/SquatGame";
import BalanceGame from "./activities/move/balance/BalanceGame";
import AirWritingGame from "./activities/create/air-writing/AirWritingGame";
import AirPianoPage from "./activities/music/air-piano/AirPianoPage";
import AirDrumsPage from "./activities/music/air-drums/AirDrumsPage";
import FollowBeatPage from "./activities/music/beat/FollowBeatPage";

const LINKS = [
  { to: "/", label: "home" },
  { to: "/music", label: "music" },
  { to: "/interact", label: "interact" },
  { to: "/play", label: "play" },
  { to: "/lab", label: "lab" },
];

function Nav() {
  return (
    <nav className="absolute top-4 right-4 z-40 flex items-center gap-1 rounded-full bg-black/50 border border-white/10 backdrop-blur px-1.5 py-1">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === "/"}
          className={({ isActive }) =>
            `px-3 py-1 rounded-full text-xs transition-colors ${
              isActive ? "bg-[#6d5cff] text-white" : "text-zinc-300 hover:text-white"
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/studio" element={<MusicPage />} />
        <Route path="/interact" element={<InteractionPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/lab" element={<VisionLab />} />
        <Route path="/learn" element={<LearnHub />} />
        <Route path="/learn/finger-math" element={<FingerMathGame />} />
        <Route path="/learn/grab-answer" element={<GrabAnswerGame />} />
        <Route path="/move" element={<MoveHub />} />
        <Route path="/move/copy-pose" element={<CopyPoseGame />} />
        <Route path="/move/squat" element={<SquatGame />} />
        <Route path="/move/balance" element={<BalanceGame />} />
        <Route path="/create" element={<CreateHub />} />
        <Route path="/create/air-writing" element={<AirWritingGame />} />
        <Route path="/music" element={<MusicHub />} />
        <Route path="/music/air-piano" element={<AirPianoPage />} />
        <Route path="/music/air-drums" element={<AirDrumsPage />} />
        <Route path="/music/beat" element={<FollowBeatPage />} />
      </Routes>
    </BrowserRouter>
  );
}