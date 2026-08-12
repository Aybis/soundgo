// Single AudioContext for the whole app, with volume groups so music, sound
// effects and voice (TTS) never fight each other, and can be muted separately.

export type AudioGroup = "master" | "music" | "effects" | "voice";

export interface NoteOptions {
  type?: OscillatorType;
  duration?: number; // seconds
  volume?: number;   // 0..1 relative to group
  group?: AudioGroup;
  delay?: number;    // seconds before start
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private groups: Record<AudioGroup, GainNode> | null = null;
  private musicVoices: { osc: OscillatorNode; gain: GainNode }[] = [];

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    const master = this.ctx.createGain();
    master.gain.value = 0.9;
    master.connect(this.ctx.destination);
    const music = this.ctx.createGain(); music.connect(master);
    const effects = this.ctx.createGain(); effects.connect(master);
    const voice = this.ctx.createGain(); voice.connect(master);
    this.groups = { master, music, effects, voice };
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setVolume(group: AudioGroup, v: number) {
    if (this.ctx && this.groups) {
      this.groups[group].gain.setTargetAtTime(v, this.ctx.currentTime, 0.03);
    }
  }

  /** One-shot note (SFX / piano). */
  playNote(freq: number, opts: NoteOptions = {}) {
    if (!this.ctx || !this.groups || !isFinite(freq) || freq <= 0) return;
    const {
      type = "sine", duration = 0.3, volume = 0.5,
      group = "effects", delay = 0,
    } = opts;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.groups[group]);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  /** Play (or refresh) a sustained chord on the music group. */
  playChord(freqs: number[], volume = 0.5) {
    if (!this.ctx || !this.groups) return;
    const t = this.ctx.currentTime;
    for (const v of this.musicVoices) {
      v.gain.gain.setTargetAtTime(0, t, 0.02);
      v.osc.stop(t + 0.2);
    }
    this.musicVoices = [];
    for (const f of freqs) {
      if (!isFinite(f) || f <= 0) continue;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.setTargetAtTime(volume, t, 0.03);
      osc.connect(gain);
      gain.connect(this.groups.music);
      osc.start(t);
      this.musicVoices.push({ osc, gain });
    }
  }

  stopMusic() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const v of this.musicVoices) {
      v.gain.gain.setTargetAtTime(0, t, 0.03);
      v.osc.stop(t + 0.2);
    }
    this.musicVoices = [];
  }

  // ---- SFX presets ----
  sfx(name: "success" | "error" | "click" | "tick" | "sparkle" | "whoosh") {
    const base = 440;
    switch (name) {
      case "success":
        [0, 4, 7, 12].forEach((s, i) => this.playNote(freq(base, s), { duration: 0.25, delay: i * 0.07, type: "triangle", volume: 0.4 }));
        break;
      case "sparkle":
        [12, 19, 24].forEach((s, i) => this.playNote(freq(base, s), { duration: 0.2, delay: i * 0.05, type: "sine", volume: 0.35 }));
        break;
      case "error":
        this.playNote(freq(base, -5), { duration: 0.3, type: "sawtooth", volume: 0.25 });
        this.playNote(freq(base, -8), { duration: 0.35, delay: 0.12, type: "sawtooth", volume: 0.25 });
        break;
      case "click":
        this.playNote(660, { duration: 0.08, type: "square", volume: 0.2 });
        break;
      case "tick":
        this.playNote(880, { duration: 0.06, type: "sine", volume: 0.25 });
        break;
      case "whoosh":
        this.playNote(freq(base, 7), { duration: 0.4, type: "triangle", volume: 0.2 });
        break;
    }
  }
}

function freq(base: number, semitones: number): number {
  return base * Math.pow(2, semitones / 12);
}

/** Shared singleton so every game uses one AudioContext. */
let shared: AudioEngine | null = null;
export function audio(): AudioEngine {
  if (!shared) shared = new AudioEngine();
  return shared;
}