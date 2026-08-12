// Air-writing stroke templates — normalized [0..1] polylines (y down).
// Forgiving: the child only needs to cover the skeleton, not match exactly.

export interface StrokeTemplate {
  id: string;
  label: string;      // the letter/number shown
  points: [number, number][];
}

export const STROKES: StrokeTemplate[] = [
  { id: "1", label: "1", points: [[0.5, 0.05], [0.5, 0.8], [0.2, 0.95], [0.8, 0.95]] },
  { id: "2", label: "2", points: [[0.7, 0.12], [0.3, 0.12], [0.3, 0.34], [0.7, 0.58], [0.7, 0.88], [0.3, 0.88]] },
  { id: "3", label: "3", points: [[0.3, 0.12], [0.7, 0.12], [0.7, 0.34], [0.33, 0.42], [0.7, 0.52], [0.7, 0.74], [0.3, 0.9]] },
  { id: "C", label: "C", points: [[0.7, 0.12], [0.3, 0.12], [0.3, 0.88], [0.7, 0.88]] },
  { id: "A", label: "A", points: [[0.1, 0.9], [0.5, 0.0], [0.9, 0.9], [0.28, 0.6], [0.72, 0.6]] },
  { id: "B", label: "B", points: [[0.4, 0.0], [0.4, 1.0], [0.75, 0.85], [0.4, 0.55], [0.75, 0.3], [0.4, 0.0]] },
];

export function strokeById(id: string): StrokeTemplate {
  return STROKES.find((s) => s.id === id) ?? STROKES[0];
}

// which strokes appear in each round set
export const WRITING_SETS = [
  { id: "abc", label: "ABC", strokes: ["A", "B", "C"] },
  { id: "123", label: "123", strokes: ["1", "2", "3"] },
];