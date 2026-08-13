import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSettings } from "../state/settings";
import { KidsButton } from "../components/ui/KidsButton";

export default function ParentArea() {
  const navigate = useNavigate();
  const { settings, update, reset } = useSettings();
  const [unlocked, setUnlocked] = useState(false);

  // simple parent gate — a light confirmation (not real security for MVP)
  if (!unlocked) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-gradient-to-b from-[#fff6ec] to-[#eef2ff] flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="text-5xl">👪</div>
        <h1 className="text-2xl font-black text-[#3a3352]">Parents' Corner</h1>
        <p className="text-sm text-[#8a7f9e] max-w-sm">This area is for grown-ups to set up MAYA Kids for their child.</p>
        <KidsButton onClick={() => setUnlocked(true)}>I'm a parent</KidsButton>
        <button onClick={() => navigate("/")} className="text-xs underline text-[#8a7f9e]">← Back to play</button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-y-auto bg-gradient-to-b from-[#fff6ec] to-[#eef2ff] px-5 py-8">
      <div className="max-w-md mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-[#3a3352]">Parents' Corner</h1>
          <button onClick={() => navigate("/")} className="px-4 py-2 rounded-full bg-white border border-[#eadff5] text-sm text-[#3a3352] font-medium">← Back</button>
        </div>

        {/* privacy */}
        <div className="rounded-3xl bg-white/80 border border-[#eadff5] p-4">
          <h2 className="font-bold text-[#3a3352] mb-1">🔒 Privacy</h2>
          <p className="text-xs text-[#8a7f9e] leading-relaxed">
            Your camera helps MAYA see your child's moves. Everything runs on this device —
            we don't save or upload any video, photos, or faces.
          </p>
        </div>

        {/* child profile */}
        <div className="rounded-3xl bg-white/80 border border-[#eadff5] p-4 flex flex-col gap-3">
          <h2 className="font-bold text-[#3a3352]">🧒 Child profile</h2>
          <label className="flex flex-col gap-1 text-sm text-[#3a3352]">
            MAYA language / Bahasa MAYA
            <select value={settings.language} onChange={(e) => update({ language: e.target.value as "id" | "en" })}>
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#3a3352]">
            Nickname
            <input
              value={settings.nickname}
              onChange={(e) => update({ nickname: e.target.value })}
              className="rounded-xl border-2 border-[#eadff5] px-3 py-2 outline-none focus:border-[#6d5cff]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#3a3352]">
            Age range
            <select value={settings.ageRange} onChange={(e) => update({ ageRange: e.target.value })}>
              <option value="3-4">3–4</option>
              <option value="4-6">4–6</option>
              <option value="6-8">6–8</option>
              <option value="8-10">8–10</option>
            </select>
          </label>
        </div>

        {/* sound */}
        <div className="rounded-3xl bg-white/80 border border-[#eadff5] p-4 flex flex-col gap-3">
          <h2 className="font-bold text-[#3a3352]">🔊 Sound</h2>
          <Toggle label="MAYA's voice" on={settings.voiceOn} onChange={(v) => update({ voiceOn: v })} />
          <Slider label="Music" value={settings.musicVolume} onChange={(v) => update({ musicVolume: v })} />
          <Slider label="Effects" value={settings.effectsVolume} onChange={(v) => update({ effectsVolume: v })} />
        </div>

        {/* camera + session */}
        <div className="rounded-3xl bg-white/80 border border-[#eadff5] p-4 flex flex-col gap-3">
          <h2 className="font-bold text-[#3a3352]">📷 Camera & time</h2>
          <label className="flex flex-col gap-1 text-sm text-[#3a3352]">
            Quality
            <select value={settings.cameraQuality} onChange={(e) => update({ cameraQuality: e.target.value as any })}>
              <option value="auto">Auto</option>
              <option value="low">Low (faster)</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#3a3352]">
            Session limit
            <select value={String(settings.sessionMinutes)} onChange={(e) => update({ sessionMinutes: Number(e.target.value) })}>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
              <option value="0">Unlimited</option>
            </select>
          </label>
        </div>

        {/* progress */}
        <div className="rounded-3xl bg-white/80 border border-[#eadff5] p-4">
          <h2 className="font-bold text-[#3a3352] mb-2">🏆 Progress</h2>
          {settings.completedActivities.length === 0 ? (
            <p className="text-xs text-[#8a7f9e]">No activities completed yet.</p>
          ) : (
            <ul className="text-sm text-[#3a3352] space-y-1">
              {settings.completedActivities.map((a) => <li key={a}>✅ {a}</li>)}
            </ul>
          )}
        </div>

        <div className="flex gap-3">
          <Link to="/lab" className="flex-1 px-4 py-3 rounded-2xl bg-[#3a3352]/5 text-center text-sm text-[#8a7f9e] hover:bg-[#3a3352]/10">🛠 Developer Lab</Link>
          <button onClick={reset} className="flex-1 px-4 py-3 rounded-2xl bg-red-50 text-center text-sm text-red-500 hover:bg-red-100">Reset progress</button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="flex items-center justify-between w-full">
      <span className="text-sm text-[#3a3352]">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition-colors ${on ? "bg-[#06d6a0]" : "bg-[#eadff5]"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#3a3352] w-16">{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[#6d5cff]" />
    </div>
  );
}