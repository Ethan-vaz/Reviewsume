// A circular progress ring showing the match score (0–100), like the one in the design mockup.
//
// How it works: an SVG <circle> can draw its outline as dashes. We make one dash
// exactly as long as the whole circle, then use `strokeDashoffset` to hide part of it.
// Hiding (100 - score)% leaves an arc that covers score% of the ring.

const SIZE = 140; // width and height of the whole ring, in pixels
const STROKE = 12; // thickness of the ring
const RADIUS = (SIZE - STROKE) / 2; // keep the stroke fully inside the box
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // length of the full outline

type ScoreRingProps = {
  score: number;
};

/** Pick a colour and a short verdict for the score. */
export function scoreBand(score: number) {
  if (score >= 75) return { label: "Strong match", color: "text-emerald-500" };
  if (score >= 50) return { label: "Partial match", color: "text-amber-500" };
  return { label: "Weak match", color: "text-red-500" };
}

export default function ScoreRing({ score }: ScoreRingProps) {
  const clamped = Math.min(100, Math.max(0, score)); // never draw outside 0–100
  const hidden = CIRCUMFERENCE * (1 - clamped / 100);
  const band = scoreBand(clamped);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{ width: SIZE, height: SIZE }}
        role="img"
        aria-label={`Match score: ${clamped} out of 100. ${band.label}.`}
      >
        {/* -rotate-90 makes the arc start at 12 o'clock instead of 3 o'clock */}
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* Grey background track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-zinc-200 dark:stroke-zinc-700"
          />
          {/* Coloured arc. `stroke="currentColor"` uses the text colour class (band.color). */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={hidden}
            className={`${band.color} transition-[stroke-dashoffset] duration-700 ease-out`}
          />
        </svg>

        {/* The number, centred on top of the ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold tabular-nums">{clamped}</span>
          <span className="text-xs text-zinc-500">out of 100</span>
        </div>
      </div>

      <p className={`text-sm font-medium ${band.color}`}>{band.label}</p>
    </div>
  );
}
