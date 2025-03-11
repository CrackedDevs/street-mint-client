"use client";
import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import ConnectedWalletWidget from "@/components/connectedWalletWidget";
import { Button } from "@/components/ui/button";
import { PaletteIcon, UserIcon, Bolt } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const DashboardHeader: React.FC = () => {
  const { publicKey } = useWallet();
  const { userProfile, isLoading } = useUserProfile();

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
                    <Button variant="ghost">
                      <PaletteIcon className="h-5 w-5 mr-2" />
                      Collections
                    </Button>
                  </Link>
                  <Link href="/dashboard/my-chips">
                    <Button variant="ghost">
                      <Bolt className="h-5 w-5 mr-2" />
                      My Chips
                    </Button>
                  </Link>
                  <Link href="/dashboard/profile">
                    <Button variant="ghost">
                      <UserIcon className="h-5 w-5 mr-2" />
                      Profile
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
