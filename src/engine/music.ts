// Music theory primitives: notes, chords, scales, frequencies.

export const CHROMATIC = ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#"];
export const NATURALS  = ["A","B","C","D","E","F","G"];

// semitone offset from root (0 = root)
export interface ChordDef { name: string; intervals: number[]; }

export const CHORDS: ChordDef[] = [
  { name: "maj",   intervals: [0, 4, 7] },
  { name: "min",   intervals: [0, 3, 7] },
  { name: "aug",   intervals: [0, 4, 8] },
  { name: "dim",   intervals: [0, 3, 6] },
  { name: "7",     intervals: [0, 4, 7, 10] },
  { name: "m7",    intervals: [0, 3, 7, 10] },
  { name: "maj7",  intervals: [0, 4, 7, 11] },
  { name: "sus4",  intervals: [0, 5, 7] },
  { name: "sus2",  intervals: [0, 2, 7] },
];

export const SCALES: Record<string, number[]> = {
  Major:     [0, 2, 4, 5, 7, 9, 11],
  Pentatonic:[0, 2, 4, 7, 9],
  Minor:     [0, 2, 3, 5, 7, 8, 10],
  Blues:     [0, 3, 5, 6, 7, 10],
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export const WAVES = ["sine", "triangle", "sawtooth", "square"] as const;
export type Wave = typeof WAVES[number];
export const RANGES = [2, 3, 4];

export const SCALE_NAMES = Object.keys(SCALES);

// A4 = MIDI 69 = 440 Hz
export const A4_MIDI = 69;
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - A4_MIDI) / 12);
}

// base MIDI for a given octave range (2 → A3, 3 → A4, 4 → A5)
export function rangeBaseMidi(rangeOct: number): number {
  return 57 + (rangeOct - 2) * 12; // A3 = 57
}

// semitone offset for a natural/letter note (A=0, B=2, C=3, ...)
export function letterToSemitone(letter: string): number {
  const idx = NATURALS.indexOf(letter);
  return idx === -1 ? 0 : [0, 2, 4, 5, 7, 9, 11][idx];
}

// does a semitone belong to the given scale (rooted at C)?
export function inScale(semitone: number, scaleName: string): boolean {
  const scale = SCALES[scaleName];
  if (!scale) return true;
  const degree = ((semitone % 12) + 12) % 12;
  return scale.includes(degree);
}

// nearest scale semitone to a given semitone (rooted at C)
export function snapToScale(semitone: number, scaleName: string): number {
  const scale = SCALES[scaleName];
  if (!scale || scaleName === "Chromatic") return semitone;
  const degree = ((semitone % 12) + 12) % 12;
  let best = degree, bestDist = 12;
  for (const s of scale) {
    const d = Math.min(Math.abs(degree - s), 12 - Math.abs(degree - s));
    if (d < bestDist) { bestDist = d; best = s; }
  }
  return semitone - degree + best;
}