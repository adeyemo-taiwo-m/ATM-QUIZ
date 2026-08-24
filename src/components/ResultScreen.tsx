"use client";

import { useState } from "react";
import { Question } from "@/types/quiz";
import DataTable from "./DataTable";

interface Props {
  score: number;
  total: number;
  passMark: number;
  questions: Question[];
  answers: number[];
  onRestart: () => void;
  timeSpent?: number; // Optional time spent in seconds
}

const LABELS = ["A", "B", "C", "D", "E", "F"];

export default function ResultScreen({
  score,
  total,
  passMark,
  questions,
  answers,
  onRestart,
  timeSpent,
}: Props) {
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect">("all");
  const passed = score >= passMark;
  const percentage = Math.round((score / total) * 100);

  // Helper to extract option text
  const getOptionText = (opt: any) => {
    if (typeof opt === "object" && opt !== null && "text" in opt) {
      return opt.text;
    }
    return String(opt);
  };

  // SVG Circle calculations
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Format timeSpent (seconds) to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter questions based on selected tab
  const filteredQuestions = questions.map((q, idx) => ({ q, idx })).filter(({ q, idx }) => {
    const isCorrect = answers[idx] === q.correctAnswer;
    if (filter === "correct") return isCorrect;
    if (filter === "incorrect") return !isCorrect;
    return true;
  });

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12 md:py-20 relative z-10 space-y-10">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

      {/* Main Score Panel */}
      <div className="rounded-3xl glass-card p-6 sm:p-8 md:p-10 text-center relative overflow-hidden border border-white/[0.08] shadow-2xl space-y-8">
        {/* Top pass/fail border */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${passed ? "bg-emerald-500" : "bg-red-500"}`} />

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-semibold uppercase tracking-wider text-slate-400">
            Performance Summary
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Assessment Completed
          </h1>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-around gap-8 pt-2">
          {/* Radial score gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-40 h-40 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-800 fill-none"
                strokeWidth={strokeWidth}
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className={`fill-none transition-all duration-1000 ease-out ${
                  passed ? "stroke-emerald-500" : "stroke-red-500"
                }`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl sm:text-5xl font-black text-white">{percentage}%</span>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mt-1">
                Final Score
              </p>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="flex-1 grid grid-cols-2 gap-3.5 w-full text-left">
            <div className="bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 sm:p-4.5 transition-all duration-200">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                Correct Answers
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {score} <span className="text-sm font-normal text-slate-500">/ {total}</span>
              </span>
            </div>

            <div className="bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 sm:p-4.5 transition-all duration-200">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                Passing Requirement
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-300">
                {passMark} <span className="text-sm font-normal text-slate-500">min</span>
              </span>
            </div>

            <div className="bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 sm:p-4.5 transition-all duration-200">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                Assessment Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-1 ${
                  passed
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}
              >
                {passed ? "Passed ✓" : "Failed ✗"}
              </span>
            </div>

            {timeSpent !== undefined && (
              <div className="bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 sm:p-4.5 transition-all duration-200">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                  Time Taken
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-300">{formatTime(timeSpent)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <button
            onClick={onRestart}
            className="px-10 py-4 rounded-2xl font-bold uppercase tracking-wider premium-btn text-white text-sm cursor-pointer shadow-lg hover:shadow-brand-500/25 transition-all"
          >
            Retake Assessment
          </button>
        </div>
      </div>

      {/* Filter Tabs & Section Header */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-200">
              Answer Review Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Inspect each question and verify explanations</p>
          </div>

          <div className="flex gap-1.5 bg-white/[0.025] p-1 rounded-2xl border border-white/[0.06] self-start sm:self-auto">
            {(["all", "correct", "incorrect"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                  filter === tab
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Answer Lists */}
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-white/[0.06] bg-white/[0.015] text-slate-500 text-sm">
            No questions fit this filter.
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredQuestions.map(({ q, idx }) => {
              const userAns = answers[idx];
              const correct = q.correctAnswer;
              const isCorrect = userAns === correct;

              return (
                <li
                  key={q.id}
                  className={`rounded-3xl border p-6 md:p-7 transition-all duration-300 space-y-4 ${
                    isCorrect
                      ? "border-emerald-500/25 bg-emerald-500/[0.03] shadow-sm"
                      : "border-red-500/25 bg-red-500/[0.03] shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-bold text-slate-100 leading-snug text-base md:text-lg">
                      <span className="text-brand-400 font-bold mr-2">{idx + 1}.</span>
                      {q.question}
                    </p>
                    <span
                      className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black shadow-sm ${
                        isCorrect ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {isCorrect ? "✓" : "✗"}
                    </span>
                  </div>

                  {/* Context in review */}
                  {q.context && q.context.trim() !== "" && (
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
                      <span className="text-brand-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                        Scenario:
                      </span>
                      {q.context}
                    </div>
                  )}

                  {/* Table in review */}
                  {q.table && (
                    <div className="w-full">
                      <DataTable table={q.table} compact />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 pl-4 border-l-2 border-white/[0.06]">
                    {q.options.map((opt, oi) => {
                      const isUser = oi === userAns;
                      const isRight = oi === correct;
                      const optText = getOptionText(opt);

                      let optionStyle = "text-slate-500 border-transparent bg-transparent";
                      if (isRight) {
                        optionStyle = "text-emerald-300 font-semibold border-emerald-500/30 bg-emerald-500/10";
                      } else if (isUser && !isRight) {
                        optionStyle = "text-red-300 line-through border-red-500/30 bg-red-500/10";
                      }

                      return (
                        <div
                          key={oi}
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm ${optionStyle}`}
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold border ${
                              isRight
                                ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                                : isUser && !isRight
                                ? "border-red-500/40 bg-red-500/20 text-red-300"
                                : "border-white/[0.08] text-slate-500 bg-white/[0.02]"
                            }`}
                          >
                            {LABELS[oi] || String(oi + 1)}
                          </span>
                          <span className="leading-snug">{optText}</span>
                          {isRight && <span className="ml-auto text-emerald-400 font-black">✓</span>}
                          {isUser && !isRight && <span className="ml-auto text-red-400 font-black">✗</span>}
                        </div>
                      );
                    })}
                  </div>

                  {userAns === -1 && (
                    <p className="text-xs text-slate-500 italic pl-4">Question was skipped / unanswered</p>
                  )}

                  {q.note && (
                    <p className="text-[11px] font-mono text-slate-500 pl-4">ℹ️ {q.note}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

