import { useState } from "react";

export function useChat() {
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(null);

  return {
    chats,
    setChats,
    messages,
    setMessages,
    activeChat,
    setActiveChat,
  };
}