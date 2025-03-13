"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, ArrowUpDown, Search, X } from "lucide-react";
import {
  getAllArtists,
  createChipLink,
  getAllChipLinks,
  deleteChipLink,
  ChipLinkDetailed,
} from "@/lib/supabaseAdminClient";

// Message component with progress bar and close button
const AutoDismissMessage = ({ 
  message, 
  type, 
  onDismiss 
}: { 
  message: string; 
  type: 'error' | 'success'; 
  onDismiss: () => void;
}) => {
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Start the progress bar countdown
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 50); // Update every 50ms for smooth animation
    
    // Cleanup
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  
  const bgColor = type === 'error' ? 'bg-red-100' : 'bg-green-100';
  const borderColor = type === 'error' ? 'border-red-400' : 'border-green-400';
  const textColor = type === 'error' ? 'text-red-700' : 'text-green-700';
  const progressColor = type === 'error' ? 'bg-red-400' : 'bg-green-400';
  
  return (
    <div className={`${bgColor} border ${borderColor} ${textColor} px-4 py-3 rounded relative`} role="alert">
      <button 
        onClick={onDismiss}
        className="absolute top-0 right-0 p-2"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <strong className="font-bold">{type === 'error' ? 'Error: ' : 'Success: '}</strong>
      <span className="block sm:inline whitespace-pre-line">{message}</span>
      <div className="w-full h-1 bg-gray-200 mt-2 rounded-full overflow-hidden">
        <div 
          className={`h-full ${progressColor} transition-all duration-50 ease-linear`} 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default function ChipsManagementPage() {
  const [chipIds, setChipIds] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [chipLinks, setChipLinks] = useState<ChipLinkDetailed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Refs to store timeout IDs for message clearing
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Effect to clear messages after 5 seconds
  useEffect(() => {
    // Clear any existing timeouts
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    
    // Set new timeout if there's an error message
    if (errorMessage) {
      errorTimeoutRef.current = setTimeout(() => {
        setErrorMessage(null);
      }, 5000); // 5 seconds
    }
    
    // Cleanup on unmount
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [errorMessage]);
  
  // Similar effect for success messages
  useEffect(() => {
    // Clear any existing timeouts
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    
    // Set new timeout if there's a success message
    if (successMessage) {
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000); // 5 seconds
    }
    
    // Cleanup on unmount
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [successMessage]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const artistsData = await getAllArtists();
      if (artistsData) {
        setArtists(artistsData);
      }
      await fetchChipLinks();
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const fetchChipLinks = async () => {
    const links = await getAllChipLinks();
    if (links) {
      setChipLinks(links);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chipIds || !selectedArtistId) return;

    // Clear any previous messages
    setErrorMessage(null);
    setSuccessMessage(null);

    // Split the input by commas, new lines, or spaces and filter out empty strings
    const chipIdArray = chipIds
      .split(/[\n,\s]+/)
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (chipIdArray.length === 0) return;

    console.log(`Processing ${chipIdArray.length} chip IDs for artist ID ${selectedArtistId}`);
    setIsLoading(true);

    // Track errors for each chip ID
    const errors: string[] = [];
    const successfulChips: string[] = [];
    
    // Process each chip ID
    for (const chipId of chipIdArray) {
      console.log(`Attempting to assign chip ID ${chipId} to artist ID ${selectedArtistId}`);
      
      // Create the chip link
      const result = await createChipLink({
        chip_id: chipId,
        collectible_id: null,
        active: true,
        artists_id: selectedArtistId,
      });
      
      // If there was an error, add it to the errors list
      if (!result.success && result.error) {
        console.error(`Failed to assign chip ID ${chipId}: ${result.error}`);
        errors.push(`${chipId}: ${result.error}`);
      } else {
        console.log(`Successfully assigned chip ID ${chipId} to artist ID ${selectedArtistId}`);
        successfulChips.push(chipId);
      }
    }

    // Show error message if there were errors
    if (errors.length > 0) {
      // Format the error messages for better readability
      const formattedErrors = errors.map(error => {
        // Extract the chip ID from the error message (format: "chipId: error message")
        const [chipId, ...errorParts] = error.split(':');
        const errorMessage = errorParts.join(':').trim();
        
        // Return a formatted error message
        return `• ${chipId}: ${errorMessage}`;
      });
      
      setErrorMessage(`Failed to assign the following chip IDs:\n${formattedErrors.join('\n')}`);
    }

    // Show success message if any chips were successfully assigned
    if (successfulChips.length > 0) {
      const artistName = artists.find(artist => artist.id === selectedArtistId)?.username || 'selected artist';
      
      // Format the success message
      let successMsg = `Successfully assigned ${successfulChips.length} chip(s) to ${artistName} (ID: ${selectedArtistId})`;
      
      // If there are 5 or fewer successful chips, list them all
      if (successfulChips.length <= 5) {
        successMsg += `:\n${successfulChips.map(chipId => `• ${chipId}`).join('\n')}`;
      } 
      // If there are more than 5, show the first 5 and indicate there are more
      else {
        const shownChips = successfulChips.slice(0, 5);
        const remainingCount = successfulChips.length - 5;
        successMsg += `:\n${shownChips.map(chipId => `• ${chipId}`).join('\n')}\n• ... and ${remainingCount} more`;
      }
      
      setSuccessMessage(successMsg);
    }

    // Log summary
    console.log(`Assignment complete. Successfully assigned ${successfulChips.length} chips, failed to assign ${errors.length} chips.`);

    setChipIds("");
    setSelectedArtistId(null);
    await fetchChipLinks();
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    await deleteChipLink(id);
    await fetchChipLinks();
    setIsLoading(false);
  };

  // Filter chip links by search query
  const filteredChipLinks = chipLinks.filter(
    (chip) =>
      chip.chip_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chip.metadata?.artist || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Group chip links by artist
  const chipsByArtist = filteredChipLinks.reduce((acc, chip) => {
    const artistName = chip.metadata?.artist || "Unassigned";
    if (!acc[artistName]) {
      acc[artistName] = [];
    }
    acc[artistName].push(chip);
    return acc;
  }, {} as Record<string, ChipLinkDetailed[]>);

  return (
    <div className="container mx-auto p-4 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-12">
        Chip Management for Artists
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full">
        {errorMessage && (
          <AutoDismissMessage 
            message={errorMessage} 
            type="error" 
            onDismiss={() => setErrorMessage(null)} 
          />
        )}
        
        {successMessage && (
          <AutoDismissMessage 
            message={successMessage} 
            type="success" 
            onDismiss={() => setSuccessMessage(null)} 
          />
        )}
        
        <div className="flex flex-col space-y-2">
          <label htmlFor="chipIds" className="text-sm font-medium">
            Chip IDs (separate multiple IDs with commas, spaces, or new lines)
          </label>
          <textarea
            id="chipIds"
            placeholder="Enter chip IDs here..."
            value={chipIds}
            onChange={(e) => setChipIds(e.target.value)}
            className="px-5 py-3 text-base font-semibold min-h-[100px] rounded-md border border-input"
            required
          />
        </div>

        <div className="flex space-x-4">
          <Select
            value={selectedArtistId?.toString() || ""}
            onValueChange={(value) => setSelectedArtistId(Number(value))}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select an artist" />
            </SelectTrigger>
            <SelectContent>
              {artists.map((artist) => (
                <SelectItem key={artist.id} value={artist.id.toString()}>
                  {artist.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="submit"
            className="min-w-24 font-semibold"
            size="lg"
            disabled={isLoading || !chipIds || !selectedArtistId}
          >
            {isLoading ? "Adding..." : "Assign Chips"}
          </Button>
        </div>
      </form>

      <div className="mb-4">
        <form className="flex space-x-4">
          <Input
            type="text"
            placeholder="Search chips or artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow max-w-[380px] px-5 text-base"
          />
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600">
                Artist
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                Chip ID
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                Collectible
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                Status
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(chipsByArtist).map(([artistName, chips]) =>
              chips.map((chip, index) => (
                <TableRow
                  key={chip.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  {index === 0 ? (
                    <TableCell rowSpan={chips.length} className="font-medium">
                      {artistName}
                    </TableCell>
                  ) : null}
                  <TableCell>{chip.chip_id}</TableCell>
                  <TableCell>
                    {chip.collectible_id ? (
                      <div className=" transition-colors underline duration-200">
                        {chip.metadata?.collectible_name || chip.collectible_id}
                      </div>
                    ) : (
                      <span className="text-gray-500">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        chip.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {chip.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* <DropdownMenuItem
                          onClick={() =>
                            window.open(`/chip/${chip.chip_id}`, "_blank")
                          }
                          className="cursor-pointer"
                        >
                          <span>View Chip URL</span>
                        </DropdownMenuItem> */}
                        <DropdownMenuItem
                          onClick={() => handleDelete(chip.id)}
                          className="cursor-pointer text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
            {Object.keys(chipsByArtist).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-500"
                >
                  No chip assignments found. Add a new chip assignment above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
