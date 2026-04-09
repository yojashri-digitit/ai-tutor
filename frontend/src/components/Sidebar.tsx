"use client";

import Link from "next/link";
import { FileText, BookOpen, Database } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gray-900 text-white p-5 space-y-6">
      <h1 className="text-xl font-bold">AI Tutor</h1>

      <Link href="/ppt" className="flex gap-2 hover:text-blue-400">
        <FileText size={18} /> PPT Generator
      </Link>

      <Link href="/notes" className="flex gap-2 hover:text-blue-400">
        <BookOpen size={18} /> Notes
      </Link>

      <Link href="/rag" className="flex gap-2 hover:text-blue-400">
        <Database size={18} /> RAG System
      </Link>
    </div>
  );
}