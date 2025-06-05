import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, Plug, User } from "lucide-react";
import { shortenAddress } from "@/lib/shortenAddress";
import { useWallet } from "@solana/wallet-adapter-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import { redirect } from "next/navigation";
import Link from "next/link";

const ConnectedWalletWidget = () => {
  const { publicKey, connected } = useWallet();
  const { userProfile, isLoading, handleDisconnect } = useUserProfile();

  if (!connected && !isLoading) {
    //navigate to dashboard
    redirect("/dashboard");
    return <div />;
  }

  return (
    <>
      <div className="sm:hidden">
        {/* Visible only on small screens */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Connected wallet: ${publicKey}`}
            >
              <Wallet className="h-5 w-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2">
            {userProfile ? (
              <>
                <DropdownMenuItem className="flex items-center p-3 cursor-default">
                  <Avatar className="w-12 h-12 mr-3">
                    <AvatarImage
                      src={userProfile.avatar_url}
                      alt={userProfile.username}
                    />
                    <AvatarFallback className="text-xl bg-gray-100">
                      {userProfile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-base">{userProfile.username}</span>
                    <span className="text-sm text-gray-500">{shortenAddress(publicKey?.toString() || "")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild className="p-3">
                  <Link href="/dashboard/profile" className="flex items-center">
                    <User className="mr-3 h-5 w-5" />
                    <span className="text-base">Profile</span>
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem className="flex justify-between items-center p-3">
                <span className="font-medium text-base">Connected</span>
                <span className="text-sm text-gray-500">
                  {shortenAddress(publicKey?.toString() || "")}
                </span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDisconnect} className="p-3">
              <LogOut className="mr-3 h-5 w-5" />
              <span className="text-base">Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="hidden sm:block">
        {/* Visible on screens sm and larger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="text-sm font-medium h-fit py-2 px-6 hover:bg-gray-50"
              aria-label={`Connected wallet: ${publicKey}`}
            >
              {userProfile ? (
                <>
                  <Avatar className="w-10 h-10 mr-2">
                    <AvatarImage
                      src={userProfile.avatar_url}
                      alt={userProfile.username}
                    />
                    <AvatarFallback className="text-lg bg-gray-100">
                      {userProfile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {userProfile.username}
                </>
              ) : (
                <>
                  <span
                    className="w-2 h-2 bg-green-500 rounded-full mr-2"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Connected:</span>
                  {shortenAddress(publicKey?.toString() || "")}
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2">
            {userProfile && (
              <>
                <DropdownMenuItem className="flex items-center p-3 cursor-default">
                  <Avatar className="w-12 h-12 mr-3">
                    <AvatarImage
                      src={userProfile.avatar_url}
                      alt={userProfile.username}
                    />
                    <AvatarFallback className="text-xl bg-gray-100">
                      {userProfile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-base">{userProfile.username}</span>
                    <span className="text-sm text-gray-500">{shortenAddress(publicKey?.toString() || "")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild className="p-3">
                  <Link href="/dashboard/profile" className="flex items-center">
                    <User className="mr-3 h-5 w-5" />
                    <span className="text-base">Profile</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={handleDisconnect}
              className="cursor-pointer p-3"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span className="text-base">Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default ConnectedWalletWidget;
