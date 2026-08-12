import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./app/Home";
import Onboarding from "./app/Onboarding";
import LearnHub from "./app/LearnHub";
import MoveHub from "./app/MoveHub";
import MusicHub from "./app/MusicHub";
import CreateHub from "./app/CreateHub";
import ParentArea from "./app/ParentArea";
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* child world */}
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Learn */}
        <Route path="/learn" element={<LearnHub />} />
        <Route path="/learn/finger-math" element={<FingerMathGame />} />
        <Route path="/learn/grab-answer" element={<GrabAnswerGame />} />

        {/* Move */}
        <Route path="/move" element={<MoveHub />} />
        <Route path="/move/copy-me" element={<CopyPoseGame />} />
        <Route path="/move/squat" element={<SquatGame />} />
        <Route path="/move/balance" element={<BalanceGame />} />

        {/* Music */}
        <Route path="/music" element={<MusicHub />} />
        <Route path="/music/air-piano" element={<AirPianoPage />} />
        <Route path="/music/air-drums" element={<AirDrumsPage />} />
        <Route path="/music/beat" element={<FollowBeatPage />} />

        {/* Create */}
        <Route path="/create" element={<CreateHub />} />
        <Route path="/create/air-draw" element={<AirWritingGame />} />

        {/* Parent + Lab */}
        <Route path="/parent" element={<ParentArea />} />
        <Route path="/lab" element={<VisionLab />} />

        {/* normalized aliases (spec routes) */}
        <Route path="/play/finger-math" element={<Navigate to="/learn/finger-math" replace />} />
        <Route path="/play/grab-answer" element={<Navigate to="/learn/grab-answer" replace />} />
        <Route path="/play/copy-me" element={<Navigate to="/move/copy-me" replace />} />
        <Route path="/play/squat" element={<Navigate to="/move/squat" replace />} />
        <Route path="/move/copy-pose" element={<Navigate to="/move/copy-me" replace />} />
        <Route path="/create/air-writing" element={<Navigate to="/create/air-draw" replace />} />

        {/* retired Soundgo demo pages → home */}
        <Route path="/studio" element={<Navigate to="/" replace />} />
        <Route path="/interact" element={<Navigate to="/" replace />} />
        <Route path="/play" element={<Navigate to="/learn" replace />} />

        {/* catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}