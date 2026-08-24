"use client";

import { useState, useEffect, useRef } from "react";
import { QuizData, QuizState, Question, QuizSettings } from "@/types/quiz";
import QuestionCard from "./QuestionCard";
import ResultScreen from "./ResultScreen";
import CourseDropdown, { CourseOption } from "./CourseDropdown";

interface ShuffledQuestion {
  question: Question;
  originalIndex: number;
}

const STORAGE_KEY_STATE = "cpe310_quiz_state";
const STORAGE_KEY_SETTINGS = "cpe310_quiz_settings";

export default function QuizShell({ courses }: { courses: CourseOption[] }) {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0].id);

  // Get active course data based on selection
  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const { meta, questions } = activeCourse.data;

  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<QuizState>("idle");
  const [current, setCurrent] = useState(0); // Index of current question in activeQuestions array
  const [answers, setAnswers] = useState<number[]>(() => Array(questions.length).fill(-1));
  const [timeSpent, setTimeSpent] = useState(0); // Total seconds spent on quiz
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Active list of questions (could be shuffled)
  const [activeQuestions, setActiveQuestions] = useState<ShuffledQuestion[]>([]);

  // Settings
  const [settings, setSettings] = useState<QuizSettings>({
    shuffleQuestions: false,
    timeLimitPerQuestion: 0,
    enableLocalStorage: true,
    instantFeedback: false,
  });

  // Timer per question (seconds remaining)
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and load saved state if possible
  useEffect(() => {
    setMounted(true);
    
    // Load settings from local storage
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      const savedState = localStorage.getItem(STORAGE_KEY_STATE);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Find if the saved course is in the available courses list
        const matchingCourse = courses.find(c => c.data.meta.title === parsed.quizTitle);
        if (matchingCourse) {
          setSelectedCourseId(matchingCourse.id);
          setState(parsed.state);
          setCurrent(parsed.current);
          setAnswers(parsed.answers);
          setTimeSpent(parsed.timeSpent || 0);
          
          // Re-map active questions
          if (parsed.activeQuestionsOrder) {
            const mapped: ShuffledQuestion[] = parsed.activeQuestionsOrder.map((item: any) => ({
              question: matchingCourse.data.questions[item.originalIndex],
              originalIndex: item.originalIndex,
            }));
            setActiveQuestions(mapped);
          } else {
            setActiveQuestions(matchingCourse.data.questions.map((q, i) => ({ question: q, originalIndex: i })));
          }
        }
      }
    } catch (e) {
      console.error("Error loading local storage state:", e);
    }
  }, [courses]);

  // Save state to local storage when state/current/answers change
  useEffect(() => {
    if (!mounted || !settings.enableLocalStorage) return;

    try {
      if (state === "running") {
        const stateToSave = {
          quizTitle: meta.title,
          state,
          current,
          answers,
          timeSpent,
          activeQuestionsOrder: activeQuestions.map((aq) => ({ originalIndex: aq.originalIndex })),
        };
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(stateToSave));
      } else if (state === "idle" || state === "done") {
        localStorage.removeItem(STORAGE_KEY_STATE);
      }
    } catch (e) {
      console.error("Error saving local storage state:", e);
    }
  }, [state, current, answers, timeSpent, activeQuestions, settings.enableLocalStorage, meta.title, mounted]);

  // Save settings when they change
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error("Error saving settings:", e);
    }
  }, [settings, mounted]);

  // Total Timer Effect
  useEffect(() => {
    if (state === "running") {
      totalTimerIntervalRef.current = setInterval(() => {
        setTimeSpent((t) => t + 1);
      }, 1000);
    } else {
      if (totalTimerIntervalRef.current) clearInterval(totalTimerIntervalRef.current);
    }

    return () => {
      if (totalTimerIntervalRef.current) clearInterval(totalTimerIntervalRef.current);
    };
  }, [state]);

  // Question Timer Effect
  useEffect(() => {
    if (state === "running" && settings.timeLimitPerQuestion > 0) {
      const originalIndex = activeQuestions[current]?.originalIndex;
      const isCurrentAnswered = originalIndex !== undefined && answers[originalIndex] !== -1;
      
      // Pause timer when feedback is shown
      if (settings.instantFeedback && isCurrentAnswered) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        return;
      }

      // Initialize time limit for the question
      setTimeLeft(settings.timeLimitPerQuestion);

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Out of time! Auto-advance or finish
            clearInterval(timerIntervalRef.current!);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [state, current, settings.timeLimitPerQuestion, answers, settings.instantFeedback, activeQuestions]);

  const handleTimeout = () => {
    // Current active question index
    if (current < activeQuestions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setState("done");
    }
  };

  const startQuiz = () => {
    // Generate active list of questions based on settings
    let qList = questions.map((q, i) => ({ question: q, originalIndex: i }));
    if (settings.shuffleQuestions) {
      qList = [...qList].sort(() => Math.random() - 0.5);
    }
    setActiveQuestions(qList);
    setAnswers(Array(questions.length).fill(-1));
    setCurrent(0);
    setTimeSpent(0);
    setState("running");
  };

  const selectAnswer = (optionIndex: number) => {
    const originalIndex = activeQuestions[current].originalIndex;
    setAnswers((prev) => {
      const next = [...prev];
      next[originalIndex] = optionIndex;
      return next;
    });
  };

  const nextQuestion = () => {
    if (current < activeQuestions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setState("done");
    }
  };

  const prevQuestion = () => {
    setCurrent((c) => Math.max(0, c - 1));
  };

  const restartQuiz = () => {
    setAnswers(Array(questions.length).fill(-1));
    setCurrent(0);
    setTimeSpent(0);
    setState("idle");
  };

  const score = answers.reduce(
    (acc, ans, i) => acc + (ans === questions[i].correctAnswer ? 1 : 0),
    0
  );

  // Avoid Hydration Error: wait until component is mounted in client
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030014] text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-brand-500" />
          <span className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Loading Portal...</span>
        </div>
      </div>
    );
  }

  // ── IDLE / START SCREEN ──────────────────────────────────────────────────
  if (state === "idle") {
    const passPercentage = Math.round((meta.passMark / meta.totalQuestions) * 100);

    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-12 md:py-20 relative z-10 w-full max-w-xl mx-auto">
        {/* Ambient glow backdrop */}
        <div className="absolute top-1/4 -left-12 w-96 h-96 rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-12 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

        <div className="w-full space-y-7">
          {/* Header Section */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold tracking-wide shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              Self-Assessment Portal
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Assessment Setup
            </h1>
            
            <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
              Select your course and customize parameters before starting.
            </p>
          </div>

          {/* Main Configuration Card */}
          <div className="w-full rounded-3xl glass-card p-6 sm:p-8 space-y-6 relative overflow-hidden border border-white/[0.08] shadow-2xl">
            {/* Top subtle gradient line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-60" />

            {/* Course Selector Group */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Select Course
                </label>
                <span className="text-[11px] font-medium text-slate-500">
                  {courses.length} {courses.length === 1 ? "course" : "courses"} available
                </span>
              </div>

              {/* Custom Glassmorphic Course Dropdown */}
              <CourseDropdown
                courses={courses}
                selectedCourseId={selectedCourseId}
                onSelectCourse={(nextCourseId) => {
                  setSelectedCourseId(nextCourseId);
                  const targetCourse = courses.find((c) => c.id === nextCourseId);
                  if (targetCourse) {
                    setAnswers(Array(targetCourse.data.questions.length).fill(-1));
                    setCurrent(0);
                  }
                }}
              />

              {/* Course Meta Info Chips */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.045] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-3.5 transition-all duration-200">
                  <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 shrink-0 text-sm">
                    📋
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Questions</span>
                    <span className="text-sm font-bold text-slate-200">{meta.totalQuestions} Questions</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.045] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-3.5 transition-all duration-200">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 text-sm">
                    🎯
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pass Threshold</span>
                    <span className="text-sm font-bold text-emerald-400">{meta.passMark} ({passPercentage}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Group */}
            <div className="space-y-3 pt-2 border-t border-white/[0.06]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Assessment Preferences
              </h2>

              <div className="space-y-2.5">
                {/* Shuffle Toggle */}
                <label className="flex items-center justify-between px-4.5 py-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.055] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 cursor-pointer group">
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                    Shuffle Questions
                  </span>
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.shuffleQuestions}
                      onChange={(e) => setSettings({ ...settings, shuffleQuestions: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-900 border border-slate-700/80 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-500/40 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-slate-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600 peer-checked:after:bg-white" />
                  </div>
                </label>

                {/* Preserve Progress Toggle */}
                <label className="flex items-center justify-between px-4.5 py-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.055] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 cursor-pointer group">
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                    Preserve Progress
                  </span>
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.enableLocalStorage}
                      onChange={(e) => setSettings({ ...settings, enableLocalStorage: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-900 border border-slate-700/80 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-500/40 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-slate-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600 peer-checked:after:bg-white" />
                  </div>
                </label>

                {/* Instant Feedback Toggle */}
                <label className="flex items-center justify-between px-4.5 py-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.055] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 cursor-pointer group">
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                    Instant Feedback Mode
                  </span>
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={settings.instantFeedback}
                      onChange={(e) => setSettings({ ...settings, instantFeedback: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-900 border border-slate-700/80 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-500/40 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-slate-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600 peer-checked:after:bg-white" />
                  </div>
                </label>

                {/* Time Limit Row */}
                <div className="flex items-center justify-between px-4.5 py-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.055] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200">
                  <span className="text-sm font-semibold text-slate-200">
                    Question Time Limit
                  </span>
                  <div className="relative shrink-0">
                    <select
                      value={settings.timeLimitPerQuestion}
                      onChange={(e) => setSettings({ ...settings, timeLimitPerQuestion: Number(e.target.value) })}
                      className="bg-slate-900 border border-white/10 hover:border-white/20 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer transition-all"
                    >
                      <option value={0}>No limit</option>
                      <option value={15}>15s per question</option>
                      <option value={30}>30s per question</option>
                      <option value={60}>60s per question</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <button
                onClick={startQuiz}
                className="w-full py-4 px-8 rounded-2xl font-bold uppercase tracking-wider premium-btn text-white text-sm md:text-base flex items-center justify-center gap-3 cursor-pointer shadow-lg hover:shadow-brand-500/25 transition-all"
              >
                <span>Start Assessment</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── RESULT SCREEN ────────────────────────────────────────────────────────
  if (state === "done") {
    return (
      <ResultScreen
        score={score}
        total={questions.length}
        passMark={meta.passMark}
        questions={questions}
        answers={answers}
        onRestart={restartQuiz}
        timeSpent={timeSpent}
      />
    );
  }

  // ── RUNNING ──────────────────────────────────────────────────────────────
  const currentItem = activeQuestions[current];
  const q = currentItem?.question;
  const originalIndex = currentItem?.originalIndex;
  const isAnswered = answers[originalIndex] !== -1;
  const progress = ((current + 1) / activeQuestions.length) * 100;

  const formatTimeSpent = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-10 md:py-16 relative z-10 w-full max-w-2xl mx-auto">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between mb-8 py-3.5 px-5 rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-300">
            {meta.course}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-mono text-slate-400">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTimeSpent(timeSpent)}</span>
          </div>

          <button
            onClick={() => setShowQuitConfirm(true)}
            className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            Quit
          </button>
        </div>
      </div>

      {/* Progress tracking */}
      <div className="mb-8 w-full space-y-3">
        <div className="flex justify-between items-center text-xs md:text-sm font-semibold text-slate-400">
          <span>
            Question <span className="text-white font-bold">{current + 1}</span> of {activeQuestions.length}
          </span>
          <span className="font-mono text-brand-300 font-bold">{Math.round(progress)}% Complete</span>
        </div>
        
        {/* Progress track */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-white/[0.06]">
          <div
            className="h-full rounded-full progress-bar-fill transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Per-Question Timer */}
        {settings.timeLimitPerQuestion > 0 && (
          <div className="mt-4 flex items-center gap-3 bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Timer</span>
            <div className="flex-1 h-2 rounded-full bg-slate-900 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 5 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" : "bg-brand-500"
                }`}
                style={{ width: `${(timeLeft / settings.timeLimitPerQuestion) * 100}%` }}
              />
            </div>
            <span className={`font-mono text-xs font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-slate-300"}`}>
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      {/* Question Card */}
      {q && (
        <QuestionCard
          question={q}
          selected={answers[originalIndex]}
          onSelect={selectAnswer}
          showFeedback={settings.instantFeedback && isAnswered}
        />
      )}

      {/* Navigation panel */}
      <div className="mt-8 flex w-full justify-between items-center gap-4">
        <button
          onClick={prevQuestion}
          disabled={current === 0}
          className="px-6 py-3.5 rounded-2xl border border-white/[0.08] text-xs md:text-sm font-bold uppercase tracking-wider text-slate-300 transition-all bg-white/[0.025] hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <button
          onClick={nextQuestion}
          disabled={!isAnswered && settings.timeLimitPerQuestion === 0}
          className={`px-8 py-3.5 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            isAnswered
              ? "premium-btn text-white shadow-lg shadow-brand-500/20"
              : "bg-white/[0.02] border border-white/[0.05] text-slate-600 cursor-not-allowed opacity-40"
          }`}
        >
          <span>{current === activeQuestions.length - 1 ? "Submit Assessment" : "Next Question"}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Quit Confirmation Modal Overlay */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#0b081e] p-7 md:p-8 shadow-2xl relative space-y-5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-600" />
            <h3 className="text-xl font-bold text-white">Quit Assessment?</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Are you sure you want to exit? Your current session progress will be reset.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl border border-white/[0.08] text-slate-300 hover:bg-white/[0.05] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowQuitConfirm(false);
                  restartQuiz();
                }}
                className="px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl bg-red-600 hover:bg-red-500 text-white transition cursor-pointer shadow-lg shadow-red-500/30"
              >
                Yes, Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
