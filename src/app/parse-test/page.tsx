"use client";

// TEMPORARY test page for Steps 2–3. Visit /parse-test.
// Upload a resume, paste a job description, click Analyze, and see the raw JSON.
// We'll delete this once the real UI is built in Step 5.

import { useState } from "react";

export default function ParseTestPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading("Reading file…");
    setError("");
    setResumeText("");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setResumeText(data.text);
      else setError(data.error);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading("");
    }
  }

  async function handleAnalyze() {
    setLoading("Analyzing… (this takes 10–30 seconds)");
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (res.ok) setResult(JSON.stringify(data, null, 2));
      else setError(data.error);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading("");
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Pipeline test</h1>

      <label className="block font-medium">1. Resume (PDF or DOCX)</label>
      <input type="file" accept=".pdf,.docx" onChange={handleFile} />
      <textarea
        className="h-48 w-full rounded border p-2 text-sm"
        placeholder="Extracted resume text appears here (or paste it)"
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
      />

      <label className="block font-medium">2. Job description</label>
      <textarea
        className="h-48 w-full rounded border p-2 text-sm"
        placeholder="Paste the job posting here"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />

      <button
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        onClick={handleAnalyze}
        disabled={!!loading || !resumeText || !jobDescription}
      >
        3. Analyze
      </button>

      {loading && <p>{loading}</p>}
      {error && <p className="text-red-600">{error}</p>}
      {result && (
        <pre className="whitespace-pre-wrap rounded border p-4 text-sm">{result}</pre>
      )}
    </main>
  );
}
