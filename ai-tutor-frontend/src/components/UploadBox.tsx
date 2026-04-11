"use client";

import { useState } from "react";
import { uploadDocument } from "@/services/tutor.service";
import toast from "react-hot-toast";

interface Props {
  onUpload: (data: {
    name: string;
    date: string;
    versionId: number;
    chatSessionId: number;
  }) => void;

  openChat: (chatId: number) => void; // 🔥 REQUIRED
}

export default function UploadBox({ onUpload, openChat }: Props) {
  const [loading, setLoading] = useState(false);

  ////////////////////////////////////////////
  // 🚀 HANDLE UPLOAD
  ////////////////////////////////////////////
  const handleUpload = async (e: any) => {
    const file = e.target.files?.[0];

    if (!file) return;

    ////////////////////////////////////////////
    // 🔥 VALIDATION
    ////////////////////////////////////////////
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF / DOC / DOCX allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await uploadDocument(formData);
      const data = res.data;

      ////////////////////////////////////////////
      // 🔁 FILE EXISTS
      ////////////////////////////////////////////
      if (data.reused) {
        toast("⚠️ File already exists → Opening previous chat");

        if (data.chatSessionId) {
          openChat(data.chatSessionId); // ✅ FIXED
        }

        return;
      }

      ////////////////////////////////////////////
      // 🟡 UPDATED VERSION
      ////////////////////////////////////////////
      if (data.updated) {
        toast.success("♻️ New version created");
      } else {
        toast.success("Uploaded successfully ✅");
      }

      ////////////////////////////////////////////
      // 🔥 SEND TO PARENT
      ////////////////////////////////////////////
      if (data.chatSessionId) {
        onUpload({
          name: file.name,
          date: new Date().toLocaleString(),
          versionId: data.versionId,
          chatSessionId: data.chatSessionId,
        });

        openChat(data.chatSessionId); // 🔥 AUTO OPEN
      }

    } catch (err: any) {
      toast.error(err?.customMessage || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  ////////////////////////////////////////////
  // 🎨 UI
  ////////////////////////////////////////////
  return (
    <div className="p-3 border-b border-gray-700">

      <label className="block text-sm mb-2 text-gray-300">
        Upload Document
      </label>

      <input
        type="file"
        onChange={handleUpload}
        disabled={loading}
        className="w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 
                   file:rounded file:border-0 file:text-sm 
                   file:bg-blue-600 file:text-white 
                   hover:file:bg-blue-700 cursor-pointer"
      />

      {loading && (
        <p className="text-xs text-gray-400 mt-2 animate-pulse">
          Uploading...
        </p>
      )}
    </div>
  );
}