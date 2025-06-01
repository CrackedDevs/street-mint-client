import React from "react";
import { Linkedin, Instagram } from "lucide-react";
import { Artist } from "@/lib/supabaseClient";
import Image from "next/image";
import X from "./x";

interface ArtistInfoComponentProps {
  artist: Artist;
}

// Utility function to extract username from social media URLs or return as-is if it's already a username
const extractUsernameFromSocial = (value: string | null | undefined, platform: 'x' | 'linkedin' | 'instagram' | 'farcaster'): string => {
  if (!value) return '';
  
  let username = '';
  
  // Check if it's already a URL
  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value);
      const pathname = url.pathname;
      
      switch (platform) {
        case 'x':
          // Handle both x.com and twitter.com
          if (url.hostname === 'x.com' || url.hostname === 'twitter.com') {
            username = pathname.slice(1); // Remove leading slash
          }
          break;
        case 'linkedin':
          if (url.hostname === 'www.linkedin.com' || url.hostname === 'linkedin.com') {
            // Remove /in/ prefix if present
            username = pathname.startsWith('/in/') ? pathname.slice(4) : pathname.slice(1);
          }
          break;
        case 'instagram':
          if (url.hostname === 'www.instagram.com' || url.hostname === 'instagram.com') {
            username = pathname.slice(1); // Remove leading slash
          }
          break;
        case 'farcaster':
          if (url.hostname === 'warpcast.com') {
            username = pathname.slice(1); // Remove leading slash
          }
          break;
      }
    } catch (error) {
      // If URL parsing fails, treat as username
      username = value;
    }
  } else {
    // If it's not a URL, use as-is (assuming it's already a username)
    username = value;
  }
  
  // Remove any @ symbols from the username
  return username.replace(/^@+/, ''); // Remove @ symbols from the beginning
};

const ArtistInfoComponent: React.FC<ArtistInfoComponentProps> = ({
  artist,
}) => {

  const artist_instagram = extractUsernameFromSocial(artist.instagram_username, 'instagram');
  const artist_x = extractUsernameFromSocial(artist.x_username, 'x');
  const artist_linkedin = extractUsernameFromSocial(artist.linkedin_username, 'linkedin');
  const artist_farcaster = extractUsernameFromSocial(artist.farcaster_username, 'farcaster');
  
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
      {artist_x && (
        <a
          href={`https://x.com/${artist_x}`}
          className="text-gray-600 hover:text-black"
        >
          <X className="w-5 h-5" />
        </a>
      )}
      {artist_linkedin && (
        <a
          href={`https://www.linkedin.com/in/${artist_linkedin}`}
          className="text-gray-600 hover:text-black"
        >
          <Linkedin className="w-5 h-5" />
        </a>
      )}
      {artist_instagram && (
        <a
          href={`https://www.instagram.com/${artist_instagram}`}
          className="text-gray-600 hover:text-black"
        >
          <Instagram className="w-5 h-5" />
        </a>
      )}
      {artist_farcaster && (
        <a
          href={`https://warpcast.com/${artist_farcaster}`}
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
