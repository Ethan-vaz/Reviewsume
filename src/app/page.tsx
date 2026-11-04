"use client";

import { useState } from "react";
import InputPane from "@/components/InputPane";
import ResultsPane from "@/components/ResultsPane";
import type { ReviewResult } from "@/lib/review/schemas";

export default function Home() {
  // Shared data: the input pane edits it, and Analyze (5.3) will send it.
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
    const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Could not reach the server. Is npm run dev still running?");
    } finally {
      setAnalyzing(false);
    }
  }
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h1 className="text-xl font-semibold">Reviewsume</h1>
        <p className="text-sm text-zinc-500">Check your resume against a job posting</p>
      </header>

      <main className="grid flex-1 grid-cols-1 lg:grid-cols-2">
        {/* ───── LEFT SECTION: inputs ───── */}
        <section className="border-b border-zinc-200 p-6 lg:border-b-0 lg:border-r dark:border-zinc-800">
          <h2 className="text-lg font-medium">Your resume and the job</h2>

          <InputPane
            resumeText={resumeText}
            onResumeTextChange={setResumeText}
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            onAnalyze={handleAnalyze}
            analyzing={analyzing}

          />
        </section>

        {/* ───── RIGHT SECTION: results ───── */}
        <section className="bg-zinc-50 p-6 dark:bg-zinc-900">
          <h2 className="text-lg font-medium">Results</h2>
          <ResultsPane result={result} error={error} analyzing={analyzing} />
        </section>
      </main>
    </div>
  );
}