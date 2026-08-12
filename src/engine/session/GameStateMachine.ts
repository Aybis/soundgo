// Reusable game state machine. Every activity shares the same lifecycle.

export type GameState =
  | "loading"
  | "calibration"
  | "intro"
  | "instruction"
  | "waiting"
  | "detecting"
  | "success"
  | "retry"
  | "celebration"
  | "next"
  | "complete"
  | "paused";

export class GameStateMachine {
  private state: GameState;
  private onchange: (s: GameState, prev: GameState) => void;

  constructor(onchange: (s: GameState, prev: GameState) => void, initial: GameState = "loading") {
    this.state = initial;
    this.onchange = onchange;
  }

  get current() { return this.state; }

  set(s: GameState) {
    if (s === this.state) return;
    const prev = this.state;
    this.state = s;
    this.onchange(s, prev);
  }
}