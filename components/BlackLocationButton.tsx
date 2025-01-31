import React from "react";
import ShimmerButton from "./magicui/shimmer-button";
import { MapIcon } from "lucide-react";

interface LocationButtonProps {
  location: string;
}

const LocationButton: React.FC<LocationButtonProps> = ({ location }) => {
  const handleLocationClick = () => {
    if (location) {
      window.open(location, "_blank");
    } else {
      alert("Location information is not available for this collectible.");
    }
  };

  return (
    <ShimmerButton
      borderRadius="9999px"
      className="w-full text-white flex  hover:bg-gray-200 h-[60px] rounded font-bold"
      onClick={handleLocationClick}
      disabled={!location}
    >
      <span className="mr-4"> View Location</span>
      <MapIcon />
    </ShimmerButton>
  );
};

export default LocationButton;
