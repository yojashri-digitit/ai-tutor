"use client";

import { useState, useEffect, useRef } from "react";
import Message from "./Message";
import { chat } from "@/services/tutor.service";
import toast from "react-hot-toast";

type MessageType = {
  role: "user" | "ai";
  text: string;
};

export default function ChatUI() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [course, setCourse] = useState("");
  const [customCourse, setCustomCourse] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const finalCourse =
    course === "Other" ? customCourse.trim() : course;

  ////////////////////////////////////////////
  // 🔽 AUTO SCROLL
  ////////////////////////////////////////////
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  ////////////////////////////////////////////
  // 🚀 SEND MESSAGE
  ////////////////////////////////////////////
  const sendMessage = async () => {
    if (loading) return; // 🔥 prevent spam

    const text = input.trim();

    if (!text) return;

    if (!finalCourse) {
      toast.error("Please select or enter a course");
      return;
    }

    if (text.length < 3) {
      toast.error("Enter a meaningful question");
      return;
    }

    const userMsg: MessageType = {
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await chat({
        course: finalCourse,
        question: text, // ✅ FIXED (use stored value)
      });

      const aiText =
        res.data?.content ||
        res.data?.answer ||
        "No response from AI";

      const aiMsg: MessageType = {
        role: "ai",
        text: aiText,
      };

      // ✅ single update (safer)
      setMessages((prev) => [...prev, aiMsg]);

    } catch (err: any) {
      console.error(err);

      toast.error(err?.customMessage || "Failed to fetch response");

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "⚠️ Error fetching response",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  ////////////////////////////////////////////
  // ⌨️ ENTER SUPPORT
  ////////////////////////////////////////////
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  ////////////////////////////////////////////
  // 🎨 UI
  ////////////////////////////////////////////
  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">

      {/* 🔹 HEADER */}
      <div className="p-4 border-b flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-gray-800">
          🎓 Course Assistant
        </h2>

        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Course</option>
          <option value="CSE">CSE</option>
          <option value="ECE">ECE</option>
          <option value="Other">Other</option>
        </select>

        {course === "Other" && (
          <input
            type="text"
            placeholder="Enter your course"
            value={customCourse}
            onChange={(e) => setCustomCourse(e.target.value)}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* 🔹 CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">

        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            💬 Ask course-related questions  
            <br />
            🎯 Get accurate AI explanations
          </div>
        )}

        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.text} />
        ))}

        {loading && (
          <div className="text-gray-500 text-sm animate-pulse">
            🤖 AI is thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 🔹 INPUT */}
      <div className="p-4 border-t bg-white flex gap-2">

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Ask anything..."
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white px-5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}