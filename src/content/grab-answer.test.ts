import { describe, expect, it } from "vitest";
import { animalConversation } from "./conversation";
import { correctGrabOption, GRAB_SUBJECTS } from "./grab-answer";

describe("Grab the Answer question keys", () => {
  it("keeps exactly one stable correct option after every shuffle", () => {
    for (let pass = 0; pass < 200; pass++) {
      for (const subject of GRAB_SUBJECTS) {
        for (const question of subject.generate()) {
          const markedCorrect = question.options.filter((option) => option.correct === true);

          expect(markedCorrect).toHaveLength(1);
          expect(question.answerIndex).toBeGreaterThanOrEqual(0);
          expect(question.options[question.answerIndex]).toBe(markedCorrect[0]);
          expect(correctGrabOption(question)).toBe(markedCorrect[0]);
          expect(new Set(question.options.map((option) => option.label)).size).toBe(question.options.length);
        }
      }
    }
  });

  it("uses the correct animal—not the first shuffled card—for the displayed prompt", () => {
    const animals = GRAB_SUBJECTS.find((subject) => subject.id === "animals")!;

    for (let pass = 0; pass < 200; pass++) {
      for (const question of animals.generate()) {
        const targetAnimal = correctGrabOption(question)?.animalId;
        expect(targetAnimal).toBeTruthy();
        expect(animalConversation(targetAnimal!, "en").prompt).toBe(question.prompt);
      }
    }
  });
});
