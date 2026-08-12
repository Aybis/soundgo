import type { MayaState } from "../../character/types";
import { audio } from "../audio/AudioEngine";
import { voice } from "../voice/VoiceService";

export type FeedbackKind = "success" | "error" | "encourage" | "info" | "celebration";

export interface FeedbackRequest {
  message: string;
  kind: FeedbackKind;
  voice?: boolean;     // speak the message
  confetti?: boolean;  // burst confetti
  character?: MayaState;
  sfx?: "success" | "error" | "click" | "tick" | "sparkle" | "whoosh";
}

export interface RenderedFeedback extends FeedbackRequest {
  id: number;
}

export interface FeedbackManagerArgs {
  onFeedback?: (f: RenderedFeedback) => void;
  speakText?: boolean; // default true — speak voice-enabled messages
}

/**
 * Single place for game feedback. Channels: visual banner, sound effect,
 * character mood, voice, confetti. Games call feedback.success({...}) and
 * never hand-roll their own feedback plumbing.
 */
export class FeedbackManager {
  private onFeedback?: (f: RenderedFeedback) => void;
  private speakText: boolean;
  private seq = 0;

  constructor(args: FeedbackManagerArgs = {}) {
    this.onFeedback = args.onFeedback;
    this.speakText = args.speakText ?? true;
  }

  subscribe(cb: (f: RenderedFeedback) => void) {
    this.onFeedback = cb;
  }

  private fire(req: FeedbackRequest) {
    const id = ++this.seq;
    this.onFeedback?.({ ...req, id });
    if (req.sfx) audio().sfx(req.sfx);
    if (req.voice && this.speakText) void voice().speak(req.message);
  }

  success(message: string, opts: Partial<FeedbackRequest> = {}) {
    this.fire({ message, kind: "success", character: "celebrating", sfx: "success", ...opts });
  }

  celebrate(message: string, opts: Partial<FeedbackRequest> = {}) {
    this.fire({ message, kind: "celebration", character: "celebrating", sfx: "sparkle", confetti: true, ...opts });
  }

  error(message: string, opts: Partial<FeedbackRequest> = {}) {
    this.fire({ message, kind: "error", character: "confused", sfx: "error", ...opts });
  }

  encourage(message: string, opts: Partial<FeedbackRequest> = {}) {
    this.fire({ message, kind: "encourage", character: "encouraging", sfx: "click", ...opts });
  }

  info(message: string, opts: Partial<FeedbackRequest> = {}) {
    this.fire({ message, kind: "info", character: "watching", ...opts });
  }
}

let shared: FeedbackManager | null = null;
export function feedback(): FeedbackManager {
  if (!shared) shared = new FeedbackManager();
  return shared;
}