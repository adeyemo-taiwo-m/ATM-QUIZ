# CPE310 Quiz App — Next.js Implementation Guide

A minimal, self-contained quiz app using Next.js 14 App Router, TypeScript, and Tailwind CSS. No extra libraries needed.

---

## Folder Structure

```
cpe310-quiz/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── QuizShell.tsx       ← stateful controller
│   ├── QuestionCard.tsx    ← single question UI
│   └── ResultScreen.tsx    ← final score view
├── data/
│   └── cpe310-quiz.json    ← paste the JSON file here
├── types/
│   └── quiz.ts             ← shared types
└── tailwind.config.ts
```

---

## 1. Bootstrap the project

```bash
npx create-next-app@latest cpe310-quiz \
  --typescript --tailwind --app --no-src-dir --import-alias "@/*"

cd cpe310-quiz
```

Copy `cpe310-quiz.json` into `data/`.

---

## 2. Types — `types/quiz.ts`

```ts
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;   // 0-based index
}

export interface QuizMeta {
  title: string;
  course: string;
  totalQuestions: number;
  passMark: number;
}

export interface QuizData {
  meta: QuizMeta;
  questions: Question[];
}

export type QuizState = "idle" | "running" | "done";
```

---

## 3. Root layout — `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CPE310 Quiz",
  description: "Agent-Based Systems self-assessment",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
```

---

## 4. Home page — `app/page.tsx`

```tsx
import quizData from "@/data/cpe310-quiz.json";
import { QuizData } from "@/types/quiz";
import QuizShell from "@/components/QuizShell";

export default function Home() {
  return <QuizShell data={quizData as QuizData} />;
}
```

---

## 5. QuizShell — `components/QuizShell.tsx`

This is the only stateful component. It owns: current question index, selected answers array, and quiz state.

```tsx
"use client";

import { useState } from "react";
import { QuizData, QuizState } from "@/types/quiz";
import QuestionCard from "./QuestionCard";
import ResultScreen from "./ResultScreen";

export default function QuizShell({ data }: { data: QuizData }) {
  const { meta, questions } = data;

  const [state, setState] = useState<QuizState>("idle");
  const [current, setCurrent] = useState(0);
  // -1 means unanswered
  const [answers, setAnswers] = useState<number[]>(
    Array(questions.length).fill(-1)
  );

  const select = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = optionIndex;
      return next;
    });
  };

  const next = () => {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
    else setState("done");
  };

  const prev = () => setCurrent((c) => Math.max(0, c - 1));

  const restart = () => {
    setAnswers(Array(questions.length).fill(-1));
    setCurrent(0);
    setState("idle");
  };

  const score = answers.reduce(
    (acc, ans, i) => acc + (ans === questions[i].correctAnswer ? 1 : 0),
    0
  );

  // ── IDLE / START SCREEN ──────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">
          {meta.course}
        </span>
        <h1 className="max-w-lg text-center text-3xl font-bold leading-tight">
          {meta.title}
        </h1>
        <p className="text-slate-400 text-sm">
          {meta.totalQuestions} questions · pass mark {meta.passMark}/{meta.totalQuestions}
        </p>
        <button
          onClick={() => setState("running")}
          className="mt-4 rounded-xl bg-indigo-600 px-8 py-3 font-semibold hover:bg-indigo-500 transition-colors"
        >
          Start Quiz
        </button>
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
        onRestart={restart}
      />
    );
  }

  // ── RUNNING ──────────────────────────────────────────────────────────────
  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {/* Progress bar */}
      <div className="mb-8 w-full max-w-xl">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <QuestionCard
        question={q}
        selected={answers[current]}
        onSelect={select}
      />

      {/* Navigation */}
      <div className="mt-6 flex w-full max-w-xl justify-between gap-3">
        <button
          onClick={prev}
          disabled={current === 0}
          className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-30"
        >
          ← Back
        </button>
        <button
          onClick={next}
          disabled={answers[current] === -1}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold hover:bg-indigo-500 transition disabled:opacity-30"
        >
          {current === questions.length - 1 ? "Submit" : "Next →"}
        </button>
      </div>
    </main>
  );
}
```

---

## 6. QuestionCard — `components/QuestionCard.tsx`

```tsx
import { Question } from "@/types/quiz";

