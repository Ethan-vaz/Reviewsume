"use client";

import { useState } from "react";

type InputPaneProps = {
  resumeText: string;
  onResumeTextChange: (text: string) => void;
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
};

export default function InputPane({
  resumeText,
  onResumeTextChange,
  jobDescription,
  onJobDescriptionChange,
  onAnalyze,
  analyzing,
}: InputPaneProps) {
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setFileName("");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        onResumeTextChange(data.text);
        setFileName(file.name);
      } else {
        setUploadError(data.error);
      }
    } catch {
      setUploadError("Could not reach the server.");
    } finally {
      setUploading(false);
      event.target.value = ""; // lets you pick the same file again
    }
  }

  // Must match the server's minimum (100 characters), so the button never sends doomed requests.
  const canAnalyze =
    resumeText.trim().length >= 100 &&
    jobDescription.trim().length >= 100 &&
    !uploading &&
    !analyzing;

  return (
    <div className="mt-4 space-y-6">
      {/* 1. Resume upload (complete, use it as your example) */}
      <div>
        <label htmlFor="resume-file" className="mb-1 block text-sm font-medium">
          Resume (PDF or DOCX)
        </label>
        <input
          id="resume-file"
          type="file"
          accept=".pdf,.docx"
          onChange={handleFile}
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-200 file:px-3 file:py-1.5 dark:file:bg-zinc-800"
        />
        {uploading && <p className="mt-2 text-sm text-zinc-500">Reading file…</p>}
        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        {fileName && <p className="mt-2 text-sm text-zinc-500">Loaded: {fileName}</p>}
      </div>

      {/* 2. Resume text */}
      <div>
        <label htmlFor="resume-text" className="mb-1 block text-sm font-medium">
          Resume text
        </label>
        <textarea
          id="resume-text"
          value={resumeText}
          onChange={(e) => onResumeTextChange(e.target.value)}
          placeholder="Upload a file above, or paste your resume text here"
          className="h-56 w-full rounded-md border border-zinc-300 bg-transparent p-3 text-sm dark:border-zinc-700"
        />
      </div>

      {/* 3. Job description */}
      <div>
        <label htmlFor="job-description" className="mb-1 block text-sm font-medium">
          Job description
        </label>
        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="Paste the full job posting here"
          className="h-56 w-full rounded-md border border-zinc-300 bg-transparent p-3 text-sm dark:border-zinc-700"
        />
      </div>

      {/* 4. Analyze button */}
      <button
        onClick={onAnalyze}
        disabled={!canAnalyze}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {analyzing ? "Analyzing…" : "Analyze"}
      </button>
    </div>
  );
}