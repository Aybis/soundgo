import type { Language } from "../state/settings";

export interface ConversationCopy {
  prompt: string;
  speak: string;
  label: string;
  hint?: string;
}

export const ANIMAL_CONVERSATIONS: Record<string, ConversationCopy> = {
  cat: {
    prompt: "Hewan apa yang berbulu lembut, suka mengeong, dan suka mengejar bola?",
    speak: "Hewan apa yang berbulu lembut dan suka mengeong?",
    label: "Kucing",
    hint: "Cari hewan kecil dengan kumis!",
  },
  dog: {
    prompt: "Hewan apa yang suka menggonggong dan senang bermain dengan manusia?",
    speak: "Hewan apa yang suka menggonggong dan bermain dengan manusia?",
    label: "Anjing",
    hint: "Cari teman berbulu yang suka bilang guk guk!",
  },
  cow: {
    prompt: "Hewan apa yang warnanya hitam putih, tinggal di padang rumput, dan bilang moo?",
    speak: "Hewan apa yang warnanya hitam putih dan suka bilang moo?",
    label: "Sapi",
    hint: "Cari hewan besar dengan tanduk kecil!",
  },
  duck: {
    prompt: "Hewan apa yang punya paruh, suka berenang, dan bilang kwek kwek?",
    speak: "Hewan apa yang punya paruh dan suka berenang?",
    label: "Bebek",
    hint: "Cari hewan kecil dengan kaki berselaput!",
  },
  lion: {
    prompt: "Hewan apa yang punya surai besar dan disebut raja hutan?",
    speak: "Hewan apa yang punya surai besar dan disebut raja hutan?",
    label: "Singa",
    hint: "Cari hewan besar yang mengaum!",
  },
};

const ENGLISH: Record<string, ConversationCopy> = {
  cat: { prompt: "Which animal has soft fur, whiskers, and likes to meow?", speak: "Which animal has soft fur and likes to meow?", label: "Cat", hint: "Find the little animal with whiskers!" },
  dog: { prompt: "Which animal barks, loves people, and likes to play?", speak: "Which animal barks and loves to play with people?", label: "Dog", hint: "Find the furry friend who says woof!" },
  cow: { prompt: "Which animal is black and white, lives on a farm, and says moo?", speak: "Which animal is black and white and says moo?", label: "Cow", hint: "Find the big animal with little horns!" },
  duck: { prompt: "Which animal has a beak, likes to swim, and says quack?", speak: "Which animal has a beak and likes to swim?", label: "Duck", hint: "Find the little animal with webbed feet!" },
  lion: { prompt: "Which animal has a big mane and is called the king of the jungle?", speak: "Which animal has a big mane and roars?", label: "Lion", hint: "Find the big roaring animal!" },
};

export function animalConversation(id: string, language: Language): ConversationCopy {
  return language === "en" ? (ENGLISH[id] ?? ENGLISH.cat) : (ANIMAL_CONVERSATIONS[id] ?? ANIMAL_CONVERSATIONS.cat);
}

export function answerFeedback(language: Language, correct: boolean) {
  if (language === "en") return correct ? "Yes! You found it! Amazing!" : "Almost! Look carefully and try again!";
  return correct ? "Benar! Kamu menemukannya! Hebat!" : "Hampir! Lihat baik-baik dan coba lagi!";
}