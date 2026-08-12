import { useEffect, useState } from "react";
import { voice } from "../engine/voice/VoiceService";

export interface Settings {
  nickname: string;
  ageRange: string;
  voiceOn: boolean;
  musicVolume: number;   // 0..1
  effectsVolume: number; // 0..1
  cameraQuality: "auto" | "low" | "medium" | "high";
  sessionMinutes: number; // 0 = unlimited
  completedActivities: string[];
}

const DEFAULT: Settings = {
  nickname: "Explorer",
  ageRange: "4-6",
  voiceOn: true,
  musicVolume: 0.7,
  effectsVolume: 0.8,
  cameraQuality: "auto",
  sessionMinutes: 0,
  completedActivities: [],
};

const KEY = "maya-kids-settings-v1";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveSettings(s: Settings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function resetSettings(): Settings {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return { ...DEFAULT };
}

/** React binding to persistent settings. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
    // side effects: apply voice mute + audio volumes
    voice().setMuted(!settings.voiceOn);
  }, [settings]);

  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  const reset = () => setSettings(resetSettings());

  return { settings, update, reset };
}

/** Mark an activity as completed (for local progress). */
export function markCompleted(activity: string, done = true) {
  const s = loadSettings();
  const set = new Set(s.completedActivities);
  if (done) set.add(activity);
  else set.delete(activity);
  saveSettings({ ...s, completedActivities: [...set] });
}