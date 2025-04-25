"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface LoadingOverlayProps {
  sponsorLogo?: string;
  sponsorName?: string;
}

export default function LoadingOverlay({
  sponsorLogo,
  sponsorName,
}: LoadingOverlayProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading overlay for 3 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white flex justify-center items-center z-50">
      <Image
        src={sponsorLogo || "/logo.svg"}
        alt={sponsorName || "Street mint logo"}
        width={250}
        height={100}
        className="h-20 w-auto animate-pulse"
      />
    </div>
  );
}
