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

interface CourseOption {
  id: string;
  name: string;
  description: string;
  data: QuizData;
}

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
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 relative z-10 w-full max-w-5xl mx-auto">
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Assessment Portal General Features (6 cols) */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div>
              <span className="inline-flex rounded-full bg-brand-500/10 border border-brand-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-300 mb-4">
                Interactive Study Engine
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                Smart Assessment Portal
              </h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              Welcome to the multi-course study and testing platform. Prepare for your examinations and test your knowledge using our powerful custom learning tools.
            </p>
            
            {/* Features Listing */}
            <div className="space-y-4 pt-2 text-left max-w-md mx-auto lg:mx-0">
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-500/10 text-brand-400 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2M7 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path></svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Dynamic Setup</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Toggle question shuffling and custom countdown timers to simulate real test environments.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-500/10 text-brand-400 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 113.536 0V21h2v-2.238a5.002 5.002 0 01-.012-.008z"></path></svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Instant Study Feedback</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Reveal correct answers immediately upon choice selection to build understanding as you go.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-500/10 text-brand-400 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Progress Cache Auto-Save</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Session state is safely saved to local storage, allowing you to reload the page without progress loss.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-500/10 text-brand-400 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586l6.828-6.828A6 6 0 1121 9z"></path></svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Accessibility Hotkeys</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Select choices using keys <code className="text-brand-350">A</code>, <code className="text-brand-350">B</code>, <code className="text-brand-350">C</code>, or <code className="text-brand-350">D</code> and submit answers with <code className="text-brand-350">Enter</code>.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Settings & Launch (6 cols) */}
          <div className="lg:col-span-6 w-full max-w-xl mx-auto">
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 md:p-8 text-left glass-card space-y-6 relative overflow-hidden">
              {/* Top gradient border for setting panel */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-40" />

              <h2 className="text-base font-bold uppercase tracking-widest text-slate-350 border-b border-slate-850 pb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Assessment Setup
              </h2>

              <div className="space-y-5">
                {/* Course Selector Section */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    Select Course
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCourseId}
                      onChange={(e) => {
                        const nextCourseId = e.target.value;
                        setSelectedCourseId(nextCourseId);
                        const targetCourse = courses.find((c) => c.id === nextCourseId);
                        if (targetCourse) {
                          setAnswers(Array(targetCourse.data.questions.length).fill(-1));
                        }
                      }}
                      className="w-full bg-slate-950/80 border border-slate-850 rounded-xl px-4 py-3.5 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer appearance-none animate-none"
                    >
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Selected Course Metadata Sub-Card */}
                <div className="bg-slate-950/45 border border-slate-850/80 rounded-2xl p-4 space-y-2 relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-brand-500/80" />
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                    <span className="uppercase tracking-widest">Selected Course details</span>
                    <span className="text-brand-350 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold">
                      {meta.course}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-bold text-slate-205 leading-snug">
                    {meta.title}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-normal font-medium">
                    {activeCourse.description}
                  </p>
                  <div className="flex gap-4 pt-2.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-t border-slate-850/50">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                      {meta.totalQuestions} Questions
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Pass mark: {meta.passMark}
                    </span>
                  </div>
                </div>

                {/* Toggles Group */}
                <div className="space-y-4 border-t border-slate-850 pt-4">
                  {/* Shuffle toggle */}
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="pr-4">
                      <span className="text-sm font-semibold text-slate-250 block">Shuffle Questions</span>
                      <span className="text-xs text-slate-500">Randomize question order each attempt</span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.shuffleQuestions}
                        onChange={(e) => setSettings({ ...settings, shuffleQuestions: e.target.checked })}
                        className="sr-only peer"
                        id="toggle-shuffle"
                      />
                      <div className="w-10 h-6 bg-slate-950 border border-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 peer-checked:after:bg-white peer-checked:after:border-brand-500" />
                    </div>
                  </label>

                  {/* LocalStorage toggle */}
                  <label className="flex items-center justify-between cursor-pointer group border-t border-slate-850/50 pt-3.5">
                    <div className="pr-4">
                      <span className="text-sm font-semibold text-slate-250 block">Preserve Progress</span>
                      <span className="text-xs text-slate-500">Auto-save answers to local storage</span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.enableLocalStorage}
                        onChange={(e) => setSettings({ ...settings, enableLocalStorage: e.target.checked })}
                        className="sr-only peer"
                        id="toggle-localStorage"
                      />
                      <div className="w-10 h-6 bg-slate-950 border border-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 peer-checked:after:bg-white peer-checked:after:border-brand-500" />
                    </div>
                  </label>

                  {/* Instant Feedback toggle */}
                  <label className="flex items-center justify-between cursor-pointer group border-t border-slate-850/50 pt-3.5">
                    <div className="pr-4">
                      <span className="text-sm font-semibold text-slate-250 block">Instant Feedback Mode</span>
                      <span className="text-xs text-slate-500">Reveal correct answers immediately</span>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.instantFeedback}
                        onChange={(e) => setSettings({ ...settings, instantFeedback: e.target.checked })}
                        className="sr-only peer"
                        id="toggle-feedback"
                      />
                      <div className="w-10 h-6 bg-slate-950 border border-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600 peer-checked:after:bg-white peer-checked:after:border-brand-500" />
                    </div>
                  </label>
                </div>

                {/* Timer options dropdown */}
                <div className="flex items-center justify-between gap-4 border-t border-slate-850 pt-4">
                  <div>
                    <span className="text-sm font-semibold text-slate-250 block">Question Time Limit</span>
                    <span className="text-xs text-slate-500">Autocompletes upon expiry</span>
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

              {/* Start Action Panel */}
              <div className="pt-4 flex flex-col items-center gap-3">
                <button
                  onClick={startQuiz}
                  className="w-full px-10 py-4 rounded-xl font-bold uppercase tracking-wider premium-btn text-white text-sm cursor-pointer"
                >
                  Start Assessment
                </button>
              </div>
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
        <div className="flex items-center gap-4">
          <span className="font-mono text-slate-500">
            Elapsed: {formatTimeSpent(timeSpent)}
          </span>
          <button
            onClick={() => setShowQuitConfirm(true)}
            className="text-red-405 hover:text-red-300 font-bold uppercase tracking-wider text-[10px] border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer"
          >
            Quit
          </button>
        </div>
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

      {/* Quit Confirmation Modal Overlay */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0b081e] p-6 md:p-8 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
            <h3 className="text-lg font-bold text-white mb-2">Quit Assessment?</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Are you sure you want to quit the assessment? Your current session progress will be reset.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="px-4 py-2 text-xs md:text-sm font-semibold rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowQuitConfirm(false);
                  restartQuiz(); // Reset progress and return to onboarding screen
                }}
                className="px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl bg-red-650 hover:bg-red-550 text-white transition duration-200 cursor-pointer shadow-[0_4px_14px_rgba(239,68,68,0.35)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.45)]"
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
