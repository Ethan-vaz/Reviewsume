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
    // PART 1: your code here
  }

  // Must match the server's minimum (100 characters), so the button never sends doomed requests.
  const canAnalyze =
    resumeText.trim().length >= 100 &&
    jobDescription.trim().length >= 100 &&
    !uploading &&
    !analyzing;

  return (
    <div className="mt-4 space-y-6">
      {/* PART 2: your JSX here */}
    </div>
  );
}