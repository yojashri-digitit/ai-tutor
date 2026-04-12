"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "@/services/auth.api";
import toast from "react-hot-toast";

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out 👋");
    } catch {
      toast.error("Logout failed");
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <div className="w-full flex justify-between items-center px-6 py-3 bg-black text-white shadow-md">

      {/* LOGO */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => router.push("/home")}
      >
        <span className="text-2xl">🤖</span>
        <h1 className="font-bold text-lg">AI Tutor</h1>
      </div>

      {/* LOGOUT */}
      <button
        onClick={handleLogout}
        className="bg-red-500 px-4 py-1 rounded-lg hover:bg-red-600 transition"
      >
        Logout
      </button>

    </div>
  );
}