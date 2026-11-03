// Safety rail: if a browser ("use client") file ever imports this file,
// the build fails instead of shipping OpenAI code toward the browser.
import "server-only";
import OpenAI from "openai";

// Change the model in .env.local with OPENAI_MODEL=... if you want to try another one.
export const MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

let client: OpenAI | null = null;

/**
 * Create the OpenAI client the first time it's needed, not when the file is imported.
 * That way a missing API key gives a clear error when you click Analyze,
 * instead of crashing the whole app on startup.
 */
export function getOpenAI(): OpenAI {
  client ??= new OpenAI(); // reads OPENAI_API_KEY from the environment
  return client;
}
