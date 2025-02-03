"use client";

import AddChipForm from "@/components/AddChipForm";
import ChipTable from "@/components/ChipTable";
import { useState } from "react";
import { PopulatedCollection } from "@/lib/supabaseClient";
import { loginAdmin } from "../admin/actions";
import Link from "next/link";
import AdminNavBar from "@/components/AdminNavBar";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("XxmYMe4dWTjF");
  const [collections, setCollections] = useState<PopulatedCollection[]>([]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await loginAdmin(password);
    if (result.success) {
      setIsLoggedIn(true);
      setCollections(result.collections);
    } else {
      alert("Incorrect password");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <form
          onSubmit={handleLogin}
          className="p-8 bg-white shadow-md rounded-lg"
        >
          <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-2 mb-4 border rounded"
          />
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <AdminNavBar />
      <div className="container mx-auto p-4 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-center mb-12">
          Chip Collectible Manager 🔐
        </h1>
        <AddChipForm />
        <ChipTable />
      </div>
    </div>
  );
}
