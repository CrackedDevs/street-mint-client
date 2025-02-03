"use client"

import { useState, useMemo } from "react"
import { MoreVertical, Pencil, Trash2, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import UpdateChipModal from "./UpdateChipModal"
import SearchBar from "./SearchBar"

interface Chip {
  id: number
  chipId: string
  collectibleId: string
  dateTime: string
}

const mockData: Chip[] = [
  { id: 1, chipId: "CHIP001", collectibleId: "COLL001", dateTime: "2023-06-01 10:00:00" },
  { id: 2, chipId: "CHIP002", collectibleId: "COLL002", dateTime: "2023-06-02 11:30:00" },
  { id: 3, chipId: "CHIP003", collectibleId: "COLL003", dateTime: "2023-06-03 09:15:00" },
  { id: 4, chipId: "CHIP004", collectibleId: "COLL004", dateTime: "2023-06-04 14:45:00" },
]

type SortField = "chipId" | "collectibleId" | "dateTime"

export default function ChipTable() {
  const [chips, setChips] = useState<Chip[]>(mockData)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [selectedChip, setSelectedChip] = useState<Chip | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("chipId")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleUpdate = (chip: Chip) => {
    setSelectedChip(chip)
    setIsUpdateModalOpen(true)
  }

  const handleDelete = (id: number) => {
    setChips(chips.filter((chip) => chip.id !== id))
  }

  const handleUpdateSubmit = (updatedChip: Chip) => {
    setChips(chips.map((chip) => (chip.id === updatedChip.id ? updatedChip : chip)))
    setIsUpdateModalOpen(false)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredAndSortedChips = useMemo(() => {
    return chips
      .filter(
        (chip) =>
          chip.chipId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chip.collectibleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chip.dateTime.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => {
        if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1
        if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1
        return 0
      })
  }, [chips, searchQuery, sortField, sortDirection])

  return (
    <>
      <div className="mb-4">
        <SearchBar onSearch={handleSearch} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600">ID</TableHead>
              <TableHead className="font-semibold text-gray-600">
                <Button variant="ghost" onClick={() => handleSort("chipId")} className="font-semibold">
                  Chip ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                <Button variant="ghost" onClick={() => handleSort("collectibleId")} className="font-semibold">
                  Collectible ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                <Button variant="ghost" onClick={() => handleSort("dateTime")} className="font-semibold">
                  Date and Time
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-gray-600">Collectible Link</TableHead>
              <TableHead className="font-semibold text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedChips.map((chip) => (
              <TableRow key={chip.id} className="hover:bg-gray-50 transition-colors duration-200">
                <TableCell>{chip.id}</TableCell>
                <TableCell>{chip.chipId}</TableCell>
                <TableCell>{chip.collectibleId}</TableCell>
                <TableCell>{chip.dateTime}</TableCell>
                <TableCell>
                  <a
                    href={`/collectible/${chip.collectibleId}`}
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
                      <DropdownMenuItem onClick={() => handleUpdate(chip)} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Update</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(chip.id)} className="cursor-pointer">
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
  )
}

