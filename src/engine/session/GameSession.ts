import { GameStateMachine } from "./GameStateMachine";
import type { GameState } from "./GameStateMachine";
import { FeedbackManager } from "../feedback/FeedbackManager";
import type { RenderedFeedback } from "../feedback/FeedbackManager";

export interface GameSessionOptions {
  total?: number;          // e.g. total questions / reps
  speak?: boolean;
  onState?: (s: GameState) => void;
  onFeedback?: (f: RenderedFeedback) => void;
}

/**
 * Shared activity session. Owns the state machine, score, attempts, level and
 * a FeedbackManager wired to whichever channels the host provides. Activities
 * extend this instead of re-implementing scoring/feedback/flow.
 */
export class GameSession {
  readonly fsm: GameStateMachine;
  readonly feedback: FeedbackManager;

  score = 0;
  attempts = 0;
  correct = 0;
  streak = 0;            // correct answers in a row
  longestStreak = 0;
  level = 1;
  total: number;

  private onState?: (s: GameState) => void;

  constructor(opts: GameSessionOptions = {}) {
    this.total = opts.total ?? 10;
    this.onState = opts.onState;
    this.feedback = new FeedbackManager({ onFeedback: opts.onFeedback, speakText: opts.speak ?? true });
    this.fsm = new GameStateMachine((s) => this.onState?.(s), "loading");
  }

  /** Kick off the standard flow: calibration → intro. */
  begin() {
    this.fsm.set("calibration");
    this.fsm.set("intro");
  }

  /** Give the child an instruction and wait for their response. */
  ask(message: string, extra: Partial<Parameters<FeedbackManager["info"]>[1]> = {}) {
    this.fsm.set("waiting");
    this.feedback.info(message, { character: "waiting", ...extra });
  }

  /** A correct answer: score it and celebrate. */
  correctNow(message = "Great!", extra: Partial<Parameters<FeedbackManager["success"]>[1]> = {}) {
    this.attempts++;
    this.correct++;
    this.streak++;
    if (this.streak > this.longestStreak) this.longestStreak = this.streak;
    this.score += 100;
    this.fsm.set("success");
    this.feedback.success(message, { character: "celebrating", ...extra });
  }

  /** A wrong answer: encourage and retry. */
  wrongNow(message = "Try again!", extra: Partial<Parameters<FeedbackManager["encourage"]>[1]> = {}) {
    this.attempts++;
    this.streak = 0;
    this.fsm.set("retry");
    this.feedback.encourage(message, { character: "encouraging", ...extra });
  }

  /** Level complete — strong celebration. */
  celebrate(message = "You did it!") {
    this.fsm.set("celebration");
    this.feedback.celebrate(message);
  }

  complete() {
    this.fsm.set("complete");
  }

  next() {
    this.level++;
    this.fsm.set("next");
    this.fsm.set("waiting");
  }

  accuracy(): number {
    return this.attempts ? Math.round((this.correct / this.attempts) * 100) : 0;
  }
}

let shared: GameSession | null = null;
/** A default session singleton for quick demos. Most activities create their own. */
export function session(): GameSession {
  if (!shared) shared = new GameSession();
  return shared;
}