import { describe, it, expect } from "vitest";
import { MockAIService } from "./providers/MockAIService";
import type { FeedbackContext, LessonContext } from "./types";

const svc = new MockAIService();
const ctx = (over: Partial<FeedbackContext> = {}): FeedbackContext => ({
  game: "finger-math", correct: true, streak: 1, attempts: 1, level: 1, score: 100, ...over,
});

describe("MockAIService", () => {
  it("returns a warm line on correct answers", async () => {
    const line = await svc.encourage(ctx({ correct: true }));
    expect(line.length).toBeGreaterThan(0);
  });
  it("returns encouragement on wrong answers (not empty)", async () => {
    const line = await svc.encourage(ctx({ correct: false }));
    expect(line.length).toBeGreaterThan(0);
  });
  it("celebrates a streak of 3+", async () => {
    const line = await svc.encourage(ctx({ correct: true, streak: 4 }));
    expect(line).toMatch(/in a row|streak/i);
  });
  it("offers a hint when the child is stuck", async () => {
    const h = await svc.hint(ctx({ correct: false, attempts: 3 }));
    expect(h.length).toBeGreaterThan(5);
  });
  it("returns a lesson tip", async () => {
    const ctxL: LessonContext = { game: "finger-math", subject: "addition", level: 2, difficulty: "medium", lastScore: 200 };
    const l = await svc.lesson(ctxL);
    expect(l.length).toBeGreaterThan(5);
  });
  it("adapts difficulty up on high accuracy", async () => {
    expect(await svc.adaptDifficulty(0.9, 5)).toBe("hard");
    expect(await svc.adaptDifficulty(0.3, 0)).toBe("easy");
  });
});