"use client";

import { useEffect } from "react";
import { Question } from "@/types/quiz";

interface Props {
  question: Question;
  selected: number;          // -1 = none selected yet
  onSelect: (i: number) => void;
  showFeedback?: boolean;
}

const LABELS = ["A", "B", "C", "D"];

export default function QuestionCard({ question, selected, onSelect, showFeedback = false }: Props) {
  // Bind keyboard shortcuts A, B, C, D to options
  useEffect(() => {
    if (showFeedback) return; // Disable keyboard inputs once answer is locked in feedback mode

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      
      const key = e.key.toUpperCase();
      const index = LABELS.indexOf(key);
      if (index >= 0 && index < question.options.length) {
        onSelect(index);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question.options.length, onSelect, showFeedback]);

  return (
    <div className="w-full max-w-2xl rounded-2xl glass-card p-6 md:p-8 relative overflow-hidden transition-all duration-300">
      {/* Decorative inner glow line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-60" />
      
      <p className="mb-8 text-lg md:text-xl font-semibold leading-relaxed text-slate-100 tracking-tight">
        {question.question}
      </p>

      <ul className="space-y-4">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = question.correctAnswer === i;
          
          let btnStyle = "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40";
          let labelStyle = "border-slate-700 bg-slate-850 text-slate-400 group-hover:border-slate-500 group-hover:text-slate-350";
          
          if (showFeedback) {
            if (isCorrect) {
              // Highlight correct answer in green
              btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-md shadow-emerald-500/5 cursor-default";
              labelStyle = "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]";
            } else if (isSelected) {
              // Highlight wrong selected answer in red
              btnStyle = "border-red-500 bg-red-500/10 text-red-300 shadow-md shadow-red-500/5 cursor-default";
              labelStyle = "border-red-400 bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]";
            } else {
              // Dim other options
              btnStyle = "border-slate-900 bg-slate-950/20 text-slate-600 opacity-40 cursor-default";
              labelStyle = "border-slate-800 bg-slate-900 text-slate-700";
            }
          } else if (isSelected) {
            btnStyle = "border-brand-500 bg-brand-500/10 text-brand-300 shadow-md shadow-brand-500/5";
            labelStyle = "border-brand-400 bg-brand-500 text-white shadow-[0_0_8px_rgba(139,92,246,0.5)]";
          }

          return (
            <li key={i}>
              <button
                onClick={() => !showFeedback && onSelect(i)}
                disabled={showFeedback}
                className={`group flex w-full items-center justify-between gap-4 rounded-xl border px-5 py-4 text-left text-sm md:text-base font-medium option-btn transition-all duration-200
                  ${btnStyle}`}
              >
                <div className="flex items-center gap-4">
                  {/* Label sphere */}
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs md:text-sm font-bold transition-all duration-200
                      ${labelStyle}`}
                  >
                    {LABELS[i]}
                  </span>
                  <span className="leading-snug">{opt}</span>
                </div>
                
                {/* Keyboard shortcut hint or correct/incorrect label */}
                {showFeedback ? (
                  isCorrect ? (
                    <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1">
                      Correct ✓
                    </span>
                  ) : isSelected ? (
                    <span className="text-xs font-bold text-red-400 uppercase flex items-center gap-1">
                      Incorrect ✗
                    </span>
                  ) : null
                ) : (
                  <span className="hidden sm:inline text-[10px] font-mono tracking-widest text-slate-600 group-hover:text-slate-500 uppercase px-2 py-0.5 border border-slate-800/60 rounded bg-slate-950/40 transition-colors">
                    Key {LABELS[i]}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
