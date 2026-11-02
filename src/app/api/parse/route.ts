import { extractResumeText, ExtractionError } from "@/lib/extract-text";

// POST /api/parse
// Body: multipart form data with a "resume" field holding the file.
// Returns: { text } on success, or { error } with a message to show the user.
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const file = formData.get("resume");
  if (!(file instanceof File)) {
    return Response.json({ error: "No resume file was attached." }, { status: 400 });
  }

  try {
    const text = await extractResumeText(file);
    return Response.json({ text });
  } catch (error) {
    if (error instanceof ExtractionError) {
      // 422 = "we understood the request, but can't process this file"
      return Response.json({ error: error.message }, { status: 422 });
    }
    console.error("Unexpected error while parsing resume:", error);
    return Response.json({ error: "Something went wrong reading your file." }, { status: 500 });
  }
}
