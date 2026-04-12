"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import Header  from "@/components/Header";
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
    <div>
      <Header />
  
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-center text-center px-6">
    

    {/* HERO TITLE */}
    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-4">
      🤖 AI Tutor Assistant
    </h1>

    {/* TAGLINE */}
    <p className="text-lg md:text-xl text-gray-600 max-w-xl mb-8">
      Turn any topic into structured notes or professional presentations in seconds.
    </p>

    {/* BUTTONS */}
    <div className="flex gap-6">

      <button
        onClick={() => router.push("/ppt")}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-lg shadow-lg transition"
      >
        📊 Generate PPT
      </button>

      <button
        onClick={() => router.push("/notes")}
        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl text-lg shadow-lg transition"
      >
        📝 Generate Notes
      </button>

    </div>

    {/* FEATURES */}
    <div className="mt-12 text-gray-600 space-y-2">
      <p>⚡ Instant AI Generation</p>
      <p>📚 Structured & Easy to Learn</p>
      <p>🎯 Perfect for Students & Exams</p>
    </div>

  </div>
  </div>
);
}