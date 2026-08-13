// Voice/TTS service. Provider-independent so game code never calls vendor APIs.
// MVP uses browser SpeechSynthesis; future adapters (ElevenLabs, OpenAI, ...) plug in.

export type VoiceLanguage = "id" | "en";

export interface VoiceOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  language?: VoiceLanguage;
}

export interface VoiceProvider {
  speak(text: string, opts?: VoiceOptions): Promise<void>;
  stop(): void;
  get supported(): boolean;
}

/** Browser SpeechSynthesis provider — free, no API key, offline-ish. */
export class BrowserVoiceProvider implements VoiceProvider {
  private synth: SpeechSynthesis | null =
    typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;

  get supported() { return !!this.synth; }

  speak(text: string, opts: VoiceOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) return resolve();
      this.synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = opts.rate ?? 1.05;
      u.pitch = opts.pitch ?? 1.1;
      const language = opts.language ?? "en";
      const lang = opts.lang ?? (language === "id" ? "id-ID" : "en-US");
      u.lang = lang;
      // Prefer a voice matching the chosen language, then fall back gracefully.
      const voices = this.synth.getVoices();
      const preferred = voices.find((v) => v.lang.toLowerCase().startsWith(language === "id" ? "id" : "en"));
      if (preferred) u.voice = preferred;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      this.synth.speak(u);
    });
  }

  stop() { this.synth?.cancel(); }
}

export class VoiceService {
  private provider: VoiceProvider;
  private muted = false;

  constructor(provider: VoiceProvider = new BrowserVoiceProvider()) {
    this.provider = provider;
  }

  get supported() { return this.provider.supported; }

  setMuted(m: boolean) { this.muted = m; if (m) this.stop(); }

  speak(text: string, opts?: VoiceOptions) {
    if (this.muted) return Promise.resolve();
    return this.provider.speak(text, opts);
  }

  stop() { this.provider.stop(); }
}

let shared: VoiceService | null = null;
export function voice(): VoiceService {
  if (!shared) shared = new VoiceService();
  return shared;
}