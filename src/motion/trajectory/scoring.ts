// Forgiving air-writing scoring. Children's strokes are imperfect, so we never
// demand pixel-perfect matching. We resample both shapes to equal point counts,
// normalize them into the same box, and measure how well the drawn trail covers
// the template skeleton. Speed and slight wobble don't matter.

interface Pt { x: number; y: number; }

/** Resample a polyline to exactly n evenly-spaced points (by arclength). */
export function resample(points: Pt[], n: number): Pt[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array.from({ length: n }, () => points[0]);
  // cumulative arclength
  const cum: number[] = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    cum.push(total);
  }
  const out: Pt[] = [];
  for (let j = 0; j < n; j++) {
    const target = (j / (n - 1)) * total;
    // find segment
    let k = 1;
    while (k < cum.length && cum[k] < target) k++;
    const a = points[k - 1], b = points[k];
    const seg = cum[k] - cum[k - 1];
    const t = seg === 0 ? 0 : (target - cum[k - 1]) / seg;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

/** Translate + scale a point set into the [0,1] box (aspect-preserving). */
export function normalize(points: Pt[]): Pt[] {
  if (points.length === 0) return [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const scale = Math.max(w, h);
  return points.map((p) => ({
    x: (p.x - minX) / scale,
    y: (p.y - minY) / scale,
  }));
}

function nearestDist(p: Pt, cloud: Pt[]): number {
  let best = Infinity;
  for (const c of cloud) {
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Score a drawn trail against a template, 0..100.
 * Measures mean closest-point distance from the template skeleton to the trail
 * (how well the shape is covered). "Coverage" and "proximity" are both folded
 * in — a good trace just needs every template point near the drawn line.
 */
export function traceScore(template: Pt[], trail: Pt[]): { score: number; ok: boolean } {
  if (trail.length < 12) return { score: 0, ok: false };

  const t = normalize(resample(template, 40));
  const d = normalize(resample(trail, 40));

  // how well the draw covers the template
  let tCover = 0;
  for (const p of t) tCover += nearestDist(p, d);
  tCover /= t.length;
  // and how much extra/scattered the draw is (penalize scribbles lightly)
  let dCover = 0;
  for (const p of d) dCover += nearestDist(p, t);
  dCover /= d.length;

  // forgiving: template coverage weighted 70%, draw-focus 30%
  const dist = tCover * 0.7 + dCover * 0.3;
  const score = Math.max(0, Math.min(100, Math.round(100 * (1 - dist / 0.16))));
  return { score, ok: score >= 55 };
}