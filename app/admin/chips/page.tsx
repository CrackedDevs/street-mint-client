"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
import { MoreVertical, Trash2, Search, X, ChevronDown, Edit } from "lucide-react";
import {
  getAllArtists,
  createChipLink,
  getAllChipLinks,
  deleteChipLink,
  ChipLinkDetailed,
  disconnectChipLink,
  updateChipLink,
} from "@/lib/supabaseAdminClient";
import EditChipModal from "@/components/EditChipModal";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Message component with progress bar and close button
const AutoDismissMessage = ({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: "error" | "success";
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

  const bgColor = type === "error" ? "bg-red-100" : "bg-green-100";
  const borderColor = type === "error" ? "border-red-400" : "border-green-400";
  const textColor = type === "error" ? "text-red-700" : "text-green-700";
  const progressColor = type === "error" ? "bg-red-400" : "bg-green-400";

  return (
    <div
      className={`${bgColor} border ${borderColor} ${textColor} px-4 py-3 rounded relative`}
      role="alert"
    >
      <button
        onClick={onDismiss}
        className="absolute top-0 right-0 p-2"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <strong className="font-bold">
        {type === "error" ? "Error: " : "Success: "}
      </strong>
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

type ChipData = {
  chipId: string;
  label: string;
};

export default function ChipsManagementPage() {
  const [chipDataArray, setChipDataArray] = useState<ChipData[]>([{ chipId: '', label: '' }]);
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [chipLinks, setChipLinks] = useState<ChipLinkDetailed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [isArtistDropdownOpen, setIsArtistDropdownOpen] = useState(false);
  const artistDropdownRef = useRef<HTMLDivElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedChipForEdit, setSelectedChipForEdit] = useState<ChipLinkDetailed | null>(null);

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

  const addChipRow = () => {
    setChipDataArray(prev => [...prev, { chipId: '', label: '' }]);
  };

  const removeChipRow = (index: number) => {
    if (chipDataArray.length > 1) {
      setChipDataArray(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateChipData = (index: number, field: keyof ChipData, value: string) => {
    setChipDataArray(prev => 
      prev.map((chip, i) => 
        i === index ? { ...chip, [field]: value } : chip
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validChips = chipDataArray.filter(chip => chip.chipId.trim() !== '');
    if (!selectedArtistId || validChips.length === 0) return;

    // Clear any previous messages
    setErrorMessage(null);
    setSuccessMessage(null);

    console.log(
      `Processing ${validChips.length} chip entries for artist ID ${selectedArtistId}`
    );
    setIsLoading(true);

    // Track errors for each chip ID
    const errors: string[] = [];
    const successfulChips: string[] = [];

    // Process each chip entry
    for (const chipData of validChips) {
      console.log(
        `Attempting to assign chip ID ${chipData.chipId} with label "${chipData.label}" to artist ID ${selectedArtistId}`
      );

      // Create the chip link
      const result = await createChipLink({
        chip_id: chipData.chipId,
        collectible_id: null,
        active: true,
        artists_id: selectedArtistId,
        label: chipData.label || null,
      });

      // If there was an error, add it to the errors list
      if (!result.success && result.error) {
        console.error(`Failed to assign chip ID ${chipData.chipId}: ${result.error}`);
        errors.push(`${chipData.chipId}: ${result.error}`);
      } else {
        console.log(
          `Successfully assigned chip ID ${chipData.chipId} to artist ID ${selectedArtistId}`
        );
        successfulChips.push(chipData.chipId);
      }
    }

    const artistName = artists.find((artist) => artist.id === selectedArtistId)?.username || "selected artist";

    // Show error message if there were errors
    if (errors.length > 0) {
      const formattedErrors = errors.map((error) => {
        const [chipId, ...errorParts] = error.split(":");
        const errorMessage = errorParts.join(":").trim();
        return `${chipId}: ${errorMessage}`;
      });

      toast({
        title: "Failed to Assign Chips",
        description: `Failed to assign ${errors.length} chip(s) to ${artistName}:\n${formattedErrors.slice(0, 3).join("\n")}${errors.length > 3 ? `\n...and ${errors.length - 3} more` : ""}`,
        variant: "destructive",
      });
    }

    // Show success message if any chips were successfully assigned
    if (successfulChips.length > 0) {
      toast({
        title: "Chips Assigned Successfully",
        description: `Successfully assigned ${successfulChips.length} chip(s) to ${artistName}${successfulChips.length <= 3 ? `:\n${successfulChips.join("\n")}` : ""}`,
      });
    }

    setChipDataArray([{ chipId: '', label: '' }]);
    setSelectedArtistId(null);
    await fetchChipLinks();
    setIsLoading(false);
  };

  const handleDisconnect = async (id: number) => {
    setIsLoading(true);
    const chip = chipLinks.find(c => c.id === id);
    const result = await disconnectChipLink(id);
    if (result) {
      toast({
        title: "Chip Disconnected",
        description: `Successfully disconnected chip ${chip?.chip_id || id} from its collectible.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to disconnect the chip. Please try again.",
        variant: "destructive",
      });
    }
    await fetchChipLinks();
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    const chip = chipLinks.find(c => c.id === id);
    const result = await deleteChipLink(id);
    if (result) {
      toast({
        title: "Chip Revoked",
        description: `Successfully revoked chip ${chip?.chip_id || id} from the artist.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to revoke the chip. Please try again.",
        variant: "destructive",
      });
    }
    await fetchChipLinks();
    setIsLoading(false);
  };

  const handleEdit = (chip: ChipLinkDetailed) => {
    setSelectedChipForEdit(chip);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (chipId: number, updatedData: { chip_id: string; label: string | null }) => {
    setIsLoading(true);
    const originalChip = chipLinks.find(c => c.id === chipId);
    
    if (originalChip) {
      const updatedChip = {
        ...originalChip,
        chip_id: updatedData.chip_id,
        label: updatedData.label,
      };
      
      const result = await updateChipLink(chipId, updatedChip);
      if (result) {
        toast({
          title: "Chip Updated",
          description: `Successfully updated chip to "${updatedData.chip_id}"${updatedData.label ? ` with label "${updatedData.label}"` : ''}.`,
        });
        await fetchChipLinks();
      } else {
        toast({
          title: "Error",
          description: "Failed to update the chip. Please try again.",
          variant: "destructive",
        });
      }
    }
    setIsLoading(false);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedChipForEdit(null);
  };

  // Filter chip links by search query
  const filteredChipLinks = chipLinks.filter(
    (chip) =>
      chip.chip_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chip.metadata?.artist || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (chip.label || "")
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

  const handleArtistSearch = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if ('target' in e && e.target instanceof HTMLInputElement) {
      setArtistSearchQuery(e.target.value);
    }
  };

  const selectedArtist = artists.find(artist => artist.id === selectedArtistId);
  const filteredArtists = artists.filter(artist => 
    artist.username.toLowerCase().includes(artistSearchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (artistDropdownRef.current && !artistDropdownRef.current.contains(event.target as Node)) {
        setIsArtistDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="container mx-auto p-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Chip Management</h1>
        <p className="text-muted-foreground">Assign, track, and manage chips for your artists</p>
      </div>

      {/* Section 1: Chip Assignment Form */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="p-6 border rounded-xl bg-card space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Assign New Chips</h2>
            <p className="text-sm text-muted-foreground mt-1">Add new chips to your artists&apos; collections</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Chip IDs and Labels
              </label>
              <div className="space-y-2">
                {chipDataArray.map((chipData, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      type="text"
                      placeholder="Chip ID"
                      value={chipData.chipId}
                      onChange={(e) => updateChipData(index, 'chipId', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="text"
                      placeholder="Label (optional)"
                      value={chipData.label}
                      onChange={(e) => updateChipData(index, 'label', e.target.value)}
                      className="flex-1"
                    />
                    {chipDataArray.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeChipRow(index)}
                        className="p-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChipRow}
                  className="w-full"
                >
                  + Add Another Chip
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter chip IDs and optional labels for each chip
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select Artist
                </label>
                <div className="relative" ref={artistDropdownRef}>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isArtistDropdownOpen}
                    className="w-full justify-between font-normal"
                    onClick={() => setIsArtistDropdownOpen(!isArtistDropdownOpen)}
                  >
                    {selectedArtist ? selectedArtist.username : "Select an artist..."}
                    <ChevronDown className={`ml-2 h-4 w-4 shrink-0 transition-transform ${isArtistDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {isArtistDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground shadow-md rounded-md border animate-in fade-in-0 zoom-in-95">
                      <div className="p-2">
                        <Input
                          type="text"
                          placeholder="Search artists..."
                          value={artistSearchQuery}
                          onChange={(e) => setArtistSearchQuery(e.target.value)}
                          className="mb-2"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-[200px] overflow-auto">
                        {filteredArtists.length === 0 ? (
                          <div className="py-2 px-3 text-sm text-muted-foreground">
                            No artists found
                          </div>
                        ) : (
                          <div className="py-1">
                            {filteredArtists.map((artist) => (
                              <button
                                key={artist.id}
                                type="button"
                                className={cn(
                                  "relative w-full flex items-center py-1.5 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                  selectedArtistId === artist.id && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                  setSelectedArtistId(artist.id);
                                  setIsArtistDropdownOpen(false);
                                  setArtistSearchQuery("");
                                }}
                              >
                                {artist.username}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Search and select an artist to assign the chips to
                </p>
              </div>

              <Button
                type="submit"
                className="w-full font-semibold"
                size="lg"
                disabled={isLoading || !selectedArtistId || chipDataArray.every(chip => chip.chipId.trim() === '')}
              >
                {isLoading ? "Adding..." : "Assign Chips"}
              </Button>
            </div>
          </form>
        </div>

        {/* Section 2: Search and Filter */}
        <div className="p-6 border rounded-xl bg-card space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Search Chips</h2>
            <p className="text-sm text-muted-foreground mt-1">Find and manage existing chip assignments</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by chip ID, label, or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-base w-full"
            />
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-2">
              <span>Total Chips</span>
              <span className="font-medium text-foreground">{chipLinks.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-2">
              <span>Connected to Collectibles</span>
              <span className="font-medium text-foreground">
                {chipLinks.filter(chip => chip.collectible_id).length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-2">
              <span>Connected to Batch Listings</span>
              <span className="font-medium text-foreground">
                {chipLinks.filter(chip => chip.batch_listing_id).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-foreground w-[200px] border-r">
                Artist
              </TableHead>
              <TableHead className="font-semibold text-foreground">Chip ID</TableHead>
              <TableHead className="font-semibold text-foreground">Label</TableHead>
              <TableHead className="font-semibold text-foreground">Collectible</TableHead>
              <TableHead className="font-semibold text-foreground">Batch</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(chipsByArtist).map(([artistName, chips]) =>
              chips.map((chip, index) => (
                <TableRow
                  key={chip.id}
                  className="hover:bg-muted/50 transition-colors duration-200"
                >
                  {index === 0 ? (
                    <TableCell
                      rowSpan={chips.length}
                      className="font-medium border-r bg-muted/30"
                    >
                      {artistName}
                    </TableCell>
                  ) : null}
                  <TableCell className="font-medium">{chip.chip_id}</TableCell>
                  <TableCell>
                    {chip.label ? (
                      <span className="text-sm bg-secondary/50 px-2 py-1 rounded">
                        {chip.label}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">No label</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {chip.collectible_id ? (
                      <div className="text-primary underline hover:text-primary/80 transition-colors">
                        {chip.metadata?.collectible_name || chip.collectible_id}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {chip.batch_listing_id ? (
                      <div className="text-primary underline hover:text-primary/80 transition-colors">
                        Batch #{chip.batch_listing_id}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                      <DropdownMenuContent align="end" className="w-72">
                        <DropdownMenuItem
                          onClick={() => handleEdit(chip)}
                          className="cursor-pointer flex-col items-start gap-0.5 py-2"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Edit className="h-4 w-4" />
                            <span>Edit Chip</span>
                          </div>
                          <p className="text-xs text-muted-foreground pl-6">
                            Edit the chip ID and label
                          </p>
                        </DropdownMenuItem>
                        {chip.collectible_id && (
                          <DropdownMenuItem
                            onClick={() => handleDisconnect(chip.id)}
                            className="cursor-pointer flex-col items-start gap-0.5 py-2"
                          >
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <X className="h-4 w-4" />
                              <span>Disconnect Chip</span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6">
                              Disconnect the chip with the collectible and batch if present but will be
                              still assigned to the artist
                            </p>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(chip.id)}
                          className="cursor-pointer flex-col items-start gap-0.5 py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Trash2 className="h-4 w-4" />
                            <span>Revoke Chip</span>
                          </div>
                          <p className="text-xs text-red-500/80 pl-6">
                            Permanently delete this chip from the system and
                            artist
                          </p>
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
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8" />
                    <p>No chip assignments found</p>
                    <p className="text-sm">Add a new chip assignment using the form above</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditChipModal
        key={selectedChipForEdit?.id || 'edit-modal'}
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        chip={selectedChipForEdit}
        onUpdate={handleEditSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
