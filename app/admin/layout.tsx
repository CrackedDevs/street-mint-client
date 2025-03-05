"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkAdminSession, logoutAdmin } from "./actions";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      const { isLoggedIn } = await checkAdminSession();

      setIsLoggedIn(isLoggedIn);

      // If not logged in and not on the main admin page, redirect to login
      if (!isLoggedIn && pathname !== "/admin") {
        router.push("/admin");
      }

      setIsLoading(false);
    };

    checkSession();
  }, [pathname, router]);

  const handleLogout = async () => {
    await logoutAdmin();
    setIsLoggedIn(false);
    router.push("/admin");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If on the main admin page and not logged in, just show the login form
  if (pathname === "/admin" && !isLoggedIn) {
    return <>{children}</>;
  }

  // If logged in, show the admin layout with logout button
  return (
    <div>
      {isLoggedIn && (
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <div className="text-white font-bold text-xl">
            StreetMint Admin Panel
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Logout
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}
