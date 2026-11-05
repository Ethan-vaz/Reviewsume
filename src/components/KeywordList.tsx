import type { KeywordResult } from "@/lib/review/schemas";

type KeywordListProps = {
  keywords: KeywordResult[];
};

export default function KeywordList({ keywords }: KeywordListProps) {
  const missing = keywords.filter((k) => !k.found);
  const present = keywords.filter((k) => k.found);

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Applicant tracking systems scan for these exact words. Add the missing ones where they
        honestly describe your experience.
      </p>

      <KeywordGroup title="Missing from your resume" keywords={missing} found={false} />
      <KeywordGroup title="Already on your resume" keywords={present} found={true} />
    </div>
  );
}

function KeywordGroup({ title, keywords, found }: { title: string; keywords: KeywordResult[]; found: boolean }) {
  if (keywords.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">
        {title} ({keywords.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span
            key={keyword.term}
            className={`rounded-full px-3 py-1 text-xs ${
              found
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {found ? "✓" : "+"} {keyword.term}
          </span>
        ))}
      </div>
    </div>
  );
}