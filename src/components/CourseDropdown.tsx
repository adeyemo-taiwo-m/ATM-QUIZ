"use client";

import { useState, useRef, useEffect } from "react";
import { QuizData } from "@/types/quiz";

export interface CourseOption {
  id: string;
  name: string;
  description: string;
  data: QuizData;
}

interface Props {
  courses: CourseOption[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
}

export default function CourseDropdown({
  courses,
  selectedCourseId,
  onSelectCourse,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (courseId: string) => {
    onSelectCourse(courseId);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-3 px-4.5 py-3.5 sm:px-5 sm:py-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
          isOpen
            ? "border-brand-500 bg-white/[0.06] shadow-[0_0_20px_rgba(139,92,246,0.25)] ring-2 ring-brand-500/25"
            : "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05] hover:border-white/[0.16]"
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Badge icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-indigo-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-sm shrink-0 shadow-inner">
            {activeCourse.data.meta.course.substring(0, 3)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate block">
                {activeCourse.name}
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-brand-500/15 text-brand-300 border border-brand-500/30">
                {activeCourse.data.meta.totalQuestions} Qs
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {activeCourse.description}
            </p>
          </div>
        </div>

        {/* Chevron icon */}
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 transition-transform duration-300 shrink-0 ${
            isOpen ? "rotate-180 text-brand-300 border-brand-500/40 bg-brand-500/10" : ""
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Glassmorphic Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-3xl bg-[#0a071f]/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 space-y-1 p-2">
          {/* Subtle gradient top accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-80" />

          <div className="px-3 pt-2 pb-1.5 flex items-center justify-between border-b border-white/[0.06] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Assessment Course
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {courses.length} Available
            </span>
          </div>

          <div role="listbox" className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5">
            {courses.map((course) => {
              const isSelected = course.id === selectedCourseId;
              const { meta } = course.data;
              const passPct = Math.round((meta.passMark / meta.totalQuestions) * 100);

              return (
                <button
                  key={course.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(course.id)}
                  className={`w-full flex items-start justify-between gap-3.5 p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer group ${
                    isSelected
                      ? "bg-brand-500/15 border border-brand-500/40 shadow-sm"
                      : "border border-transparent hover:border-white/[0.1] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Course Code Box */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black tracking-wider shrink-0 transition-colors ${
                        isSelected
                          ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                          : "bg-white/[0.04] border border-white/[0.08] text-slate-400 group-hover:text-white group-hover:border-white/[0.2]"
                      }`}
                    >
                      {meta.course}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-bold leading-snug transition-colors ${
                            isSelected ? "text-white" : "text-slate-200 group-hover:text-white"
                          }`}
                        >
                          {course.name}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>

                      {/* Course Quick Stats */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-md">
                          📋 {meta.totalQuestions} Questions
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          🎯 {meta.passMark} Pass ({passPct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className="shrink-0 mt-1">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-brand-500/40">
                        ✓
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-white/[0.1] bg-white/[0.02] group-hover:border-white/[0.3] transition-colors" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
