"use client";

import { useState } from "react";
import type { ReviewResult } from "@/lib/review/schemas";
import TodoList from "@/components/TodoList";
import BulletList from "@/components/BulletList";
import KeywordList from "@/components/KeywordList";

// The only three values a tab id can have. A typo like "todos" becomes a red underline.
type Tab = "todo" | "bullets" | "keywords";

type ResultTabsProps = {
  result: ReviewResult;
};

export default function ResultTabs({ result }: ResultTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("todo");

  const missingSkills = result.skills.filter((skill) => !skill.found).length;
  const missingKeywords = result.keywords.filter((keyword) => !keyword.found).length;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "todo", label: "To-do", count: missingSkills },
    { id: "bullets", label: "Weak bullets", count: result.weakBullets.length },
    { id: "keywords", label: "Keywords", count: missingKeywords },
  ];

  return (
    <div>
      <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-700" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium sm:px-4 ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === "todo" && <TodoList skills={result.skills} />}
        {activeTab === "bullets" && <BulletList bullets={result.weakBullets} />}
        {activeTab === "keywords" && <KeywordList keywords={result.keywords} />}
      </div>
    </div>
  );
}