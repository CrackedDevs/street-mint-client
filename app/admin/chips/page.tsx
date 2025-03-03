"use client";

import { useEffect, useState } from "react";
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
import { MoreVertical, Trash2, ArrowUpDown, Search } from "lucide-react";
import { 
  getAllArtists, 
  createChipLink, 
  getAllChipLinks, 
  deleteChipLink,
  ChipLinkDetailed
} from "@/lib/supabaseAdminClient";

export default function ChipsManagementPage() {
  const [chipIds, setChipIds] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [chipLinks, setChipLinks] = useState<ChipLinkDetailed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

    // Split the input by commas, new lines, or spaces and filter out empty strings
    const chipIdArray = chipIds
      .split(/[\n,\s]+/)
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    if (chipIdArray.length === 0) return;
    
    setIsLoading(true);
    
    // Process each chip ID
    for (const chipId of chipIdArray) {
      await createChipLink({
        chip_id: chipId,
        collectible_id: null,
        active: true,
        artists_id: selectedArtistId
      });
    }
    
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
      (chip.metadata?.artist || "").toLowerCase().includes(searchQuery.toLowerCase())
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
              <TableHead className="font-semibold text-gray-600">Artist</TableHead>
              <TableHead className="font-semibold text-gray-600">Chip ID</TableHead>
              <TableHead className="font-semibold text-gray-600">Collectible</TableHead>
              <TableHead className="font-semibold text-gray-600">Status</TableHead>
              <TableHead className="font-semibold text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(chipsByArtist).map(([artistName, chips]) => (
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
                      <a
                        href={`/mint/${chip.collectible_id}`}
                        target="_blank"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors duration-200"
                      >
                        {chip.metadata?.collectible_name || chip.collectible_id}
                      </a>
                    ) : (
                      <span className="text-gray-500">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${chip.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {chip.active ? 'Active' : 'Inactive'}
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
                        <DropdownMenuItem
                          onClick={() => window.open(`/chip/${chip.chip_id}`, '_blank')}
                          className="cursor-pointer"
                        >
                          <span>View Chip URL</span>
                        </DropdownMenuItem>
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
            ))}
            {Object.keys(chipsByArtist).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
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