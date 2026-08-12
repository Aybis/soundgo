// Built-in songs for the follow-along (Guitar Hero style) mode.
// Each event = a chord the player must match: left hand on the root note,
// right hand on the chord type, at the given beat.

export interface SongEvent {
  beat: number;      // beat position (float)
  root: "A" | "B" | "C" | "D" | "E" | "F" | "G"; // root note (natural, matches Simple wheel)
  chord: number;     // index into CHORDS
}

export interface Song {
  id: string;
  title: string;
  bpm: number;
  lead: number;      // seconds a note is visible before it lands
  events: SongEvent[];
}

type Prog = [SongEvent["root"], number, number][];

function build(prog: Prog, repeats: number): SongEvent[] {
  const events: SongEvent[] = [];
  let beat = 0;
  for (let r = 0; r < repeats; r++) {
    for (const [root, chord, beats] of prog) {
      events.push({ beat, root, chord });
      beat += beats;
    }
  }
  return events;
}

// chord index reference: 0 maj,1 min,2 aug,3 dim,4 7,5 m7,6 maj7,7 sus4,8 sus2

export const SONGS: Song[] = [
  {
    id: "pop",
    title: "Pop Groove",
    bpm: 96,
    lead: 2.2,
    events: build([["C", 0, 4], ["G", 0, 4], ["A", 1, 4], ["F", 0, 4]], 4),
  },
  {
    id: "dreamy",
    title: "Dreamy Chords",
    bpm: 80,
    lead: 2.4,
    events: build([["A", 1, 4], ["F", 0, 4], ["C", 0, 4], ["G", 0, 4]], 4),
  },
  {
    id: "sus",
    title: "Sus Flow",
    bpm: 92,
    lead: 2.2,
    events: build([["C", 8, 4], ["G", 0, 4], ["A", 1, 4], ["F", 6, 4]], 4),
  },
];

export function songSeconds(s: Song): number {
  const last = s.events[s.events.length - 1];
  return last.beat * (60 / s.bpm) + 2;
}