"use client";

import { useState } from "react";
import InputPane from "@/components/InputPane";

export default function Home() {
  // Shared data: the input pane edits it, and Analyze (5.3) will send it.
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");

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
            onAnalyze={() => alert("Analyze is wired up in 5.3!")}
            analyzing={false}
          />
        </section>

        {/* ───── RIGHT SECTION: results ───── */}
        <section className="bg-zinc-50 p-6 dark:bg-zinc-900">
          <h2 className="text-lg font-medium">Results</h2>
        </section>
      </main>
    </div>
  );
}