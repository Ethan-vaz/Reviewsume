import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { getOpenAI, MODEL } from "@/lib/openai";
import {
  EXTRACT_REQUIREMENTS_PROMPT,
  MATCH_SKILLS_PROMPT,
  REVIEW_BULLETS_PROMPT,
} from "./prompts";
import {
  BulletReviewSchema,
  JobRequirementsSchema,
  SkillMatchesSchema,
  type JobRequirements,
  type KeywordResult,
  type ReviewResult,
  type SkillImportance,
  type SkillResult,
  type WeakBullet,
} from "./schemas";
import { computeScore } from "./score";

// ─────────────────────────────────────────────────────────────
// The one function the API route calls
// ─────────────────────────────────────────────────────────────

/**
 * Review a resume against a job description.
 *
 *   job description ──► 1. extract requirements ──► 2. match skills ──► 3. review bullets ──► result
 *
 * Step 3 runs AFTER step 2 on purpose: it's told which skills the resume already
 * shows, so it doesn't call a bullet weak for "missing" something that's elsewhere
 * on the resume, and it can name those proven skills in its rewrites.
 * (An earlier version ran it in parallel: faster, but the feedback was worse.)
 */
export async function reviewResume(
  resumeText: string,
  jobDescription: string
): Promise<ReviewResult> {
  const { requirements, skills } = await analyzeSkills(resumeText, jobDescription);
  const weakBullets = await reviewBullets(resumeText, jobDescription, skills);

  return {
    jobTitle: requirements.jobTitle,
    skills,
    keywords: matchKeywords(requirements.keywords, resumeText),
    weakBullets,
    score: computeScore(skills),
  };
}

// ─────────────────────────────────────────────────────────────
// Calling OpenAI
// ─────────────────────────────────────────────────────────────

/**
 * Send one request to OpenAI and get back an object that matches `schema`.
 * The SDK turns the zod schema into a JSON Schema, OpenAI is forced to follow it,
 * and the SDK checks the reply against the schema before we ever see it.
 */
async function askForJson<T extends z.ZodType>(
  schema: T,
  name: string,
  instructions: string,
  input: string
): Promise<z.infer<T>> {
  const response = await getOpenAI().responses.parse({
    model: MODEL,
    instructions,
    input,
    // 0 = least random. The same resume should get (nearly) the same review every time.
    // Note: some reasoning models reject this setting. Remove it if you switch to one.
    temperature: 0,
    text: { format: zodTextFormat(schema, name) },
  });

  if (!response.output_parsed) {
    throw new Error(`OpenAI returned no usable result for "${name}".`);
  }
  return response.output_parsed as z.infer<T>;
}

// ─────────────────────────────────────────────────────────────
// Steps 1 + 2: required skills, and whether the resume has them
// ─────────────────────────────────────────────────────────────

async function analyzeSkills(resumeText: string, jobDescription: string) {
  const requirements = cleanRequirements(
    await askForJson(
      JobRequirementsSchema,
      "job_requirements",
      EXTRACT_REQUIREMENTS_PROMPT,
      `<job_description>\n${jobDescription}\n</job_description>`
    )
  );

  const wanted: { name: string; importance: SkillImportance }[] = [
    ...requirements.mustHaveSkills.map((name) => ({ name, importance: "must-have" as const })),
    ...requirements.niceToHaveSkills.map((name) => ({ name, importance: "nice-to-have" as const })),
  ];

  if (wanted.length === 0) {
    return { requirements, skills: [] as SkillResult[] };
  }

  const { matches } = await askForJson(
    SkillMatchesSchema,
    "skill_matches",
    MATCH_SKILLS_PROMPT,
    `<skills>\n${JSON.stringify(wanted.map((s) => s.name))}\n</skills>\n\n<resume>\n${resumeText}\n</resume>`
  );

  // Line OpenAI's answers back up with our list of skills, by name.
  // We trust OUR list, not the model's: if it skipped or renamed a skill,
  // that skill counts as missing rather than disappearing from the score.
  const byName = new Map(matches.map((m) => [normalize(m.skill), m]));

  const skills: SkillResult[] = wanted.map(({ name, importance }) => {
    const match = byName.get(normalize(name));
    const found = match?.found ?? false;
    return {
      name,
      importance,
      found,
      evidence: found ? (match?.evidence ?? null) : null,
      suggestionType: found ? null : (match?.suggestionType ?? null),
      suggestion: found ? null : (match?.suggestion ?? null),
    };
  });

  return { requirements, skills };
}

