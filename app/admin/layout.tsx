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

  // If logged in, show the admin layout with navigation buttons
  return (
    <div>
      {isLoggedIn && (
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <div className="text-white font-bold text-xl">
            StreetMint Admin Panel
          </div>
          <div className="flex space-x-4">
            {pathname !== "/admin" && (
              <Button
                onClick={() => router.push("/admin")}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Home
              </Button>
            )}
            {/* <Button
              onClick={() => router.push("/admin/dashboard")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Dashboard
            </Button>
            <Button
              onClick={() => router.push("/admin/chips")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Chips
            </Button>
            <Button
              onClick={() => router.push("/admin/library")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Library
            </Button> */}
            <Button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
