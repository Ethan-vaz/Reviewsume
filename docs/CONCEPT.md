# Reviewsume — Concept

## What it is
A single-page web app that runs locally. A job seeker uploads a resume (PDF or DOCX) and pastes a job description. Reviewsume returns:

- a **computed match score**
- a **to-do list** of missing skills
- **rewrites** for weak bullets, using placeholders like `[X%]`

It is a portfolio piece and a personal tool, so polish and clarity matter more than novelty.

## Tech stack
Next.js (App Router), TypeScript, Tailwind CSS, OpenAI API.

## Version one scope

**In scope**
- Upload a PDF or DOCX resume, with pasted resume text as a fallback when extraction is garbled
- Paste the job description as text
- Match score calculated in code
- Missing skills, split into must-have and nice-to-have
- Every weak bullet flagged and rewritten. "Weak" means vague wording or not relevant to the job.
- Suggested keywords to add
- Two-pane layout (inputs on the left, results on the right)
- A polished README with screenshots

**Later**
- Copy buttons and a "mark done" checklist
- Exporting results
- Job description upload or URL scraping
- Tests and CI
- Public deployment

**Out of scope:** accounts, a database, saved history, rate limiting.

## Layout

| Left pane (inputs) | Right pane (results) |
|---|---|
| Resume upload area, showing the extracted text so the user can check it | Score ring at the top (e.g. **72**), with a one-line summary |
| Job description text area | Tabs: **Missing Skills** · **Weak Bullets** · **Keywords** |
| **Analyze** button | Weak Bullets shows each original next to its rewrite |

## How the score is computed
1. **Extract.** OpenAI reads the job description and returns structured JSON: must-have skills, nice-to-have skills and important keywords.
2. **Match.** OpenAI checks the resume against each item and returns found or missing, plus the resume line that proves it. Using the model here, rather than exact text matching, means "JS" counts as "JavaScript".
3. **Score.** TypeScript code calculates the number:
   `score = 70% × (must-haves found / total) + 30% × (nice-to-haves found / total)`
4. **Bullets.** OpenAI flags vague or off-target bullets and rewrites each one. It never invents numbers and uses `[X]` placeholders instead.

## Architecture
```
Browser (one page: React + Tailwind)
   │ 1. resume file
   ▼
/api/parse   → PDF (unpdf) or DOCX (mammoth) → { text }
   │    text is shown in the left pane so the user can check or fix it
   │    (pasted resume text skips this step entirely)
   │ 2. resume text + job description text
   ▼
/api/review
   ├─ OpenAI call(s) using structured JSON output, checked with zod
   ├─ computeScore() — plain TypeScript
   └─ return one JSON result
```
Splitting parsing from review means the review route only ever deals with text,
so uploaded and pasted resumes go through exactly the same path.

## Privacy
- The OpenAI key stays on the server in `.env.local` and is never sent to the browser.
- Nothing is stored. A short notice in the UI says the resume is sent to OpenAI for analysis and not saved.

## Who writes what
| Claude writes and explains | Ethan writes, step by step |
|---|---|
| PDF and DOCX parsing | Page layout and Tailwind styling |
| OpenAI prompts, JSON schemas and zod checks | Input pane: upload and text area |
| API route wiring and error handling | Result components: score ring, tabs, bullet cards |
| | `computeScore()` |
| | README |

## One-day plan (about 8–10 hours)
1. **Setup (1h):** create the Next.js app, add Tailwind and the OpenAI key, run a "hello world" API call
2. **Parsing (1.5h):** upload a file and get its text back on the page
3. **AI pipeline (2h):** extract, match and review bullets, all returning typed JSON
4. **Scoring (0.5h):** write `computeScore()`
5. **UI (2.5h):** two-pane layout, score ring, tabs
6. **Polish (1h):** loading and error states, privacy notice, screenshots and README

If time runs short, cut tabs first (show one list), then the score ring (show a plain number).
