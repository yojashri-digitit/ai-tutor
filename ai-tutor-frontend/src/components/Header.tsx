"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser, getMe } from "@/services/auth.api"; // ✅ FIXED
import toast from "react-hot-toast";
import axios from "axios";

export default function Header() {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  ////////////////////////////////////////////
  // 🔐 CHECK AUTH (USING COOKIE)
  ////////////////////////////////////////////
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await 
        axios.get("http://localhost:3000/auth/me",
            { withCredentials: true }
        ); // ✅ uses api instance
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  ////////////////////////////////////////////
  // 🚪 LOGOUT
  ////////////////////////////////////////////
  const handleLogout = async () => {
    try {
      await logoutUser(); // clears cookie
      toast.success("Logged out");
    } catch {
      toast.error("Logout failed");
    } finally {
      window.location.href = "/login"; // ✅ full reset
    }
  };

  if (isLoggedIn === null) return null; // prevent flicker

  ////////////////////////////////////////////
  // 🎨 UI
  ////////////////////////////////////////////
  return (
    <div className="w-full flex justify-between items-center px-6 py-3 bg-gray-900 text-white shadow">

      {/* LOGO */}
      <h1
        className="font-bold text-lg cursor-pointer"
        onClick={() => router.push("/home")}
      >
        🤖 AI Tutor
      </h1>

      {/* ACTIONS */}
      <div className="flex gap-4 items-center">

        {!isLoggedIn ? (
          <>
            <button
              onClick={() => router.push("/login")}
              className="hover:text-gray-300"
            >
              Login
            </button>

            <button
              onClick={() => router.push("/register")}
              className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
            >
              Register
            </button>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}