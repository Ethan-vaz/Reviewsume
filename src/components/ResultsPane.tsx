import ScoreRing from "@/components/ScoreRing";
import type { ReviewResult } from "@/lib/review/schemas";

type ResultsPaneProps = {
  result: ReviewResult | null;
  error: string;
  analyzing: boolean;
};

export default function ResultsPane({ result, error, analyzing }: ResultsPaneProps) {
  if (analyzing) {
    return (
      <p className="mt-4 animate-pulse text-sm text-zinc-500">
        Analyzing your resume… this takes 10–30 seconds.
      </p>
    );
  }

  if (error) {
    return (
      <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        {error}
      </p>
    );
  }

  if (!result) {
    return (
      <p className="mt-4 text-sm text-zinc-500">
        Upload your resume and paste a job description, then click Analyze. Your results will
        appear here.
      </p>
    );
  }

  // From here on, TypeScript knows `result` is a real ReviewResult, not null.
  const mustHave = result.skills.filter((skill) => skill.importance === "must-have");
  const mustHaveFound = mustHave.filter((skill) => skill.found).length;

  return (
    <div className="mt-4 space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <ScoreRing score={result.score} />
        <p className="text-sm text-zinc-500">
          for <span className="font-medium text-foreground">{result.jobTitle}</span>
        </p>
        <p className="text-sm">
          {mustHaveFound} of {mustHave.length} must-have skills found ·{" "}
          {result.weakBullets.length} bullets to improve
        </p>
      </div>

      {/* Tabs (To-do · Weak bullets · Keywords) come in 5.5 */}
    </div>
  );
}