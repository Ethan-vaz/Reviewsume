import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// 1. What the browser sends to POST /api/review
// ─────────────────────────────────────────────────────────────

export const ReviewRequestSchema = z.object({
  resumeText: z
    .string()
    .trim()
    .min(100, "Your resume looks too short. Upload it again or paste the full text.")
    .max(20_000, "Your resume is over 20,000 characters. Please shorten it."),
  jobDescription: z
    .string()
    .trim()
    .min(100, "The job description looks too short. Paste the full posting.")
    .max(15_000, "The job description is over 15,000 characters. Please paste only the posting."),
});

export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;

// ─────────────────────────────────────────────────────────────
// 2. What we ask OpenAI to return (one schema per call).
//    OpenAI's "strict" structured output requires every field to be
//    present, so "maybe empty" fields use .nullable(), not .optional().
// ─────────────────────────────────────────────────────────────

/** Call 1: read the job description. */
export const JobRequirementsSchema = z.object({
  jobTitle: z.string(),
  mustHaveSkills: z.array(z.string()),
  niceToHaveSkills: z.array(z.string()),
  keywords: z.array(z.string()),
});
export type JobRequirements = z.infer<typeof JobRequirementsSchema>;

/** Call 2: check the resume for each skill found in call 1. */
export const SkillMatchesSchema = z.object({
  matches: z.array(
    z.object({
      skill: z.string(),
      found: z.boolean(),
      evidence: z.string().nullable(),
      suggestion: z.string().nullable(),
    })
  ),
});
export type SkillMatches = z.infer<typeof SkillMatchesSchema>;

/** Call 3: find weak bullets and rewrite them. */
export const BulletIssueSchema = z.enum(["vague", "off-target"]);

export const BulletReviewSchema = z.object({
  weakBullets: z.array(
    z.object({
      original: z.string(),
      issues: z.array(BulletIssueSchema),
      explanation: z.string(),
      rewrite: z.string(),
    })
  ),
});
export type BulletReview = z.infer<typeof BulletReviewSchema>;

// ─────────────────────────────────────────────────────────────
// 3. What POST /api/review sends back to the browser.
//    Plain TypeScript types: we build this ourselves, so no runtime check needed.
// ─────────────────────────────────────────────────────────────

export type SkillImportance = "must-have" | "nice-to-have";

export type SkillResult = {
  name: string;
  importance: SkillImportance;
  found: boolean;
  /** Short quote from the resume proving the skill (only when found). */
  evidence: string | null;
  /** How to gain or show the skill (only when missing). Feeds the to-do list. */
  suggestion: string | null;
};

export type KeywordResult = {
  term: string;
  found: boolean;
};

export type WeakBullet = BulletReview["weakBullets"][number];

export type ReviewResult = {
  jobTitle: string;
  skills: SkillResult[];
  keywords: KeywordResult[];
  weakBullets: WeakBullet[];
};
