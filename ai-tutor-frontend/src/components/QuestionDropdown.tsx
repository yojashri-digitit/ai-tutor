import { useEffect, useState } from "react";
import { getQuestions } from "@/services/tutor.service";

export default function QuestionDropdown({ chatId }: { chatId: number }) {
  const [questions, setQuestions] = useState<any[]>([]);

  ////////////////////////////////////////////
  // 🔄 LOAD QUESTIONS
  ////////////////////////////////////////////
  useEffect(() => {
    if (!chatId) return;

    const fetchQuestions = async () => {
      try {
        const res = await getQuestions(chatId);

        // ✅ FIXED
        setQuestions(res.questions || []);
      } catch (err) {
        console.error("Failed to load questions");
        setQuestions([]);
      }
    };

    fetchQuestions();
  }, [chatId]);

  ////////////////////////////////////////////
  // 🔽 SCROLL FUNCTION
  ////////////////////////////////////////////
  const scrollToMessage = (id: number) => {
    document
      .getElementById(`msg-${id}`)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  ////////////////////////////////////////////
  // 🎨 UI
  ////////////////////////////////////////////
  return (
    <select
      onChange={(e) => scrollToMessage(Number(e.target.value))}
      className="border p-2 rounded mb-4 w-full"
    >
      <option>Jump to question</option>

      {questions.map((q) => (
        <option key={q.id} value={q.id}>
          {q.content.slice(0, 50)}
        </option>
      ))}
    </select>
  );
}