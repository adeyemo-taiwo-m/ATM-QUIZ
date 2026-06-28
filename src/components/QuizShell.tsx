"use client";

import { useState, useEffect, useRef } from "react";
import { QuizData, QuizState, Question, QuizSettings } from "@/types/quiz";
import QuestionCard from "./QuestionCard";
import ResultScreen from "./ResultScreen";

interface ShuffledQuestion {
  question: Question;
  originalIndex: number;
}

const STORAGE_KEY_STATE = "cpe310_quiz_state";
const STORAGE_KEY_SETTINGS = "cpe310_quiz_settings";

export default function QuizShell({ data }: { data: QuizData }) {
  const { meta, questions } = data;

  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<QuizState>("idle");
  const [current, setCurrent] = useState(0); // Index of current question in activeQuestions array
  const [answers, setAnswers] = useState<number[]>(() => Array(questions.length).fill(-1));
  const [timeSpent, setTimeSpent] = useState(0); // Total seconds spent on quiz

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
        // Ensure meta titles match to verify it's the same quiz
        if (parsed.quizTitle === meta.title) {
          setState(parsed.state);
          setCurrent(parsed.current);
          setAnswers(parsed.answers);
          setTimeSpent(parsed.timeSpent || 0);
          
          // Re-map active questions
          if (parsed.activeQuestionsOrder) {
            const mapped: ShuffledQuestion[] = parsed.activeQuestionsOrder.map((item: any) => ({
              question: questions[item.originalIndex],
              originalIndex: item.originalIndex,
            }));
            setActiveQuestions(mapped);
          } else {
            setActiveQuestions(questions.map((q, i) => ({ question: q, originalIndex: i })));
          }
        }
      }
    } catch (e) {
      console.error("Error loading local storage state:", e);
    }
  }, [meta.title, questions]);

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
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-brand-500" />
          <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Loading assessment...</span>
        </div>
      </div>
    );
  }

  // ── IDLE / START SCREEN ──────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 relative z-10">
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full text-center space-y-6">
          <span className="inline-flex rounded-full bg-brand-500/10 border border-brand-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-300">
            {meta.course}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white tracking-tight">
            {meta.title}
          </h1>
          <p className="text-slate-400 text-sm md:text-base font-medium max-w-md mx-auto">
            Self-assessment on Agent-Based Systems. Test your comprehension of agent modules, traditional reasoning, and Agentic AI.
          </p>

          <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-5 md:p-6 text-left glass-card space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-850 pb-2">
              Quiz Setup Options
            </h2>
            
            <div className="space-y-4">
              {/* Shuffle toggle */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-sm font-semibold text-slate-250 block">Shuffle Questions</span>
                  <span className="text-xs text-slate-500">Randomize question order each attempt</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.shuffleQuestions}
                  onChange={(e) => setSettings({ ...settings, shuffleQuestions: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 bg-slate-900 border-slate-700 focus:ring-brand-500 cursor-pointer"
                />
              </label>

              {/* LocalStorage toggle */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-sm font-semibold text-slate-250 block">Preserve Progress</span>
                  <span className="text-xs text-slate-500">Auto-save answers to local storage</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableLocalStorage}
                  onChange={(e) => setSettings({ ...settings, enableLocalStorage: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 bg-slate-900 border-slate-700 focus:ring-brand-500 cursor-pointer"
                />
              </label>

              {/* Instant Feedback toggle */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-sm font-semibold text-slate-250 block">Instant Feedback Mode</span>
                  <span className="text-xs text-slate-500">Reveal correct answer immediately upon selection</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.instantFeedback}
                  onChange={(e) => setSettings({ ...settings, instantFeedback: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 bg-slate-900 border-slate-700 focus:ring-brand-500 cursor-pointer"
                />
              </label>

              {/* Timer options */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-semibold text-slate-250 block">Question Time Limit</span>
                  <span className="text-xs text-slate-500">Autocompletes question upon expiry</span>
                </div>
                <select
                  value={settings.timeLimitPerQuestion}
                  onChange={(e) => setSettings({ ...settings, timeLimitPerQuestion: Number(e.target.value) })}
                  className="bg-slate-950/80 border border-slate-850 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-350 focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value={0}>No limit</option>
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col items-center gap-2">
            <button
              onClick={startQuiz}
              className="w-full sm:w-auto px-10 py-3.5 rounded-xl font-bold uppercase tracking-wider premium-btn text-white text-sm cursor-pointer"
            >
              Start Assessment
            </button>
            <span className="text-slate-500 text-xs mt-2">
              {meta.totalQuestions} questions · Requires {meta.passMark} to pass
            </span>
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

  // Format total elapsed time spent
  const formatTimeSpent = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 relative z-10">
      {/* Header bar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6 text-xs md:text-sm text-slate-450 font-bold uppercase tracking-wide">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
          {meta.course} assessment
        </span>
        <span className="font-mono text-slate-500">
          Elapsed: {formatTimeSpent(timeSpent)}
        </span>
      </div>

      {/* Progress & Time tracking */}
      <div className="mb-8 w-full max-w-2xl">
        <div className="mb-2.5 flex justify-between items-end text-xs md:text-sm text-slate-400 font-semibold">
          <span>
            Question <span className="text-slate-100 font-bold">{current + 1}</span> of {activeQuestions.length}
          </span>
          <span className="font-mono text-slate-450">{Math.round(progress)}% Complete</span>
        </div>
        
        {/* Progress track */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-850/80">
          <div
            className="h-full rounded-full progress-bar-fill transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time Limit Visual Counter */}
        {settings.timeLimitPerQuestion > 0 && (
          <div className="mt-3.5 flex items-center gap-3 bg-slate-950/40 border border-slate-850/60 rounded-xl px-4 py-2">
            <span className="text-xs text-slate-550 font-bold uppercase tracking-wide">Timer</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 5 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-brand-500"
                }`}
                style={{ width: `${(timeLeft / settings.timeLimitPerQuestion) * 100}%` }}
              />
            </div>
            <span className={`font-mono text-xs font-bold leading-none ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-slate-350"}`}>
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      {q && (
        <QuestionCard
          question={q}
          selected={answers[originalIndex]}
          onSelect={selectAnswer}
          showFeedback={settings.instantFeedback && isAnswered}
        />
      )}

      {/* Navigation panel */}
      <div className="mt-6 flex w-full max-w-2xl justify-between gap-4">
        <button
          onClick={prevQuestion}
          disabled={current === 0}
          className="px-6 py-2.5 rounded-xl border border-slate-800 text-xs md:text-sm font-semibold text-slate-300 transition-all duration-200 bg-slate-900/20 hover:bg-slate-800 hover:text-slate-100 hover:border-slate-700 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
        >
          ← Back
        </button>
        <button
          onClick={nextQuestion}
          disabled={!isAnswered && settings.timeLimitPerQuestion === 0}
          className={`px-7 py-2.5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            isAnswered
              ? "premium-btn text-white"
              : "bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-40"
          }`}
        >
          {current === activeQuestions.length - 1 ? "Submit Report" : "Next →"}
        </button>
      </div>
    </main>
  );
}
