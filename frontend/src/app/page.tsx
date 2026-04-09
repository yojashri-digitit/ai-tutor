"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [course, setCourse] = useState("");
  const [customCourse, setCustomCourse] = useState("");
  const [question, setQuestion] = useState("");

  const finalCourse = course === "Other" ? customCourse : course;

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">

      <h1 className="text-2xl font-bold">AI Tutor Assistant</h1>

      {/* Chat Input */}
      <select onChange={(e) => setCourse(e.target.value)} className="border p-2">
        <option value="">Select Course</option>
        <option>CSE</option>
        <option>ECE</option>
        <option>Mechanical</option>
        <option>Other</option>
      </select>

      {course === "Other" && (
        <input
          placeholder="Enter course"
          onChange={(e) => setCustomCourse(e.target.value)}
          className="border p-2"
        />
      )}

      <input
        placeholder="Ask anything..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="border p-2 w-96"
      />

      <div className="flex gap-4">
        <button
          onClick={() => router.push("/ppt")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Generate PPT
        </button>

        <button
          onClick={() => router.push("/notes")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Generate Notes
        </button>
      </div>
    </div>
  );
}