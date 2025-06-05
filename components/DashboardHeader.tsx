"use client";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import ConnectedWalletWidget from "@/components/connectedWalletWidget";
import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { Award, Bolt, BookOpen, Layers, PaletteIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const DashboardHeader: React.FC = () => {
  const { publicKey } = useWallet();
  const { userProfile, isLoading } = useUserProfile();
  const pathname = usePathname();

  const showNavbarItems = userProfile && !isLoading && userProfile.email;

  return (
    <header className="w-full py-4 px-6 border-b border-gray-200 bg-white z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {showNavbarItems ? (
          <>
            <div className="flex items-center">
              <Link href="/dashboard">
                <Image
                  src="/logo.svg"
                  alt="Street mint logo"
                  width={250}
                  height={100}
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {publicKey && (
                <>
                  <Link href="/dashboard/collection">
                    <Button 
                      variant={pathname === "/dashboard/collection" ? "default" : "ghost"}
                      className={pathname === "/dashboard/collection" ? "bg-gray-900" : ""}
                    >
                      <PaletteIcon className="h-5 w-5 mr-2" />
                      Collections
                    </Button>
                  </Link>
                  <Link href="/dashboard/my-chips">
                    <Button 
                      variant={pathname === "/dashboard/my-chips" ? "default" : "ghost"}
                      className={pathname === "/dashboard/my-chips" ? "bg-gray-900" : ""}
                    >
                      <Bolt className="h-5 w-5 mr-2" />
                      Chips
                    </Button>
                  </Link>
                  <Link href="/dashboard/batch-listings">
                    <Button 
                      variant={pathname === "/dashboard/batch-listings" ? "default" : "ghost"}
                      className={pathname === "/dashboard/batch-listings" ? "bg-gray-900" : ""}
                    >
                      <Layers className="h-5 w-5 mr-2" />
                      Batch Listings
                    </Button>
                  </Link>
                  <Link href="/dashboard/stampbooks">
                    <Button 
                      variant={pathname === "/dashboard/stampbooks" ? "default" : "ghost"}
                      className={pathname === "/dashboard/stampbooks" ? "bg-gray-900" : ""}
                    >
                      <BookOpen className="h-5 w-5 mr-2" />
                      Stampbooks
                    </Button>
                  </Link>
                  <Link href="/dashboard/sponsors">
                    <Button 
                      variant={pathname === "/dashboard/sponsors" ? "default" : "ghost"}
                      className={pathname === "/dashboard/sponsors" ? "bg-gray-900" : ""}
                    >
                      <Award className="h-5 w-5 mr-2" />
                      Sponsors
                    </Button>
                  </Link>
                </>
              )}
              <ConnectedWalletWidget />
            </div>
          </>
        ) : (
          <div className="flex-1 flex justify-center">
            <Link href="/dashboard">
              <Image
                src="/logo.svg"
                alt="Street mint logo"
                width={250}
                height={100}
                className="h-10 w-auto"
              />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;
