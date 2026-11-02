import OpenAI from "openai";
import { reviewResume } from "@/lib/review/analyze";
import { ReviewRequestSchema } from "@/lib/review/schemas";

// POST /api/review
// Body (JSON): { resumeText: string, jobDescription: string }
// Returns: a ReviewResult (see src/lib/review/schemas.ts), or { error } with a message for the user.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  // Check the input before spending money on OpenAI calls.
  const parsed = ReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    const result = await reviewResume(parsed.data.resumeText, parsed.data.jobDescription);
    return Response.json(result);
  } catch (error) {
    console.error("Review failed:", error);
    let message = friendlyError(error);
    // While developing (npm run dev), also show the real error on the page to make debugging easier.
    // `next build` / `next start` set NODE_ENV to "production", so users never see these details.
    if (process.env.NODE_ENV === "development" && error instanceof Error) {
      message += ` [dev details: ${error.name}: ${error.message}]`;
    }
    return Response.json({ error: message }, { status: 502 });
  }
}

/** Turn OpenAI failures into messages that tell the user (you!) what to fix. */
function friendlyError(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      return "OpenAI rejected the API key. Check OPENAI_API_KEY in .env.local and restart the dev server.";
    }
    if (error.status === 429) {
      return "OpenAI says you're out of credit or sending too many requests. Check your billing, or wait a minute.";
    }
    if (error.status === 404) {
      return "The OpenAI model wasn't found. Check OPENAI_MODEL in .env.local.";
    }
    return `OpenAI returned an error (${error.status ?? "unknown"}). Please try again.`;
  }
  // A missing key is thrown as a plain Error (not an APIError), so match on the message.
  if (error instanceof Error && /missing credentials|api[ _]?key/i.test(error.message)) {
    return "No OpenAI API key found. Add OPENAI_API_KEY to .env.local and restart the dev server.";
  }
  return "Something went wrong while reviewing your resume. Please try again.";
}
