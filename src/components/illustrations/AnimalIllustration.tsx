interface Props {
  animal: string;
  className?: string;
}

/** Large, friendly animal cards for Grab the Answer. */
export function AnimalIllustration({ animal, className = "" }: Props) {
  const common = <>
    <circle cx="100" cy="100" r="90" fill="#fff6ec" />
    <ellipse cx="100" cy="166" rx="48" ry="10" fill="#e9d9ff" />
  </>;
  const face = (cx = 100, cy = 105) => <>
    <circle cx={cx - 13} cy={cy - 4} r="4" fill="#3a3352" />
    <circle cx={cx + 13} cy={cy - 4} r="4" fill="#3a3352" />
    <path d={`M${cx-10} ${cy+13} Q${cx} ${cy+22} ${cx+10} ${cy+13}`} stroke="#3a3352" strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx={cx-26} cy={cy+10} r="7" fill="#ff9db8" opacity=".7" />
    <circle cx={cx+26} cy={cy+10} r="7" fill="#ff9db8" opacity=".7" />
  </>;

  let drawing;
  switch (animal) {
    case "cow":
      drawing = <><path d="M53 93 Q53 55 100 53 Q147 55 147 93 L139 138 Q100 160 61 138Z" fill="#fff" stroke="#d9cff2" strokeWidth="3" /><path d="M67 71 q12-16 25 0 q-12 15-25 0 M109 70 q14-15 25 2 q-12 14-25-2" fill="#3a3352" opacity=".85" /><ellipse cx="100" cy="124" rx="30" ry="20" fill="#ffb6bd" /><ellipse cx="90" cy="122" rx="5" ry="7" fill="#3a3352" /><ellipse cx="110" cy="122" rx="5" ry="7" fill="#3a3352" />{face()}</>;
      break;
    case "dog":
      drawing = <><path d="M53 74 Q35 62 45 124 Q54 148 72 128 L128 128 Q146 148 155 124 Q165 62 147 74 Q130 54 100 54 Q70 54 53 74Z" fill="#c98b5b" /><circle cx="100" cy="105" r="48" fill="#f6c48d" /><ellipse cx="100" cy="120" rx="22" ry="16" fill="#fff" />{face()}</>;
      break;
    case "cat":
      drawing = <><path d="M56 89 L56 48 L82 69 Q100 61 118 69 L144 48 L144 89 Q145 145 100 150 Q55 145 56 89Z" fill="#ffb6bd" stroke="#ff9db8" strokeWidth="3" />{face()}</>;
      break;
    case "duck":
      drawing = <><circle cx="100" cy="104" r="51" fill="#ffd166" /><path d="M73 68 Q53 39 85 52" fill="#ffd166" /><path d="M127 68 Q147 39 115 52" fill="#ffd166" /><ellipse cx="100" cy="118" rx="28" ry="14" fill="#ff8c42" />{face(100,105)}</>;
      break;
    default:
      drawing = <><circle cx="100" cy="106" r="49" fill="#ffd166" /><path d="M61 82 Q48 53 77 67 Q100 48 123 67 Q152 53 139 82" fill="#b76e3f" /><path d="M61 117 Q39 108 55 133" stroke="#b76e3f" strokeWidth="15" strokeLinecap="round" fill="none" />{face()}</>;
  }

  return <svg viewBox="0 0 200 200" className={className} aria-hidden="true">{common}{drawing}</svg>;
} 

export function animalEmoji(animal: string) {
  return ({ cat: "🐱", dog: "🐶", cow: "🐮", duck: "🦆", lion: "🦁" } as Record<string, string>)[animal] ?? "🐾";
}
