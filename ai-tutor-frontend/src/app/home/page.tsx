"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Home() {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [course, setCourse] = useState("");
  const [customCourse, setCustomCourse] = useState("");

  ////////////////////////////////////////////
  // 🔐 AUTH CHECK ON LOAD
  ////////////////////////////////////////////
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get("http://localhost:5000/auth/me", {
          withCredentials: true,
        });
      } catch {
        router.replace("/login"); // 🔥 redirect if not logged in
      }
    };

    checkAuth();
  }, []);

  const finalCourse =
    course === "Other" ? customCourse.trim() : course;

  ////////////////////////////////////////////
  // HANDLERS
  ////////////////////////////////////////////
  const handleChat = () => {
    if (!topic || !finalCourse) {
      alert("Enter topic & course");
      return;
    }

    router.push(
      `/chat?topic=${encodeURIComponent(
        topic
      )}&course=${encodeURIComponent(finalCourse)}`
    );
  };

  const handlePPT = () => {
    if (!topic) {
      alert("Enter topic");
      return;
    }

    router.push(`/ppt?topic=${encodeURIComponent(topic)}`);
  };

  const handleNotes = () => {
    router.push("/notes");
  };

  ////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 bg-gray-50">

      <h1 className="text-3xl font-bold">
        AI Tutor Assistant 🚀
      </h1>

      <div className="w-[500px]">
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="w-full p-3 border rounded-lg mb-2"
        >
          <option value="">Select Course</option>
          <option value="CSE">CSE</option>
          <option value="ECE">ECE</option>
          <option value="MECH">MECH</option>
          <option value="Other">Other</option>
        </select>

        {course === "Other" && (
          <input
            value={customCourse}
            onChange={(e) => setCustomCourse(e.target.value)}
            placeholder="Enter your course"
            className="w-full p-3 border rounded-lg"
          />
        )}
      </div>

      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter topic..."
        className="w-[500px] p-3 border rounded-lg"
      />

      <div className="flex gap-4">

        <button
          onClick={handlePPT}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Generate PPT
        </button>

        <button
          onClick={handleNotes}
          className="bg-green-600 text-white px-6 py-2 rounded-lg"
        >
          Generate Notes
        </button>

        <button
          onClick={handleChat}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg"
        >
          Chat 💬
        </button>

      </div>
    </div>
  );
}