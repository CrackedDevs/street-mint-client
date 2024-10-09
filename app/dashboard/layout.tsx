"use client";

import { Toaster } from "@/components/ui/toaster";

import DashboardHeader from "@/components/DashboardHeader";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
      <div className="flex flex-col h-screen bg-background">
        {/* Navbar */}
        <DashboardHeader />
        <div className="flex flex-1">
          {/* Main Content */}
          <main className="flex-1 w-full">{children}</main>
        </div>
        <Toaster />
      </div>
  
  );
}
