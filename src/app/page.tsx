import quizData from "@/data/cpe310-quiz.json";
import { QuizData } from "@/types/quiz";
import QuizShell from "@/components/QuizShell";

export default function Home() {
  return <QuizShell data={quizData as QuizData} />;
}
