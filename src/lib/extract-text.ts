import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

// Resumes are small. Anything bigger is probably the wrong file.
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// Below this many characters we assume extraction failed
// (e.g. a scanned PDF that is really just an image).
const MIN_TEXT_LENGTH = 100;

/**
 * An error whose message is safe and helpful to show to the user.
 * Anything else that goes wrong is treated as an unexpected server error.
 */
export class ExtractionError extends Error {}

type ResumeFileKind = "pdf" | "docx";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function detectKind(file: File): ResumeFileKind | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type === DOCX_MIME || name.endsWith(".docx")) return "docx";
  return null;
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

async function extractDocx(bytes: Uint8Array): Promise<string> {
  // mammoth expects a Node.js Buffer, so wrap the bytes in one.
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return value;
}

/** Tidy whitespace while keeping line breaks, so bullets stay on their own lines. */
function cleanText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n") // Windows line endings -> \n
    .replace(/[ \t ]+/g, " ") // runs of spaces/tabs -> one space
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // at most one blank line in a row
    .trim();
}

/** Turn an uploaded resume (PDF or DOCX) into plain text. */
export async function extractResumeText(file: File): Promise<string> {
  const kind = detectKind(file);
  if (!kind) {
    throw new ExtractionError("Please upload a PDF or DOCX file.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ExtractionError("That file is over 5 MB. Please upload a smaller resume.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  let raw: string;
  try {
    raw = kind === "pdf" ? await extractPdf(bytes) : await extractDocx(bytes);
  } catch {
    throw new ExtractionError(
      "We couldn't read that file. It may be corrupted or password-protected. Try pasting your resume text instead."
    );
  }

  const text = cleanText(raw);
  if (text.length < MIN_TEXT_LENGTH) {
    throw new ExtractionError(
      "We found almost no text in that file. If it's a scanned image, try pasting your resume text instead."
    );
  }
  return text;
}
