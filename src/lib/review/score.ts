import type { SkillResult } from "./schemas";

export function computeScore(skills: SkillResult[]): number {
  const mustHave = skills.filter((skill) => skill.importance === "must-have");

  const niceToHave = skills.filter((skill) => skill.importance === "nice-to-have");

  const mustHaveCount = mustHave.filter((skill) => skill.found === true).length;
  const niceToHaveCount = niceToHave.filter((skill) => skill.found === true).length;

  const totalcount = mustHave.length + niceToHave.length;

  if (totalcount === 0) {
    return 0;
  }
  else if (niceToHave.length === 0) {
  // No nice-to-haves in this job, so must-haves are worth the full 100.
  return Math.round((mustHaveCount / mustHave.length) * 100);
} 
  else if (mustHave.length === 0) {
  // No must-haves in this job, so nice-to-haves are worth the full 100.
  return Math.round((niceToHaveCount / niceToHave.length) * 100);
}
  else {
    const score = (mustHaveCount / mustHave.length) * 0.7 + (niceToHaveCount / niceToHave.length) * 0.3;
    return Math.round(score * 100);
  }
}