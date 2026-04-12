"use client";

import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { logoutUser } from "@/services/tutor.service";
import toast from "react-hot-toast";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

export default function useAuth() {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const hasChecked = useRef(false); // 🔥 prevent duplicate calls

  ////////////////////////////////////////////
  // 🔐 CHECK AUTH
  ////////////////////////////////////////////
  const checkAuth = async () => {
    try {
      await axios.get("/auth/me",
      {
        withCredentials: true,
      });

      setIsLoggedIn(true);
     
    } catch {
      setIsLoggedIn(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  ////////////////////////////////////////////
  // 🔄 AUTO CHECK (ONLY ONCE)
  ////////////////////////////////////////////
  useEffect(() => {
    if (hasChecked.current) return;

    hasChecked.current = true;
    checkAuth();
  }, []);

  ////////////////////////////////////////////
  // 🚪 LOGOUT
  ////////////////////////////////////////////
  const logout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out");
    } catch {
      toast.error("Logout failed");
    } finally {
      router.replace("/login");
    }
  };

  ////////////////////////////////////////////
  // 🔐 REQUIRE AUTH
  ////////////////////////////////////////////
  const requireAuth = async () => {
    if (isLoggedIn === null) {
      const ok = await checkAuth();
      if (!ok) return false;
    }

    if (!isLoggedIn) {
      toast.error("Please login first");
      router.replace("/login");
      return false;
    }

    return true;
  };

  return {
    isLoggedIn,
    loading,
    logout,
    checkAuth,
    requireAuth,
  };
}