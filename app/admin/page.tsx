"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAdminSession, loginAdmin } from "./actions";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Tag,
  BookOpen,
  Settings,
  ArrowRight,
  List,
} from "lucide-react";

export default function AdminOverview() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { isLoggedIn } = await checkAdminSession();
      setIsLoggedIn(isLoggedIn);
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const result = await loginAdmin(password);

    if (result.success) {
      setIsLoggedIn(true);
      setIsLoading(false);
    } else {
      alert("Incorrect password");
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

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

  // Admin sections with descriptions
  const adminSections = [
    // {
    //   title: "Dashboard",
    //   description: "Link chips to collectible",
    //   icon: <LayoutDashboard className="h-6 w-6" />,
    //   path: "/admin/dashboard",
    //   color: "bg-blue-500",
    // },
    {
      title: "Chip Management",
      description: "Assign chips to artists",
      icon: <Tag className="h-6 w-6" />,
      path: "/admin/chips",
      color: "bg-purple-500",
    },
    {
      title: "Collections & Collectibles",
      description: "Add, edit, and delete collections & collectibles",
      icon: <BookOpen className="h-6 w-6" />,
      path: "/admin/library",
      color: "bg-green-500",
    },
    {
      title: "Orders",
      description: "View and manage orders",
      icon: <List className="h-6 w-6" />,
      path: "/admin/orders",
      color: "bg-red-500",
    },
    // {
    //   title: "Settings",
    //   description: "Configure platform settings",
    //   icon: <Settings className="h-6 w-6" />,
    //   path: "/admin/dashboard",
    //   color: "bg-gray-500"
    // }
  ];

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">StreetMint Admin</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Manage your platform from this central dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminSections.map((section, index) => (
          <div
            key={index}
            onClick={() => router.push(section.path)}
            className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg cursor-pointer hover:translate-y-[-2px]"
          >
            <div className="p-6 flex items-center">
              <div
                className={`${section.color} p-3 rounded-full text-white mr-4`}
              >
                {section.icon}
              </div>
              <div className="flex-grow">
                <h2 className="text-xl font-bold">{section.title}</h2>
                <p className="text-gray-600 text-sm">{section.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
