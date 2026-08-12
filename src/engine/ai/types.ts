// AI service contract. Games talk to AIService, which is provider-agnostic —
// swap MockAIService for a real LLM backend later without touching game code.

export type Difficulty = "easy" | "medium" | "hard";

export interface FeedbackContext {
  game: string;          // e.g. "finger-math"
  correct: boolean;      // was this answer right?
  streak: number;        // current correct-in-a-row
  attempts: number;      // attempts on this question
  level: number;
  score: number;
}

export interface LessonContext {
  game: string;
  subject: string;       // e.g. "counting", "addition"
  level: number;
  difficulty: Difficulty;
  lastScore: number;
}

/** Everything a game needs from the AI layer. */
export interface AIService {
  /** A short, warm encouragement line for the current feedback situation. */
  encourage(ctx: FeedbackContext): Promise<string>;
  /** A child-friendly hint when the child is stuck. */
  hint(ctx: FeedbackContext): Promise<string>;
  /** A one-line lesson tip shown between questions. */
  lesson(ctx: LessonContext): Promise<string>;
  /** Suggest the next difficulty given performance. */
  adaptDifficulty(accuracy: number, streak: number): Promise<Difficulty>;
}