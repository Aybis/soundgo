// Grab the Answer content — one generic quiz engine, many subjects.
// Options are rendered as text, emoji, or a color swatch depending on `kind`.

export type OptionKind = "text" | "emoji" | "color" | "image";

export interface GrabOption {
  label: string;
  kind: OptionKind;
  /** Stable answer identity that survives option shuffling. */
  correct?: boolean;
  value?: string; // for "color" kind, a CSS color
  animalId?: string;
  imageAlt?: string;
  imageSrc?: string;
  /** Zero-based cell in a five-column horizontal sprite sheet. */
  imageIndex?: number;
  imageSize?: string;
  imagePosition?: string;
  emoji?: string;
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

const ANIMAL_VISUALS: Record<string, string> = {
  Cat: "cat",
  Dog: "dog",
  Cow: "cow",
  Duck: "duck",
  Lion: "lion",
};
const ANIMAL_IMAGES: Record<string, { index: number; size: string; position: string }> = {
  Cat: { index: 0, size: "612% 100%", position: "0% 50%" },
  Dog: { index: 1, size: "467% 100%", position: "20.5% 50%" },
  Cow: { index: 2, size: "395% 100%", position: "48.7% 50%" },
  Duck: { index: 3, size: "668% 100%", position: "72.5% 50%" },
  Lion: { index: 4, size: "408% 100%", position: "100% 50%" },
};
const FOOD_IMAGES: Record<string, { index: number; size: string; position: string }> = {
  APPLE: { index: 0, size: "513% 100%", position: "0% 50%" },
  BANANA: { index: 1, size: "547% 100%", position: "26.8% 50%" },
  GRAPES: { index: 2, size: "483% 100%", position: "50% 50%" },
  CARROT: { index: 3, size: "547% 100%", position: "74.2% 50%" },
  CAKE: { index: 4, size: "496% 100%", position: "100% 50%" },
};
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function buildQuestion(prompt: string, options: GrabOption[]): GrabQuestion {
  const shuffled = shuffle(options);
  const answerIndex = shuffled.findIndex((option) => option.correct === true);
  if (answerIndex < 0) throw new Error(`Grab question has no correct answer: ${prompt}`);
  return { prompt, options: shuffled, answerIndex };
}

/** Resolve the answer by stable identity, with index fallback for saved/legacy data. */
export function correctGrabOption(question: GrabQuestion): GrabOption | undefined {
  return question.options.find((option) => option.correct === true) ?? question.options[question.answerIndex];
}

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
        const wrong = shuffle([answer - 3, answer - 2, answer - 1, answer + 1, answer + 2, answer + 3]
          .filter((value) => value >= 1)).slice(0, 2);
        return buildQuestion(`What is ${a} + ${b}?`, [
          { label: String(answer), kind: "text", correct: true },
          { label: String(wrong[0]), kind: "text", correct: false },
          { label: String(wrong[1]), kind: "text", correct: false },
        ]);
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
        return buildQuestion(`Which one is ${target[0].toUpperCase()}?`, [target, ...others].map(([label, value]) => ({
          label,
          kind: "color",
          value,
          correct: label === target[0],
        })));
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
        const options = [target, ...others].map(([label, emoji]) => ({
          label,
          kind: "image" as const,
          correct: label === target[0],
          emoji,
          animalId: ANIMAL_VISUALS[label],
          imageAlt: `${label} animal`,
          imageSrc: "/answer-images/animals-v1.png",
          imageIndex: ANIMAL_IMAGES[label].index,
          imageSize: ANIMAL_IMAGES[label].size,
          imagePosition: ANIMAL_IMAGES[label].position,
        }));
        const promptByAnimal: Record<string, string> = {
          Cat: "Which animal has soft fur, whiskers, and likes to meow?",
          Dog: "Which animal barks, loves people, and likes to play?",
          Cow: "Which animal is black and white, lives on a farm, and says moo?",
          Duck: "Which animal has a beak, likes to swim, and says quack?",
          Lion: "Which animal has a big mane and is called the king of the jungle?",
        };
        return buildQuestion(promptByAnimal[target[0]], options);
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
        return buildQuestion(`Find the ${target[0].toLowerCase()}!`, [target, ...others].map(([label, emoji]) => ({
          label: `${emoji} ${label}`,
          kind: "emoji",
          correct: label === target[0],
        })));
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
        const options = [target, ...others].map(([label, emoji]) => ({
          label,
          kind: "image" as const,
          correct: label === target[0],
          emoji,
          imageAlt: `${label.toLowerCase()} food`,
          imageSrc: "/answer-images/foods-v1.png",
          imageIndex: FOOD_IMAGES[label].index,
          imageSize: FOOD_IMAGES[label].size,
          imagePosition: FOOD_IMAGES[label].position,
        }));
        return buildQuestion(`Which one is ${target[0]}?`, options);
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
