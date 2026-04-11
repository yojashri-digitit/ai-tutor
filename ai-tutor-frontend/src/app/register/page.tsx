"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/services/auth.api"; // ✅ FIXED
import toast from "react-hot-toast";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast.error("All fields are required");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      await registerUser({ name, email, password });

      toast.success("Account created 🎉");

      setTimeout(() => {
        router.replace("/login"); // ✅ better
      }, 800);

    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">

      <div className="bg-white shadow-xl rounded-xl p-8 w-80 space-y-5">

        <h1 className="text-2xl font-bold text-center">
          Create Account ✨
        </h1>

        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-3 w-full rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-3 w-full rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-3 w-full rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
        >
          {loading ? "Creating..." : "Register"}
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => router.push("/login")}
          >
            Login
          </span>
        </p>

      </div>
    </div>
  );
}