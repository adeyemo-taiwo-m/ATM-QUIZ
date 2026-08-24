"use client";

import { useEffect } from "react";
import { Question } from "@/types/quiz";
import DataTable from "./DataTable";

interface Props {
  question: Question;
  selected: number;          // -1 = none selected yet
  onSelect: (i: number) => void;
  showFeedback?: boolean;
}

const LABELS = ["A", "B", "C", "D", "E", "F"];

export default function QuestionCard({ question, selected, onSelect, showFeedback = false }: Props) {
  // Bind keyboard shortcuts A, B, C, D, E, F to options
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

  // Helper to extract option text
  const getOptionText = (opt: any) => {
    if (typeof opt === "object" && opt !== null && "text" in opt) {
      return opt.text;
    }
    return String(opt);
  };

  return (
    <div className="w-full rounded-3xl glass-card p-6 sm:p-8 md:p-10 relative overflow-hidden transition-all duration-300 border border-white/[0.08] shadow-2xl space-y-6">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-60" />
      
      {/* Context Scenario (if present) */}
      {question.context && question.context.trim() !== "" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-brand-500/[0.06] border border-brand-500/20 text-slate-300 text-xs sm:text-sm leading-relaxed space-y-1.5 shadow-inner">
          <div className="flex items-center gap-1.5 text-brand-300 font-bold uppercase tracking-wider text-[11px]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Problem Context / Scenario
          </div>
          <p className="text-slate-200">{question.context}</p>
        </div>
      )}

      {/* Structured Table (if present) */}
      {question.table && (
        <div className="w-full">
          <DataTable table={question.table} />
        </div>
      )}

      {/* Main Question Text */}
      <p className="text-lg sm:text-xl md:text-2xl font-bold leading-relaxed text-white tracking-tight">
        {question.question}
      </p>

      {/* Options List */}
      <ul className="space-y-3.5 pt-2">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = question.correctAnswer === i;
          const optText = getOptionText(opt);
          
          let btnStyle = "border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.06] hover:border-white/[0.14] text-slate-200 hover:text-white";
          let labelStyle = "border-white/[0.08] bg-white/[0.04] text-slate-400 group-hover:border-white/[0.2] group-hover:text-white";
          
          if (showFeedback) {
            if (isCorrect) {
              btnStyle = "border-emerald-500/60 bg-emerald-500/10 text-emerald-200 shadow-md shadow-emerald-500/10 cursor-default";
              labelStyle = "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]";
            } else if (isSelected) {
              btnStyle = "border-red-500/60 bg-red-500/10 text-red-200 shadow-md shadow-red-500/10 cursor-default";
              labelStyle = "border-red-400 bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]";
            } else {
              btnStyle = "border-white/[0.03] bg-white/[0.01] text-slate-600 opacity-40 cursor-default";
              labelStyle = "border-white/[0.04] bg-white/[0.02] text-slate-700";
            }
          } else if (isSelected) {
            btnStyle = "border-brand-500/80 bg-brand-500/15 text-white shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/30";
            labelStyle = "border-brand-400 bg-brand-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]";
          }

          return (
            <li key={i}>
              <button
                onClick={() => !showFeedback && onSelect(i)}
                disabled={showFeedback}
                className={`group flex w-full items-center justify-between gap-4 rounded-2xl border p-4.5 sm:p-5 text-left text-sm sm:text-base font-medium option-btn transition-all duration-200 cursor-pointer
                  ${btnStyle}`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border text-xs sm:text-sm font-bold transition-all duration-200
                      ${labelStyle}`}
                  >
                    {LABELS[i] || String(i + 1)}
                  </span>
                  <span className="leading-relaxed font-semibold">{optText}</span>
                </div>
                
                {/* Keyboard shortcut hint or status */}
                {showFeedback ? (
                  isCorrect ? (
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 shrink-0 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      Correct ✓
                    </span>
                  ) : isSelected ? (
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1 shrink-0 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                      Incorrect ✗
                    </span>
                  ) : null
                ) : (
                  <span className="hidden sm:inline-block text-[11px] font-mono tracking-widest text-slate-500 group-hover:text-slate-300 uppercase px-2.5 py-1 border border-white/[0.08] rounded-lg bg-slate-950/60 transition-colors shrink-0">
                    Key {LABELS[i] || String(i + 1)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Note (if present) */}
      {question.note && (
        <div className="pt-2 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
          <span>ℹ️</span>
          <span>{question.note}</span>
        </div>
      )}
    </div>
  );
}

