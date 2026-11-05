import type { WeakBullet } from "@/lib/review/schemas";

type BulletListProps = {
  bullets: WeakBullet[];
};

export default function BulletList({ bullets }: BulletListProps) {
  if (bullets.length === 0) {
    return <p className="text-sm">🎉 No weak bullets found. Your bullets are specific and on-target.</p>;
  }

  return (
    <ul className="space-y-4">
      {bullets.map((bullet) => (
        <li
          key={bullet.original}
          className="space-y-3 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <div className="flex flex-wrap items-center gap-2">
            {bullet.issues.map((issue) => (
              <span
                key={issue}
                className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              >
                {issue}
              </span>
            ))}
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{bullet.explanation}</span>
          </div>

          {/* One column on phones, two side by side from "sm" (640px) up */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-zinc-500">Original</p>
              <p className="text-sm text-zinc-500 line-through decoration-zinc-400/50">
                {bullet.original}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-emerald-600">Rewrite</p>
              <p className="text-sm">
                <HighlightPlaceholders text={bullet.rewrite} />
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Show [placeholders] like "[X%]" highlighted, so it's obvious what to fill in. */
function HighlightPlaceholders({ text }: { text: string }) {
  // Splitting with a capturing group keeps the [ ... ] pieces in the result,
  // at every odd position: "Cut costs by [X%] in Q1" -> ["Cut costs by ", "[X%]", " in Q1"]
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-amber-200 px-1 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}