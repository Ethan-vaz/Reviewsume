import type { SkillResult } from "@/lib/review/schemas";

type TodoListProps = {
  skills: SkillResult[];
};

export default function TodoList({ skills }: TodoListProps) {
  const missingMust = skills.filter((s) => !s.found && s.importance === "must-have");
  const missingNice = skills.filter((s) => !s.found && s.importance === "nice-to-have");
  const have = skills.filter((s) => s.found);

  if (missingMust.length === 0 && missingNice.length === 0) {
    return <p className="text-sm">🎉 Your resume covers every skill this job asks for.</p>;
  }

  return (
    <div className="space-y-6">
      <SkillGroup title="Must-have skills to add" skills={missingMust} />
      <SkillGroup title="Nice-to-have skills to add" skills={missingNice} />

      {have.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Already on your resume</h3>
          <div className="flex flex-wrap gap-2">
            {have.map((skill) => (
              <span
                key={skill.name}
                title={skill.evidence ?? undefined}
                className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              >
                ✓ {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// A small helper component used twice above, kept in the same file because nothing else needs it.
function SkillGroup({ title, skills }: { title: string; skills: SkillResult[] }) {
  if (skills.length === 0) return null; // returning null = render nothing

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {skills.map((skill) => (
          <li
            key={skill.name}
            className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <p className="text-sm font-medium">☐ {skill.name}</p>
            {skill.suggestion && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{skill.suggestion}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}