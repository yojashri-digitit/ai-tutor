"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  uploadDocument,
  askQuestion,
  getUserChats,
  getChatMessages,
  deleteChat,
  getQuestions,
} from "@/services/tutor.service";
import axios from "axios";
import toast from "react-hot-toast";

export default function NotesPage() {
  const [question, setQuestion] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [versionId, setVersionId] = useState<number | null>(null);
const [currentDocName, setCurrentDocName] = useState<string | null>(null);
  const bottomRef = useRef<any>(null);

  //////////////////////////////////////////////////////
  // 🔐 AUTH
  //////////////////////////////////////////////////////
  useEffect(() => {
    axios.get("http://localhost:5000/auth/me", { withCredentials: true })
      .catch(() => {
        toast.error("Login required");
        window.location.href = "/login";
      });
  }, []);

  //////////////////////////////////////////////////////
  // 🚀 LOAD CHATS
  //////////////////////////////////////////////////////
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const res = await getUserChats();
      setChats(res.data || []);
    } catch {
      toast.error("Failed to load chats");
    }
  };

  //////////////////////////////////////////////////////
  // 🔽 AUTO SCROLL
  //////////////////////////////////////////////////////
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //////////////////////////////////////////////////////
  // 📂 OPEN CHAT
  //////////////////////////////////////////////////////
  const openChat = async (chatId: number) => {
  setActiveChat(chatId);

  try {
    const res = await getChatMessages(chatId);

    setMessages(res.messages || []);
    setVersionId(res.versionId || null);

    const qRes = await getQuestions(chatId);
    setQuestions(qRes.questions || []);

    // ✅ SET FILE NAME
    const selected = chats.find((c) => c.id === chatId);
    setCurrentDocName(selected?.document?.name || "Document");

  } catch {
    toast.error("Failed to load chat");
  }
};

  //////////////////////////////////////////////////////
  // ❌ DELETE CHAT
  //////////////////////////////////////////////////////
  const removeChat = async (chatId: number) => {
    try {
      await deleteChat(chatId);
      toast.success("Deleted");

      if (activeChat === chatId) {
        setMessages([]);
        setActiveChat(null);
        setVersionId(null);
        setQuestions([]);
      }

      loadChats();
    } catch {
      toast.error("Delete failed");
    }
  };

  //////////////////////////////////////////////////////
  // ➕ NEW CHAT
  //////////////////////////////////////////////////////
  const newChat = () => {
    setActiveChat(null);
    setVersionId(null);
    setMessages([]);
    setQuestions([]);
    setCurrentDocName(null);
  };

  //////////////////////////////////////////////////////
  // 🚀 UPLOAD
  //////////////////////////////////////////////////////
  const upload = async () => {
    const file = fileRef.current?.files?.[0];

    if (!file) {
      toast.error("Select file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      toast.loading("Uploading...", { id: "upload" });

      const res = await uploadDocument(formData, false);

      // 🔁 EXISTS
      if (res.data.reused) {
        toast.dismiss("upload");

        const confirmReplace = window.confirm(
          `File exists\nUploaded: ${new Date(res.data.uploadedAt).toLocaleString()}\nReplace?`
        );

        if (confirmReplace) {
          toast.loading("Replacing...", { id: "replace" });

          const replaceRes = await uploadDocument(formData, true);

          toast.success("Replaced ✅", { id: "replace" });

          await openChat(replaceRes.data.chatSessionId);
        } else {
          toast("Opening existing");

          await openChat(res.data.chatSessionId);
        }

        loadChats();
        return;
      }

      // ✅ NEW
      toast.success("Uploaded ✅", { id: "upload" });

      await openChat(res.data.chatSessionId);
      loadChats();

      if (fileRef.current) fileRef.current.value = "";

    } catch {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // 💬 ASK
  //////////////////////////////////////////////////////
  const ask = async () => {
    if (!activeChat || !versionId) {
      toast.error("Upload/select doc first");
      return;
    }

    if (!question.trim()) {
      toast.error("Enter question");
      return;
    }

    const tempId = Date.now();

    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: question },
    ]);

    setLoading(true);

    try {
      const res = await askQuestion({
        question,
        versionId,
        chatSessionId: activeChat, // ✅ CORRECT
      });

      setMessages((prev) => [
        ...prev,
        {
          id: tempId + 1,
          role: "assistant",
          content: res.data.answer,
        },
      ]);

      setQuestion("");

      const qRes = await getQuestions(activeChat);
      setQuestions(qRes.questions || []);

    } catch {
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  };

  //////////////////////////////////////////////////////
  // 🎨 UI
  //////////////////////////////////////////////////////
  return (
    <div className="h-screen flex bg-gray-100">

      {/* SIDEBAR */}
      <div className="w-72 bg-gray-900 text-white flex flex-col">

        <div className="p-4 font-bold border-b">📚 Chats</div>

        <button
          onClick={newChat}
          className="m-3 bg-blue-600 py-2 rounded"
        >
          + New Chat
        </button>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => openChat(chat.id)}
              className={`p-3 rounded cursor-pointer ${
                activeChat === chat.id
                  ? "bg-blue-600"
                  : "bg-gray-800"
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <p>{chat.document?.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(chat.createdAt).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChat(chat.id);
                  }}
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
     {/* MAIN */}
<div className="flex-1 flex flex-col">

  {/* ========================= */}
  {/* 🆕 NEW CHAT SCREEN */}
  {/* ========================= */}
  {!activeChat && (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">

      <h2 className="text-2xl font-semibold text-gray-600">
        Start a new chat
      </h2>

      <div className="flex gap-2 w-[60%]">
        <input
          type="file"
          ref={fileRef}
          className="border p-2 rounded w-1/2"
        />

        <button
          onClick={upload}
          className="bg-green-600 text-white px-4 rounded"
        >
          Upload
        </button>
      </div>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask something..."
        className="border p-3 rounded w-[60%]"
      />

      <button
        onClick={ask}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        Ask
      </button>
    </div>
  )}

  {/* ========================= */}
  {/* 💬 EXISTING CHAT */}
  {/* ========================= */}
  {activeChat && (
    <>
      {/* 🔥 FILE NAME HEADER */}
      <div className="p-3 bg-gray-200 text-sm text-gray-700">
        📄 {currentDocName}
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div className="bg-white p-3 rounded shadow max-w-xl">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && <p>🤖 Thinking...</p>}
        <div ref={bottomRef}></div>
      </div>

      {/* INPUT ONLY (NO UPLOAD 🚫) */}
      <div className="p-4 flex gap-2 bg-white border-t">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 border p-2 rounded"
          placeholder="Ask something..."
        />

        <button
          onClick={ask}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Ask
        </button>
      </div>
    </>
  )}
</div>
    </div>
  );
}