// Finger Math content — configuration-driven, no question logic in the UI.

export interface FingerPrompt {
  text: string;     // what MAYA says / shows
  answer: number;   // expected number of fingers
}

export interface FingerLevel {
  id: number;
  label: string;      // shown in HUD
  count: number;      // questions in this level
  generate: () => FingerPrompt[];
}

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export const FINGER_LEVELS: FingerLevel[] = [
  {
    id: 1,
    label: "1–5",
    count: 5,
    generate: () =>
      Array.from({ length: 5 }, () => {
        const n = rand(1, 5);
        return { text: `Show me ${word(n)} finger${n === 1 ? "" : "s"}!`, answer: n };
      }),
  },
  {
    id: 2,
    label: "1–10",
    count: 5,
    generate: () =>
      Array.from({ length: 5 }, () => {
        const n = rand(1, 10);
        return { text: `Show me ${word(n)} finger${n === 1 ? "" : "s"}!`, answer: n };
      }),
  },
  {
    id: 3,
    label: "+",
    count: 5,
    generate: () =>
      Array.from({ length: 5 }, () => {
        const a = rand(1, 5), b = rand(1, 5);
        return { text: `${a} + ${b} = ?`, answer: a + b };
      }),
  },
  {
    id: 4,
    label: "−",
    count: 5,
    generate: () => {
      const prompts: FingerPrompt[] = [];
      while (prompts.length < 5) {
        const a = rand(3, 9), b = rand(1, a - 1);
        prompts.push({ text: `${a} − ${b} = ?`, answer: a - b });
      }
      return prompts;
    },
  },
];

// friendly number words for the count levels
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
function word(n: number): string {
  return WORDS[n] ?? String(n);
}

export function fingerLevel(id: number): FingerLevel {
  return FINGER_LEVELS.find((l) => l.id === id) ?? FINGER_LEVELS[0];
}