/** Remove blanks and duplicates, and keep a skill only in must-have if listed twice. */
function cleanRequirements(req: JobRequirements): JobRequirements {
  const mustHaveSkills = dedupe(req.mustHaveSkills);
  const mustSet = new Set(mustHaveSkills.map(normalize));
  return {
    jobTitle: req.jobTitle.trim(),
    mustHaveSkills,
    niceToHaveSkills: dedupe(req.niceToHaveSkills).filter((s) => !mustSet.has(normalize(s))),
    keywords: dedupe(req.keywords),
  };
}

// ─────────────────────────────────────────────────────────────
// Keywords: checked by plain code, not AI
// ─────────────────────────────────────────────────────────────

/**
 * ATS software looks for the literal words, so we do too: a keyword counts
 * only if it appears in the resume as a whole word (case-insensitive).
 * That keeps this part predictable, and it complements the AI skill matching,
 * which is deliberately more forgiving ("JS" = "JavaScript").
 */
export function matchKeywords(keywords: string[], resumeText: string): KeywordResult[] {
  const resume = resumeText.toLowerCase().replace(/\s+/g, " ");
  return keywords.map((term) => {
    const needle = escapeRegExp(term.toLowerCase().replace(/\s+/g, " "));
    // "Whole word" here means:
    //   before the term: no letter, digit, "+" or "#"
    //   after the term:  no letter, "#" or "++"
    // So "Java" doesn't match "JavaScript" and "C" doesn't match "C++" or "C#",
    // but version numbers are fine: "HTML" matches "HTML5", "ES6" matches "ES6+".
    // \b isn't used because it breaks on terms like "C++" or ".NET".
    const pattern = new RegExp(`(?<![a-z0-9+#])${needle}(?![a-z#]|\\+\\+)`);
    return { term, found: pattern.test(resume) };
  });
}

// ─────────────────────────────────────────────────────────────
// Step 3: weak bullets and rewrites
// ─────────────────────────────────────────────────────────────

async function reviewBullets(
  resumeText: string,
  jobDescription: string,
  skills: SkillResult[]
): Promise<WeakBullet[]> {
  // Tell the model what step 2 already proved, with the evidence quotes.
  const skillsOnResume = skills
    .filter((s) => s.found)
    .map((s) => `- ${s.name}${s.evidence ? `: "${s.evidence}"` : ""}`)
    .join("\n");

  const { weakBullets } = await askForJson(
    BulletReviewSchema,
    "bullet_review",
    REVIEW_BULLETS_PROMPT,
    `<job_description>\n${jobDescription}\n</job_description>\n\n` +
      `<skills_on_resume>\n${skillsOnResume || "(none)"}\n</skills_on_resume>\n\n` +
      `<resume>\n${resumeText}\n</resume>`
  );

  const resume = looseText(resumeText);
  return weakBullets.filter(
    (b) =>
      b.issues.length > 0 &&
      b.rewrite.trim() !== "" &&
      // Only keep bullets that really exist in the resume.
      // Models occasionally paraphrase or invent an "original", which would confuse the user.
      resume.includes(looseText(b.original)) &&
      // Drop "rewrites" that barely change anything. This is what happens when a bullet
      // is already good (e.g. you pasted in an earlier suggestion) but the model flags it anyway.
      wordOverlap(b.original, b.rewrite) < 0.8
  );
}

/**
 * How similar two sentences are, from 0 (no words in common) to 1 (same words).
 * Counts shared words relative to all distinct words used (Jaccard similarity).
 */
export function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(looseText(a).split(" ").filter(Boolean));
  const wordsB = new Set(looseText(b).split(" ").filter(Boolean));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  let shared = 0;
  for (const word of wordsA) if (wordsB.has(word)) shared++;
  return shared / (wordsA.size + wordsB.size - shared);
}

// ─────────────────────────────────────────────────────────────
// Small text helpers
// ─────────────────────────────────────────────────────────────

/** Lowercase and trim, for comparing names. */
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Very forgiving comparison form: letters and digits only, single spaces. */
function looseText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = normalize(item);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(item.trim());
    }
  }
  return out;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
