"use client";

import { useRouter, usePathname } from "next/navigation";
import { logoutUser } from "@/services/tutor.service";
import toast from "react-hot-toast";

interface Chat {
  id: number;
  document?: {
    name: string;
  };
  messages?: {
    content: string;
  }[];
  versionId?: number | null;
  createdAt: string;
}

interface Props {
  chats?: Chat[];
  activeChat: number | null;
  setActiveChat: (id: number | null) => void;
  setVersionId: (id: number | null) => void;
  openChat: (chatId: number) => Promise<void>;
  resetChat: () => void;
}

export default function Sidebar({
  chats = [],
  activeChat,
  setActiveChat,
  setVersionId,
  openChat,
  resetChat,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  //////////////////////////////////////////////////////
  // 🚪 LOGOUT
  //////////////////////////////////////////////////////
  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out");
    } catch {
      toast.error("Logout failed");
    } finally {
      window.location.href = "/login";
    }
  };

  //////////////////////////////////////////////////////
  // 📂 OPEN CHAT
  //////////////////////////////////////////////////////
  const handleClick = async (chat: Chat) => {
    if (!chat.id) {
      toast.error("⚠️ Chat not ready");
      return;
    }

    if (activeChat === chat.id) return;

    try {
      setActiveChat(chat.id);
      setVersionId(chat.versionId || null);

      await openChat(chat.id);
    } catch {
      toast.error("Failed to open chat");
    }
  };

  //////////////////////////////////////////////////////
  // ➕ NEW CHAT
  //////////////////////////////////////////////////////
  const handleNewChat = () => {
    setActiveChat(null);
    setVersionId(null);
    resetChat();

    toast("Start a new chat ✨");
  };

  //////////////////////////////////////////////////////
  // 🧠 TITLE LOGIC (🔥 IMPORTANT)
  //////////////////////////////////////////////////////
  const getChatTitle = (chat: Chat) => {
    if (chat.document?.name) {
      return `📄 ${chat.document.name}`;
    }

    if (chat.messages?.[0]?.content) {
      return `📘 ${chat.messages[0].content.slice(0, 30)}`;
    }

    return "🆕 New Chat";
  };

  //////////////////////////////////////////////////////
  // 🎨 UI
  //////////////////////////////////////////////////////
  return (
    <div className="w-72 bg-gray-900 text-white flex flex-col h-screen">

      {/* HEADER */}
      <div
        onClick={() => router.push("/home")}
        className="p-4 text-xl font-bold border-b border-gray-700 cursor-pointer hover:bg-gray-800"
      >
        🤖 AI Tutor
      </div>

      {/* NAV */}
      <div className="px-3 mt-3 space-y-2">
        {[
          { path: "/notes", label: "📄 Notes" },
          { path: "/ppt", label: "📊 PPT" },
          { path: "/chat", label: "💬 Chat" },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              pathname === item.path
                ? "bg-blue-700"
                : "hover:bg-gray-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* NEW CHAT */}
      <button
        onClick={handleNewChat}
        className="m-4 bg-blue-600 py-2 rounded-lg hover:bg-blue-700"
      >
        + New Chat
      </button>

      {/* CHAT LIST */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2">

        {chats.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">
            No chats yet
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = activeChat === chat.id;

            return (
              <div
                key={chat.id}
                onClick={() => handleClick(chat)}
                className={`p-3 rounded-lg cursor-pointer ${
                  isActive
                    ? "bg-blue-700"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                {/* 🔥 TITLE */}
                <p className="text-sm font-semibold truncate">
                  {getChatTitle(chat)}
                </p>

                {/* DATE */}
                <p className="text-xs text-gray-400">
                  {new Date(chat.createdAt).toLocaleString()}
                </p>

                {/* ACTIVE */}
                {isActive && (
                  <span className="text-[10px] text-green-300">
                    ● Active
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER */}
      <div className="p-3 border-t border-gray-700 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 py-2 rounded"
        >
          Logout
        </button>

        <p className="text-xs text-gray-500 text-center">
          AI Tutor v1.0 🚀
        </p>
      </div>
    </div>
  );
}