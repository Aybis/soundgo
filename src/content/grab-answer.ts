// Grab the Answer content — one generic quiz engine, many subjects.
// Options are rendered as text, emoji, or a color swatch depending on `kind`.

export type OptionKind = "text" | "emoji" | "color";

export interface GrabOption {
  label: string;
  kind: OptionKind;
  value?: string; // for "color" kind, a CSS color
}

export interface GrabQuestion {
  prompt: string;
  options: GrabOption[];
  answerIndex: number;
}

export interface GrabSubject {
  id: string;
  emoji: string;
  title: string;
  count: number;
  generate: () => GrabQuestion[];
}

const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const GRAB_SUBJECTS: GrabSubject[] = [
  {
    id: "math",
    emoji: "➗",
    title: "Math",
    count: 5,
    generate: () =>
      Array.from({ length: 5 }, () => {
        const a = rand(1, 5), b = rand(1, 5);
        const answer = a + b;
        const wrong = shuffle([answer + rand(1, 2), answer - rand(1, 2), answer + rand(2, 3)].map((n) => Math.max(1, n)));
        const options = shuffle([
          { label: String(answer), kind: "text" as const },
          { label: String(wrong[0]), kind: "text" as const },
          { label: String(wrong[1]), kind: "text" as const },
        ]);
        return { prompt: `What is ${a} + ${b}?`, options, answerIndex: options.findIndex((o) => o.label === String(answer)) };
      }),
  },
  {
    id: "colors",
    emoji: "🟥",
    title: "Colors",
    count: 5,
    generate: () => {
      const COLORS: [string, string][] = [["Red", "#ef4444"], ["Blue", "#3b82f6"], ["Green", "#22c55e"], ["Yellow", "#eab308"], ["Purple", "#a855f7"]];
      return Array.from({ length: 5 }, () => {
        const target = pick(COLORS);
        const others = shuffle(COLORS.filter((c) => c[0] !== target[0])).slice(0, 2);
        const options = shuffle([target, ...others].map(([label, value]) => ({ label, kind: "color" as const, value })));
        return { prompt: `Which one is ${target[0].toUpperCase()}?`, options, answerIndex: options.findIndex((o) => o.label === target[0]) };
      });
    },
  },
  {
    id: "animals",
    emoji: "🐱",
    title: "Animals",
    count: 5,
    generate: () => {
      const ANIMALS: [string, string, string][] = [["Cat", "🐱", "MEOW"], ["Dog", "🐶", "WOOF"], ["Cow", "🐮", "MOO"], ["Duck", "🦆", "QUACK"], ["Lion", "🦁", "ROAR"]];
      return Array.from({ length: 5 }, () => {
        const target = pick(ANIMALS);
        const others = shuffle(ANIMALS.filter((a) => a[0] !== target[0])).slice(0, 2);
        const options = shuffle([target, ...others].map(([label, emoji]) => ({ label: `${emoji} ${label}`, kind: "emoji" as const })));
        return { prompt: `Which animal says ${target[2]}?`, options, answerIndex: options.findIndex((o) => o.label.includes(target[0])) };
      });
    },
  },
  {
    id: "shapes",
    emoji: "🔺",
    title: "Shapes",
    count: 5,
    generate: () => {
      const SHAPES: [string, string][] = [["Circle", "⭕"], ["Triangle", "🔺"], ["Square", "🟦"], ["Star", "⭐"], ["Heart", "❤️"]];
      return Array.from({ length: 5 }, () => {
        const target = pick(SHAPES);
        const others = shuffle(SHAPES.filter((s) => s[0] !== target[0])).slice(0, 2);
        const options = shuffle([target, ...others].map(([label, emoji]) => ({ label: `${emoji} ${label}`, kind: "emoji" as const })));
        return { prompt: `Find the ${target[0].toLowerCase()}!`, options, answerIndex: options.findIndex((o) => o.label.includes(target[0])) };
      });
    },
  },
  {
    id: "vocab",
    emoji: "🍎",
    title: "Words",
    count: 5,
    generate: () => {
      const WORDS: [string, string][] = [["APPLE", "🍎"], ["BANANA", "🍌"], ["GRAPES", "🍇"], ["CARROT", "🥕"], ["CAKE", "🍰"]];
      return Array.from({ length: 5 }, () => {
        const target = pick(WORDS);
        const others = shuffle(WORDS.filter((w) => w[0] !== target[0])).slice(0, 2);
        const options = shuffle([target, ...others].map(([label, emoji]) => ({ label: `${emoji} ${label}`, kind: "emoji" as const })));
        return { prompt: `Which one is ${target[0]}?`, options, answerIndex: options.findIndex((o) => o.label.includes(target[0])) };
      });
    },
  },
];

export function grabSubject(id: string): GrabSubject {
  return GRAB_SUBJECTS.find((s) => s.id === id) ?? GRAB_SUBJECTS[0];
}

/**
 * A mixed session: 8 questions sampled across numbers/colors/shapes/animals
 * (one per subject category, shuffled). Used for the "adventure" mode so the
 * child gets variety instead of a single-subject grind.
 */
export function generateMixedSession(count = 8): GrabQuestion[] {
  const subjects = ["math", "colors", "shapes", "animals"];
  const pool: GrabQuestion[] = [];
  for (const id of subjects) {
    const qs = grabSubject(id).generate();
    // take a random question from each subject, keep the pool varied
    for (const q of qs) pool.push(q);
  }
  const shuffled = shuffle(pool);
  return shuffled.slice(0, count);
}