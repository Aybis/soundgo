import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import MusicPage from "./pages/MusicPage";
import InteractionPage from "./pages/InteractionPage";
import PlayPage from "./pages/PlayPage";

function Nav() {
  return (
    <nav className="absolute top-4 right-4 z-40 flex items-center gap-1 rounded-full bg-black/50 border border-white/10 backdrop-blur px-1.5 py-1">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `px-3 py-1 rounded-full text-xs transition-colors ${
            isActive ? "bg-[#6d5cff] text-white" : "text-zinc-300 hover:text-white"
          }`
        }
      >
        soundgo
      </NavLink>
      <NavLink
        to="/interact"
        className={({ isActive }) =>
          `px-3 py-1 rounded-full text-xs transition-colors ${
            isActive ? "bg-[#6d5cff] text-white" : "text-zinc-300 hover:text-white"
          }`
        }
      >
        interact
      </NavLink>
      <NavLink
        to="/play"
        className={({ isActive }) =>
          `px-3 py-1 rounded-full text-xs transition-colors ${
            isActive ? "bg-[#6d5cff] text-white" : "text-zinc-300 hover:text-white"
          }`
        }
      >
        play
      </NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<MusicPage />} />
        <Route path="/interact" element={<InteractionPage />} />
        <Route path="/play" element={<PlayPage />} />
      </Routes>
    </BrowserRouter>
  );
}