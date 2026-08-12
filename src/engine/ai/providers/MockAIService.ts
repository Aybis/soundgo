import type { AIService, FeedbackContext, LessonContext, Difficulty } from "../types";

// Template-driven "AI" — no network, works offline. It picks warm, varied,
// context-aware lines from the current feedback situation. Swap this class for
// a real LLM provider (same AIService interface) whenever you like.

const CORRECT_LINES = [
  "Amazing! 🌟",
  "You did it! 🎉",
  "So clever! 💜",
  "Wow, that was fast! 🚀",
  "You're a star! ⭐",
  "Perfect! 👏",
  "High five! 🖐️",
];

const WRONG_LINES = [
  "Almost — you've got this! 💪",
  "Nice try! Let's try again!",
  "So close! Keep going! 🌈",
  "Good effort! One more go!",
];

const STREAK_LINES = (n: number) => [
  `${n} in a row! You're on fire! 🔥`,
  `${n} correct — you're a superstar! ⭐`,
  `Wow, streak of ${n}! 🎉`,
];

const HINTS: Record<string, string[]> = {
  "finger-math": [
    "Count each finger slowly: one… two… three…",
    "Use both hands for numbers bigger than five!",
    "Put your fingers up one by one, nice and slow.",
  ],
  "grab-answer": [
    "Point to the answer you think is right, then pinch!",
    "Take a breath — you know this one!",
    "Look at all three, then pick your best guess.",
  ],
};

const LESSONS: Record<string, string[]> = {
  counting: [
    "Count out loud — your voice helps your brain!",
    "Touch each finger as you count it.",
    "Big to small: always count from the left.",
  ],
  addition: [
    "Adding means putting groups together.",
    "Count on from the bigger number: 5… 6… 7!",
    "Use your fingers to count the total!",
  ],
  subtraction: [
    "Taking away makes numbers smaller.",
    "Count backwards from the first number.",
    "How many are left? Count the rest!",
  ],
};

export class MockAIService implements AIService {
  async encourage(ctx: FeedbackContext): Promise<string> {
    if (ctx.correct) {
      if (ctx.streak >= 3) return pick(STREAK_LINES(ctx.streak));
      return pick(CORRECT_LINES);
    }
    return pick(WRONG_LINES);
  }

  async hint(ctx: FeedbackContext): Promise<string> {
    const pool = HINTS[ctx.game];
    if (!pool) return "Try counting it out loud, nice and slow!";
    // offer a different hint each time the child keeps missing
    return pool[ctx.attempts % pool.length];
  }

  async lesson(ctx: LessonContext): Promise<string> {
    const pool = LESSONS[ctx.subject] ?? LESSONS.counting;
    return pool[ctx.level % pool.length];
  }

  async adaptDifficulty(accuracy: number, streak: number): Promise<Difficulty> {
    if (accuracy >= 0.85 && streak >= 4) return "hard";
    if (accuracy >= 0.6) return "medium";
    return "easy";
  }
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}