interface Props {
  question: Question;
  selected: number;          // -1 = none selected yet
  onSelect: (i: number) => void;
}

const LABELS = ["A", "B", "C", "D"];

export default function QuestionCard({ question, selected, onSelect }: Props) {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <p className="mb-6 text-base font-medium leading-relaxed text-slate-100">
        {question.question}
      </p>

      <ul className="space-y-3">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <li key={i}>
              <button
                onClick={() => onSelect(i)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all
                  ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                      : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                  }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold
                    ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-500 text-white"
                        : "border-slate-600 text-slate-500"
                    }`}
                >
                  {LABELS[i]}
                </span>
                {opt}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

---

## 7. ResultScreen — `components/ResultScreen.tsx`

Shows score, pass/fail badge, and a full answer review.

```tsx
import { Question } from "@/types/quiz";

interface Props {
  score: number;
  total: number;
  passMark: number;
  questions: Question[];
  answers: number[];
  onRestart: () => void;
}

const LABELS = ["A", "B", "C", "D"];

export default function ResultScreen({
  score, total, passMark, questions, answers, onRestart,
}: Props) {
  const passed = score >= passMark;
  const pct = Math.round((score / total) * 100);

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      {/* Score card */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
        <p className="mb-1 text-sm text-slate-400">Your score</p>
        <p className="text-6xl font-black text-white">
          {score}
          <span className="text-2xl font-normal text-slate-500">/{total}</span>
        </p>
        <p className="mt-1 text-slate-400 text-sm">{pct}%</p>

        <span
          className={`mt-4 inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest
            ${passed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
        >
          {passed ? "Passed ✓" : "Not Yet — Keep Studying"}
        </span>

        <button
          onClick={onRestart}
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold hover:bg-indigo-500 transition-colors"
        >
          Retake Quiz
        </button>
      </div>

      {/* Answer review */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
        Answer Review
      </h2>

      <ul className="space-y-4">
        {questions.map((q, qi) => {
          const userAns = answers[qi];
          const correct = q.correctAnswer;
          const isCorrect = userAns === correct;

          return (
            <li
              key={q.id}
              className={`rounded-xl border p-4 text-sm
                ${isCorrect ? "border-emerald-800/50 bg-emerald-950/30" : "border-red-800/50 bg-red-950/30"}`}
            >
              <p className="mb-2 font-medium text-slate-200 leading-snug">
                {qi + 1}. {q.question}
              </p>

              {q.options.map((opt, oi) => {
                const isUser = oi === userAns;
                const isRight = oi === correct;

                let style = "text-slate-500";
                if (isRight) style = "text-emerald-400 font-semibold";
                else if (isUser && !isRight) style = "text-red-400 line-through";

                return (
                  <p key={oi} className={`${style} ml-2`}>
                    {LABELS[oi]}. {opt}
                    {isRight && " ✓"}
                    {isUser && !isRight && " ✗"}
                  </p>
                );
              })}

              {userAns === -1 && (
                <p className="mt-1 text-slate-500 italic">Not answered</p>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
```

---

## 8. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Quick feature checklist

| Feature | Covered |
|---|---|
| Start screen with meta info | ✅ |
| Progress bar | ✅ |
| Select / deselect answer | ✅ |
| Back navigation (re-answer) | ✅ |
| Prevent advancing without answer | ✅ |
| Final score + pass/fail badge | ✅ |
| Full answer review with correct highlighted | ✅ |
| Retake quiz | ✅ |

---

## Optional enhancements (not in MVP)

- **Shuffle questions** — `questions.sort(() => Math.random() - 0.5)` before passing to shell
- **Timer** — `useEffect` countdown in QuizShell, auto-submit on 0
- **localStorage** — save answers so refresh doesn't lose progress
- **Animated transitions** — wrap QuestionCard in a Framer Motion `AnimatePresence`
