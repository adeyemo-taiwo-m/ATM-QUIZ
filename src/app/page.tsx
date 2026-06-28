import cpe310Data from "@/data/cpe310-quiz.json";
import { QuizData } from "@/types/quiz";
import QuizShell from "@/components/QuizShell";

export default function Home() {
  const courses = [
    {
      id: "cpe310",
      name: "CPE310 – Agent-Based Systems Quiz",
      description: "Self-assessment on Agent-Based Systems. Test your comprehension of agent modules, traditional reasoning, and Agentic AI.",
      data: cpe310Data as QuizData,
    },
  ];

  return <QuizShell courses={courses} />;
}
