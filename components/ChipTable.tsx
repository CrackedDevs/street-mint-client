"use client";

import { useState, useMemo, useEffect } from "react";
import {
  MoreVertical,
  Pencil,
  Trash2,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UpdateChipModal from "./UpdateChipModal";
import { Input } from "@/components/ui/input";
import { ChipLink, ChipLinkDetailed } from "@/lib/supabaseAdminClient";

type SortField = "chip_id" | "collectible_id" | "created_at";

export default function ChipTable({
  chipLinks,
  onDelete,
  onUpdate,
}: {
  chipLinks: ChipLinkDetailed[];
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, chipLink: ChipLink) => Promise<void>;
}) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState<ChipLinkDetailed | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("chip_id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleUpdate = (chip: ChipLinkDetailed) => {
    setSelectedChip(chip);
    setIsUpdateModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    console.log("Delete chip:", id);
    await onDelete(id);
  };

  const handleUpdateSubmit = async (updatedChip: ChipLinkDetailed) => {
    setSelectedChip(updatedChip);
    await onUpdate(updatedChip.id, {
      id: updatedChip.id,
      chip_id: updatedChip.chip_id,
      collectible_id: updatedChip.collectible_id,
      active: updatedChip.active,
      created_at: updatedChip.created_at,
    });
    setIsUpdateModalOpen(false);
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedChips = useMemo(() => {
    return chipLinks
      .filter(
        (chip) =>
          chip.chip_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (chip.collectible_id?.toString() || '').includes(searchQuery.toLowerCase()) ||
          chip.created_at.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chip.metadata.artist
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          chip.metadata.collectible_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          chip.metadata.location
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          chip.metadata.location_note
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          chip.metadata.collectible_description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          chip.metadata.collection_id
            .toString()
            .includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Handle null values in sorting
        const aValue = a[sortField] ?? '';
        const bValue = b[sortField] ?? '';
        
        if (aValue < bValue)
          return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue)
          return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [chipLinks, searchQuery, sortField, sortDirection]);

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">
            {chipLinks.length}
          </div>
          <div className="text-sm text-gray-500">Total Chips Linked</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">
            {new Set(chipLinks.map((chip) => chip.collectible_id)).size}
          </div>
          <div className="text-sm text-gray-500">Unique Collectibles</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">
            {
              chipLinks.filter(
                (chip) =>
                  new Date(chip.created_at).toDateString() ===
                  new Date().toDateString()
              ).length
            }
          </div>
          <div className="text-sm text-gray-500">Added Today</div>
        </div>
      </div>
      <div className="mb-4">
        <form className="flex space-x-4 h-11">
          <Input
            type="text"
            placeholder="Search chips . . ."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="flex-grow max-w-[380px] px-5 text-base h-full"
          />
        </form>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("chip_id")}
                  className="font-semibold"
                >
                  Chip ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-gray-600 py-3">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("collectible_id")}
                  className="font-semibold"
                >
                  Collectible ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                Artist
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                Collectible Name
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                Location
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                Location Note
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                Collectible Link
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedChips.map((chip) => (
              <TableRow
                key={chip.id}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <TableCell>{chip.chip_id}</TableCell>
                <TableCell>{chip.collectible_id}</TableCell>
                <TableCell>{chip.metadata.artist}</TableCell>
                <TableCell>{chip.metadata.collectible_name}</TableCell>
                <TableCell>
                  <a
                    href={chip.metadata.location}
                    target="_blank"
                    className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors duration-200"
                  >
                    View Location
                  </a>
                </TableCell>
                <TableCell>
                  {chip.metadata.location_note.slice(0, 30)}
                </TableCell>
                <TableCell>
                  <a
                    href={`/mint/${chip.collectible_id}`}
                    target="_blank"
                    className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors duration-200"
                  >
                    View Collectible
                  </a>
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
                        onClick={() => handleUpdate(chip)}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Update</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(chip.id)}
                        className="cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedChip && (
        <UpdateChipModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          chip={selectedChip}
          onUpdate={handleUpdateSubmit}
        />
      )}
    </>
  );
}
