import React from "react";
import { Linkedin, Instagram } from "lucide-react";
import { Artist } from "@/lib/supabaseClient";
import Image from "next/image";
import X from "./x";

interface ArtistInfoComponentProps {
  artist: Artist;
}

const ArtistInfoComponent: React.FC<ArtistInfoComponentProps> = ({
  artist,
}) => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      {artist.avatar_url ? (
        <Image
          src={artist.avatar_url}
          alt={`${artist.username}'s avatar`}
          width={40}
          height={40}
          className="rounded-full w-10 h-10"
        />
      ) : (
        <div className="w-10 h-10 bg-purple-600 rounded-full"></div>
      )}

      <span className="font-semibold">{artist.username}</span>
      {artist.x_username && (
        <a
          href={`https://x.com/${artist.x_username}`}
          className="text-gray-600 hover:text-black"
        >
          <X className="w-5 h-5" />
        </a>
      )}
      {artist.linkedin_username && (
        <a
          href={`https://www.linkedin.com/in/${artist.linkedin_username}`}
          className="text-gray-600 hover:text-black"
        >
          <Linkedin className="w-5 h-5" />
        </a>
      )}
      {artist.instagram_username && (
        <a
          href={`https://www.instagram.com/${artist.instagram_username}`}
          className="text-gray-600 hover:text-black"
        >
          <Instagram className="w-5 h-5" />
        </a>
      )}
      {artist.farcaster_username && (
        <a
          href={`https://warpcast.com/${artist.farcaster_username}`}
          className="text-gray-600 hover:text-black"
        >
          <Image
            alt="farcaster"
            src="https://docs.farcaster.xyz/icon.png"
            width={20}
            height={20}
          />
        </a>
      )}
    </div>
  );
};

export default ArtistInfoComponent;
