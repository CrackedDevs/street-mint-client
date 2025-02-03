"use client";

import { useState, useMemo } from "react";
import { MoreVertical, Pencil, Trash2, ArrowUpDown } from "lucide-react";
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
import SearchBar from "./SearchBar";
import { ChipLink } from "@/lib/supabaseAdminClient";

type SortField = "chip_id" | "collectible_id" | "created_at";

export default function ChipTable({ chipLinks }: { chipLinks: ChipLink[] }) {
  const [chips, setChips] = useState<ChipLink[]>(chipLinks);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState<ChipLink | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("chip_id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleUpdate = (chip: ChipLink) => {
    setSelectedChip(chip);
    setIsUpdateModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setChips(chips.filter((chip) => chip.id !== id));
  };

  const handleUpdateSubmit = (updatedChip: ChipLink) => {
    setChips(
      chips.map((chip) => (chip.id === updatedChip.id ? updatedChip : chip))
    );
    setIsUpdateModalOpen(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
    return chips
      .filter(
        (chip) =>
          chip.chip_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chip.collectible_id.toString().includes(searchQuery.toLowerCase()) ||
          chip.created_at.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (a[sortField] < b[sortField])
          return sortDirection === "asc" ? -1 : 1;
        if (a[sortField] > b[sortField])
          return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [chips, searchQuery, sortField, sortDirection]);

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{chipLinks.length}</div>
          <div className="text-sm text-gray-500">Total Chips Linked</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">
            {new Set(filteredAndSortedChips.map(chip => chip.collectible_id)).size}
          </div>
          <div className="text-sm text-gray-500">Unique Collectibles</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">
            {filteredAndSortedChips.filter(chip => 
              new Date(chip.created_at).toDateString() === new Date().toDateString()
            ).length}
          </div>
          <div className="text-sm text-gray-500">Added Today</div>
        </div>
      </div>
      <div className="mb-4">
        <SearchBar onSearch={handleSearch} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600">ID</TableHead>
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
              <TableHead className="font-semibold text-gray-600">
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
                <Button
                  variant="ghost"
                  onClick={() => handleSort("created_at")}
                  className="font-semibold"
                >
                  Date and Time
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
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
                <TableCell>{chip.id}</TableCell>
                <TableCell>{chip.chip_id}</TableCell>
                <TableCell>{chip.collectible_id}</TableCell>
                <TableCell>{chip.created_at}</TableCell>
                <TableCell>
                  <a
                    href={`/collectible/${chip.collectible_id}`}
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
