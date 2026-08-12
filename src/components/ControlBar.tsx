import { CHORDS, RANGES, SCALE_NAMES, WAVES } from "../engine/music";

export interface Controls {
  mode: "two-hand" | "melody";
  snap: boolean;
  simple: boolean;
  scale: string;
  wave: string;
  range: number;
}

export const DEFAULT_CONTROLS: Controls = {
  mode: "two-hand",
  snap: true,
  simple: true,
  scale: "Major",
  wave: "sine",
  range: 3,
};

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#6d5cff] h-3.5 w-3.5 cursor-pointer"
      />
      <span className="text-[11px] text-zinc-300">{label}</span>
    </label>
  );
}

export function ControlBar({
  controls,
  onChange,
}: {
  controls: Controls;
  onChange: (c: Controls) => void;
}) {
  const set = (patch: Partial<Controls>) => onChange({ ...controls, ...patch });

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 bg-[#0d0d16]/80 backdrop-blur border-t border-white/10">
      <Select label="Mode" value={controls.mode} onChange={(v) => set({ mode: v as Controls["mode"] })}>
        <option value="two-hand">Two-hand Chord</option>
        <option value="melody">Melody + Chord</option>
      </Select>

      <Toggle label="Snap" checked={controls.snap} onChange={(v) => set({ snap: v })} />
      <Toggle label="Simple (ABCDEFG)" checked={controls.simple} onChange={(v) => set({ simple: v })} />

      <Select label="Scale" value={controls.scale} onChange={(v) => set({ scale: v })}>
        {SCALE_NAMES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </Select>

      <Select label="Wave" value={controls.wave} onChange={(v) => set({ wave: v })}>
        {WAVES.map((w) => (
          <option key={w} value={w}>{w[0].toUpperCase() + w.slice(1)}</option>
        ))}
      </Select>

      <Select label="Range" value={String(controls.range)} onChange={(v) => set({ range: Number(v) })}>
        {RANGES.map((r) => (
          <option key={r} value={String(r)}>{r} oct</option>
        ))}
      </Select>

      <div className="ml-auto hidden sm:block text-[11px] text-zinc-500">
        {CHORDS.length} chord types · move your hands over the wheels
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="uppercase tracking-wider text-[10px] text-zinc-500 font-medium">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  );
}