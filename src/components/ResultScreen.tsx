"use client";

import { useState } from "react";
import { Question } from "@/types/quiz";

interface Props {
  score: number;
  total: number;
  passMark: number;
  questions: Question[];
  answers: number[];
  onRestart: () => void;
  timeSpent?: number; // Optional time spent in seconds
}

const LABELS = ["A", "B", "C", "D"];

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
    <main className="mx-auto max-w-3xl px-4 py-12 relative z-10">
      {/* Background glowing decorations */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

      {/* Main Score Panel */}
      <div className="mb-10 rounded-3xl glass-card p-8 text-center relative overflow-hidden">
        {/* Top pass/fail border */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${passed ? "bg-emerald-500" : "bg-red-500"}`} />

        <h1 className="text-2xl font-bold tracking-tight text-slate-350 mb-6">Quiz Completion Report</h1>

        <div className="flex flex-col md:flex-row items-center justify-around gap-8">
          {/* Radial score gauge */}
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-slate-800 fill-none"
                strokeWidth={strokeWidth}
              />
              {/* Progress circle */}
              <circle
                cx="72"
                cy="72"
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
              <span className="text-4xl font-extrabold text-white">{percentage}%</span>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5">
                Score
              </p>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="flex-1 grid grid-cols-2 gap-4 w-full text-left">
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                Correct Answers
              </span>
              <span className="text-2xl font-bold text-white">
                {score} <span className="text-sm font-normal text-slate-500">/ {total}</span>
              </span>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                Passing Requirement
              </span>
              <span className="text-2xl font-bold text-slate-300">
                {passMark} <span className="text-sm font-normal text-slate-500">min</span>
              </span>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                Result Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mt-1 ${
                  passed
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {passed ? "Passed ✓" : "Failed ✗"}
              </span>
            </div>
            {timeSpent !== undefined && (
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                  Time Taken
                </span>
                <span className="text-2xl font-bold text-slate-300">{formatTime(timeSpent)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button onClick={onRestart} className="px-8 py-3 rounded-xl font-semibold premium-btn text-white cursor-pointer">
            Retake Assessment
          </button>
        </div>
      </div>

      {/* Filter Tabs for Answers */}
      <div className="flex items-center justify-between border-b border-slate-800 mb-6 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
          Answer Assessment Review
        </h2>
        <div className="flex gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800/85">
          {(["all", "correct", "incorrect"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wide transition-all cursor-pointer ${
                filter === tab
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Answer Lists */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-slate-800 bg-slate-900/20 text-slate-500 text-sm">
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
                className={`rounded-2xl border p-5 md:p-6 transition-all duration-300 ${
                  isCorrect
                    ? "border-emerald-800/40 bg-emerald-950/10 shadow-sm shadow-emerald-950/5"
                    : "border-red-800/40 bg-red-950/10 shadow-sm shadow-red-950/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <p className="font-semibold text-slate-200 leading-snug md:text-base">
                    <span className="text-slate-550 font-bold mr-1.5">{idx + 1}.</span>
                    {q.question}
                  </p>
                  <span
                    className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shadow-sm ${
                      isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {isCorrect ? "✓" : "✗"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pl-4 border-l-2 border-slate-800/60">
                  {q.options.map((opt, oi) => {
                    const isUser = oi === userAns;
                    const isRight = oi === correct;

                    let optionStyle = "text-slate-500 border-transparent bg-transparent";
                    if (isRight) {
                      optionStyle = "text-emerald-400 font-semibold border-emerald-800/30 bg-emerald-500/5";
                    } else if (isUser && !isRight) {
                      optionStyle = "text-red-400 line-through border-red-800/30 bg-red-500/5";
                    }

                    return (
                      <div
                        key={oi}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs md:text-sm ${optionStyle}`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold border ${
                            isRight
                              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-350"
                              : isUser && !isRight
                              ? "border-red-500/40 bg-red-500/20 text-red-350"
                              : "border-slate-800 text-slate-650"
                          }`}
                        >
                          {LABELS[oi]}
                        </span>
                        <span className="leading-tight">{opt}</span>
                        {isRight && <span className="ml-auto text-emerald-450 font-black">✓</span>}
                        {isUser && !isRight && <span className="ml-auto text-red-450 font-black">✗</span>}
                      </div>
                    );
                  })}
                </div>

                {userAns === -1 && (
                  <p className="mt-3 text-xs text-slate-500 italic pl-4">Not answered</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
