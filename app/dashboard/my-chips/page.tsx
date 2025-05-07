"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Settings, Trash2, Calendar } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import withAuth from "../withAuth";
import { Loader2Icon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import {
  getChipLinksByArtistId,
  ChipLink,
  getScheduledCollectibleChanges,
  scheduleCollectibleChange,
  deleteScheduledCollectibleChange,
  ScheduledCollectibleChange,
  disconnectChipToCollectible,
  disconnectChipFromBatch,
} from "@/lib/supabaseAdminClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchCollectiblesByCollectionId,
  getCollectionsByArtistId,
  fetchCollectibleById,
} from "@/lib/supabaseClient";
import { formatDate } from "@/helper/date";

// Define a simpler type for our component since we don't have the detailed metadata
type ChipLinkWithMetadata = ChipLink & {
  collectibleName?: string;
  collectionId?: number;
  batch_listing_id?: string | null;
};

// Type for scheduled changes - using the type from supabaseAdminClient
type ScheduledChange = ScheduledCollectibleChange;

// Simplified collectible type for our component
type SimpleCollectible = {
  id: number;
  name: string;
};

function MyChipsPage() {
  const [chipLinks, setChipLinks] = useState<ChipLinkWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { publicKey, connected } = useWallet();
  const { userProfile } = useUserProfile();

  // State for modal
  const [selectedChip, setSelectedChip] = useState<ChipLinkWithMetadata | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collectibles, setCollectibles] = useState<SimpleCollectible[]>([]);
  const [selectedCollectibleId, setSelectedCollectibleId] = useState<
    number | null
  >(null);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [loadingCollectibles, setLoadingCollectibles] = useState(false);
  const [scheduledChanges, setScheduledChanges] = useState<ScheduledChange[]>(
    []
  );
  // Add state for disconnect confirmation
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  // Add state for batch disconnect confirmation
  const [showBatchDisconnectConfirm, setShowBatchDisconnectConfirm] = useState(false);

  useEffect(() => {
    async function fetchChipLinks() {
      if (!connected || !publicKey) {
        setError("Please connect your wallet to view your chips.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        if (userProfile && publicKey) {
          const chipLinksData = await getChipLinksByArtistId(userProfile.id);
          if (!chipLinksData) {
            throw new Error("Failed to fetch chip data");
          }

          // For each chip link, fetch the collectible details if available
          const enhancedChipLinksPromises = chipLinksData.map(async (chip) => {
            if (chip.collectible_id) {
              const collectible = await fetchCollectibleById(
                chip.collectible_id
              );
              if (collectible) {
                return {
                  ...chip,
                  collectibleName: collectible.name,
                  collectionId: collectible.collection_id,
                };
              }
            }
            return {
              ...chip,
              collectibleName: undefined,
              collectionId: undefined,
            };
          });

          const enhancedChipLinks = await Promise.all(
            enhancedChipLinksPromises
          );
          // Convert batch_listing_id from number to string or null if undefined
          const formattedEnhancedChipLinks = enhancedChipLinks.map(link => ({
            ...link,
            batch_listing_id: link.batch_listing_id ? String(link.batch_listing_id) : null
          }));
          setChipLinks(formattedEnhancedChipLinks);

          // Fetch scheduled changes from the database
          const scheduledChangesData = await getScheduledCollectibleChanges();
          if (scheduledChangesData) {
            setScheduledChanges(scheduledChangesData);
          }
        }
      } catch (error) {
        console.error("Error in fetchChipLinks:", error);
        setError("An unexpected error occurred. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to fetch chip data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchChipLinks();
  }, [userProfile, connected, publicKey]);

  // Function to fetch collectibles when a chip is selected
  const fetchCollectiblesForArtist = async () => {
    if (!userProfile) return;

    setLoadingCollectibles(true);
    try {
      // Use the userProfile ID to fetch collections
      const artistId = userProfile.id;

      // Fetch collections for the artist
      const collections = await getCollectionsByArtistId(artistId);

      if (collections.length === 0) {
        setCollectibles([]);
        return;
      }

      // Fetch collectibles from all collections of the artist
      const collectiblesPromises = collections.map(async (collection) => {
        const collectionsData = await fetchCollectiblesByCollectionId(
          collection.id
        );
        return collectionsData || [];
      });

      const collectiblesArrays = await Promise.all(collectiblesPromises);

      // Flatten the array of arrays into a single array of collectibles
      const allCollectibles = collectiblesArrays.flat();

      // Map to a simpler type to avoid type issues
      const simpleCollectibles = allCollectibles.map((collectible) => ({
        id: collectible.id,
        name: collectible.name,
      }));

      setCollectibles(simpleCollectibles);
    } catch (error) {
      console.error("Error fetching collectibles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch collectibles. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoadingCollectibles(false);
    }
  };

  const handleOpenModal = (chip: ChipLinkWithMetadata) => {
    setSelectedChip(chip);
    setSelectedCollectibleId(chip.collectible_id || null);
    setScheduledDate("");
    setScheduledTime("");
    fetchCollectiblesForArtist();
    setIsModalOpen(true);
  };

  const handleScheduleChange = async () => {
    if (
      !selectedChip ||
      !selectedCollectibleId ||
      !scheduledDate ||
      !scheduledTime
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if chip is assigned to a batch
    if (selectedChip.batch_listing_id) {
      toast({
        title: "Error",
        description: "Cannot schedule changes for chips assigned to a batch. Please disconnect from batch first.",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = new Date(
      formatDate(
        `${scheduledDate}T${scheduledTime}`,
        "yyyy-MM-dd'T'HH:mm",
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
      )
    );
    const scheduleUnix = Math.floor(scheduledDateTime.getTime() / 1000);

    try {
      // Check if there's an existing scheduled change for this chip
      const existingSchedule = getScheduledChangeForChip(selectedChip.chip_id);

      // If there's an existing schedule that hasn't been executed, delete it first
      if (existingSchedule && existingSchedule.executed === false) {
        const deleteSuccess = await deleteScheduledCollectibleChange(
          existingSchedule.id
        );
        if (!deleteSuccess) {
          throw new Error("Failed to delete existing scheduled change");
        }
      }

      // Save the new scheduled change to the database
      await scheduleCollectibleChange(
        selectedChip.chip_id,
        selectedCollectibleId,
        scheduleUnix
      );

      // Refresh the scheduled changes
      const scheduledChangesData = await getScheduledCollectibleChanges();
      if (scheduledChangesData) {
        setScheduledChanges(scheduledChangesData);
      }

      toast({
        title: "Success",
        description: "Change scheduled successfully.",
      });

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error scheduling change:", error);
      toast({
        title: "Error",
        description: "Failed to schedule change. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectChip = async () => {
    if (!selectedChip) return;
    
    try {
      if (selectedChip.collectible_id) {
        const disconnectChipSuccess = await disconnectChipToCollectible(selectedChip.chip_id);

        if (!disconnectChipSuccess) {
          toast({
            title: "Error",
            description: "Failed to disconnect chip. Please try again later.",
            variant: "destructive",
          });
          return;
        }

        const updatedChipLinks = chipLinks.map((chip) => {
          if (chip.id === selectedChip.id) {
            return {
              ...chip,
              collectible_id: null,
            };
          }
          return chip;
        });
        setChipLinks(updatedChipLinks);
      }

      toast({
        title: "Success",
        description: "Chip disconnected successfully.",
      });

      setShowDisconnectConfirm(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error disconnecting chip:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect chip. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Handle disconnecting chip from batch
  const handleDisconnectChipFromBatch = async () => {
    if (!selectedChip) return;
    
    try {
      if (selectedChip.batch_listing_id) {
        const disconnectSuccess = await disconnectChipFromBatch(selectedChip.id);

        if (!disconnectSuccess) {
          toast({
            title: "Error",
            description: "Failed to disconnect chip from batch. Please try again later.",
            variant: "destructive",
          });
          return;
        }

        const updatedChipLinks = chipLinks.map((chip) => {
          if (chip.id === selectedChip.id) {
            return {
              ...chip,
              batch_listing_id: null,
            };
          }
          return chip;
        });
        setChipLinks(updatedChipLinks);
      }

      toast({
        title: "Success",
        description: "Chip disconnected from batch successfully.",
      });

      setShowBatchDisconnectConfirm(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error disconnecting chip from batch:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect chip from batch. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteScheduledChange = async (id: number) => {
    try {
      // Delete the scheduled change from the database
      const success = await deleteScheduledCollectibleChange(id);

      if (success) {
        // Update the local state
        setScheduledChanges(
          scheduledChanges.filter((change) => change.id !== id)
        );

        toast({
          title: "Success",
          description: "Scheduled change deleted successfully.",
        });
      } else {
        throw new Error("Failed to delete scheduled change");
      }
    } catch (error) {
      console.error("Error deleting scheduled change:", error);
      toast({
        title: "Error",
        description:
          "Failed to delete scheduled change. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Filter chip links by search query
  const filteredChipLinks = chipLinks.filter(
    (chip) =>
      chip.chip_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chip.collectibleName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (chip.batch_listing_id || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Get scheduled change for a specific chip
  const getScheduledChangeForChip = (chipId: string) => {
    return scheduledChanges.find((change) => change.chip_id === chipId);
  };

  if (!connected) {
    return <></>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Chips</h1>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by chip ID, collectible name, or batch ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-2"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2Icon className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-red-500">
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center mb-4">{error}</p>
            </CardContent>
          </Card>
        ) : filteredChipLinks.length === 0 ? (
          <Card className="w-full">
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                {searchQuery
                  ? "No chips found matching your search."
                  : "You don't have any chips assigned yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-600">
                    Chip ID
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Collectible
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Batch Listing
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
                {filteredChipLinks.map((chip) => (
                  <TableRow
                    key={chip.id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <TableCell className="font-medium">
                      {chip.chip_id}
                    </TableCell>
                    <TableCell>
                      {chip.collectible_id ? (
                        <div className="flex items-center space-x-3">
                          {chip.collectibleName || "Unnamed Collectible"}
                          <span className="text-gray-500 text-sm ml-2">
                            (ID: {chip.collectible_id})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}

                      {/* Show scheduled change if exists */}
                      {getScheduledChangeForChip(chip.chip_id) && (
                        <div className="mt-1 text-sm text-blue-600 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Change scheduled to ID:{" "}
                          {
                            getScheduledChangeForChip(chip.chip_id)
                              ?.collectible_id
                          }{" "}
                          on{" "}
                          {formatDate(
                            new Date(
                              getScheduledChangeForChip(chip.chip_id)
                                ?.schedule_unix! * 1000
                            ).toISOString(),
                            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                            "yyyy-MM-dd HH:mm"
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {chip.batch_listing_id ? (
                        <div className="flex items-center justify-between">
                          <span>{chip.batch_listing_id}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal(chip)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal for managing chip-collectible connections */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Chip Connection</DialogTitle>
            <DialogDescription>
              {selectedChip && (
                <span className="font-medium">
                  Chip ID: {selectedChip.chip_id}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Show batch info if assigned */}
            {selectedChip?.batch_listing_id && (
              <div>
                <h3 className="text-sm font-medium mb-2">Batch Listing</h3>
                <div className="p-3 bg-blue-50 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      Batch ID: {selectedChip.batch_listing_id}
                    </p>
                    <p className="text-sm text-red-500">
                      Chip is assigned to a batch. Cannot schedule or assign collectibles.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => setShowBatchDisconnectConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">Current Collectible</h3>
              <div className="p-3 bg-gray-50 rounded-md">
                {selectedChip?.collectible_id ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {selectedChip.collectibleName}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {selectedChip.collectible_id}
                      </p>
                    </div>
                    {/* Add disconnect button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => setShowDisconnectConfirm(true)}
                      disabled={!!selectedChip?.batch_listing_id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500">No collectible assigned</p>
                )}
              </div>
            </div>

            {/* Scheduled changes section */}
            {selectedChip &&
              getScheduledChangeForChip(selectedChip.chip_id) && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Scheduled Change</h3>
                  <div className="p-3 bg-blue-50 rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        New Collectible ID:{" "}
                        {
                          getScheduledChangeForChip(selectedChip.chip_id)
                            ?.collectible_id
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        Scheduled for:{" "}
                        {formatDate(
                          new Date(
                            getScheduledChangeForChip(selectedChip.chip_id)
                              ?.schedule_unix! * 1000
                          ).toISOString(),
                          "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                          "yyyy-MM-dd HH:mm"
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() =>
                        handleDeleteScheduledChange(
                          getScheduledChangeForChip(selectedChip.chip_id)?.id ||
                            0
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

            {/* Schedule a change section - only shown if not in batch */}
            {!selectedChip?.batch_listing_id && (
              <div>
                <h3 className="text-sm font-medium mb-2">Schedule a Change</h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500 mb-1 block">
                      Select Collectible
                    </label>
                    <Select
                      value={selectedCollectibleId?.toString() || ""}
                      onValueChange={(value) =>
                        setSelectedCollectibleId(Number(value))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a collectible" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCollectibles ? (
                          <div className="flex justify-center p-2">
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          collectibles.map((collectible) => (
                            <SelectItem
                              key={collectible.id}
                              value={collectible.id.toString()}
                            >
                              {collectible.name} (ID: {collectible.id})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">
                        Date
                      </label>
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => {
                          setScheduledDate(e.target.value);
                        }}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">
                        Time
                      </label>
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => {
                          setScheduledTime(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            {!selectedChip?.batch_listing_id && (
              <Button onClick={handleScheduleChange}>Schedule Change</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add disconnect confirmation dialog */}
      <Dialog open={showDisconnectConfirm} onOpenChange={setShowDisconnectConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disconnect Chip</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect this chip from its collectible? This action will remove the association immediately.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDisconnectConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnectChip}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add batch disconnect confirmation dialog */}
      <Dialog open={showBatchDisconnectConfirm} onOpenChange={setShowBatchDisconnectConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disconnect from Batch</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect this chip from its batch listing? This action will remove the association immediately.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowBatchDisconnectConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnectChipFromBatch}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(MyChipsPage);
