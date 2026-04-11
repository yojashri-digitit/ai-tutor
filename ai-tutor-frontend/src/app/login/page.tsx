"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/auth.api";
import toast from "react-hot-toast";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Enter email & password");
      return;
    }

    try {
      setLoading(true);
      await loginUser({ email, password });
      toast.success("Login successful 🎉");
      router.replace("/home");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT SIDE (Branding Section) */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white items-center justify-center flex-col p-10">
        <h1 className="text-4xl font-bold mb-4">AI Tutor 🤖</h1>
        <p className="text-lg opacity-90 text-center max-w-md">
          Learn smarter with AI-powered tutoring. Generate notes, PPTs, and master concepts faster 🚀
        </p>
      </div>

      {/* RIGHT SIDE (Form Section) */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50 px-6">

        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">

          <h2 className="text-2xl font-bold text-center mb-6">
            Welcome Back 👋
          </h2>

          {/* Email */}
          <div className="mb-4">
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="text-sm text-gray-600">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="px-3 text-gray-400 text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Register */}
          <p className="text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <span
              className="text-blue-600 font-medium cursor-pointer hover:underline"
              onClick={() => router.push("/register")}
            >
              Register
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}