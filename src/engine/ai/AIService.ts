import type { AIService } from "./types";
import { MockAIService } from "./providers/MockAIService";

let current: AIService | null = null;

/** Get the active AI service (defaults to the offline MockAIService). */
export function ai(): AIService {
  if (!current) current = new MockAIService();
  return current;
}

/** Swap in a different provider (e.g. a real LLM backend) at runtime. */
export function setAIProvider(service: AIService) {
  current = service;
}