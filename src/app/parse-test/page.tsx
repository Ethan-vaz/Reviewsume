"use client";

// TEMPORARY test page for Step 2. Visit /parse-test, pick a resume, see the text.
// We'll delete this once the real input pane is built in Step 5.

import { useState } from "react";

export default function ParseTestPage() {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setText("");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setText(data.text);
      else setError(data.error);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Parse test</h1>
      <input type="file" accept=".pdf,.docx" onChange={handleFile} />
      {loading && <p>Reading file…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {text && (
        <pre className="whitespace-pre-wrap rounded border p-4 text-sm">{text}</pre>
      )}
    </main>
  );
}
