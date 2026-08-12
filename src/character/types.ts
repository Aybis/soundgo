// Character state engine types. MAYA reacts to the game through these states.

export type MayaState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "watching"
  | "happy"
  | "excited"
  | "celebrating"
  | "encouraging"
  | "surprised"
  | "confused"
  | "waiting";

export type CharacterEvent = (state: MayaState, message?: string) => void;

/** Character renderers implement this so Live2D/Lottie/Rive can drop in later. */
export interface CharacterRenderer {
  /** Render the current state. Returns a JSX node (or null for a non-React renderer). */
  render(state: MayaState, message?: string): React.ReactNode;
  setMood?(state: MayaState): void;
}