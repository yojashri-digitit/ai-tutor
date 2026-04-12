import { api } from "./api";

//////////////////////////////////////////////////////
// 🎯 TYPES
//////////////////////////////////////////////////////

export interface AskQuestionPayload {
  question: string;
  versionId: number;
}

//////////////////////////////////////////////////////
// 💬 RAG
//////////////////////////////////////////////////////

export const askQuestion = (data: {
  question: string;
  versionId: number;
  chatSessionId: number; // 🔥 FIXED NAME
  course?: string; // 🔥 OPTIONAL COURSE
}) =>
  api.post("/rag/ask", data);
//////////////////////////////////////////////////////
// 📄 DOCUMENT
//////////////////////////////////////////////////////

export const uploadDocument = (
  formData: FormData,
  replace = false
) =>
  api.post(`/document/upload?replace=${replace}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

//////////////////////////////////////////////////////
// 📚 CHAT SYSTEM
//////////////////////////////////////////////////////

//////////////////////////////////////////////////////
// 🔥 GET ALL CHATS (SIDEBAR)
//////////////////////////////////////////////////////

export const getUserChats = async () => {
  const res = await api.get("/chat");

  // ✅ FIXED (your bug was here ❌)
  return {
    data: res.data?.chats || [],
  };
};

//////////////////////////////////////////////////////
// 🔥 GET SINGLE CHAT (MESSAGES)
//////////////////////////////////////////////////////

export const getChatMessages = async (chatId: number) => {
 

  const res = await api.get(`/chat/${chatId}`);

  return res.data; // ✅ FIXED (your bug was here ❌)
};

//////////////////////////////////////////////////////
// 🔥 GET QUESTIONS (DROPDOWN)
//////////////////////////////////////////////////////

export const getQuestions = async (chatId: number) => {
  if (!chatId || isNaN(chatId)) {
    return { data: [] };
  }

  const res = await api.get(`/chat/questions/${chatId}`);

  return {
    data: res.data?.questions || [],
  };
};

//////////////////////////////////////////////////////
// 🔥 DELETE CHAT
//////////////////////////////////////////////////////

export const deleteChat = async (chatId: number) => {
  if (!chatId || isNaN(chatId)) {
    throw new Error("Invalid chatId");
  }

  return api.delete(`/chat/${chatId}`);
};