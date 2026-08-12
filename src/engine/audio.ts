// Web Audio chord synthesizer. Builds/releases oscillators so chord changes
// glide smoothly (no clicks) via setTargetAtTime ramps.

export class ChordSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices: { osc: OscillatorNode; gain: GainNode }[] = [];
  private wave: OscillatorType = "sine";
  private volume = 0.5;
  private _running = false;

  get running() { return this._running; }

  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    this._running = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  setWave(w: OscillatorType) {
    this.wave = w;
    for (const v of this.voices) v.osc.type = w;
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03);
    }
  }

  // Play a chord. Pass empty array to silence.
  play(freqs: number[]) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    // fade out existing voices
    for (const v of this.voices) {
      v.gain.gain.setTargetAtTime(0, t, 0.02);
      v.osc.stop(t + 0.2);
    }
    this.voices = [];
    for (const f of freqs) {
      if (!isFinite(f) || f <= 0) continue;
      const osc = this.ctx.createOscillator();
      osc.type = this.wave;
      osc.frequency.value = f;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.setTargetAtTime(this.volume, t, 0.03);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      this.voices.push({ osc, gain });
    }
  }

  stop() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const v of this.voices) {
      v.gain.gain.setTargetAtTime(0, t, 0.03);
      v.osc.stop(t + 0.2);
    }
    this.voices = [];
  }
}