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
import { Search, Settings, Trash2, Calendar, Plus } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import withAuth from "../withAuth";
import { Loader2Icon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import {
  getChipLinksByArtistId,
  ChipLink,
  getScheduledCollectibleChanges,
  scheduleMultipleCollectibleChanges,
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
};

// Type for scheduled changes - using the type from supabaseAdminClient
type ScheduledChange = ScheduledCollectibleChange;

// Simplified collectible type for our component
type SimpleCollectible = {
  id: number;
  name: string;
};

// Type for managing multiple scheduled changes in the form
type ScheduledChangeForm = {
  id?: number; // Optional, only for existing changes
  collectibleId: number | null;
  scheduledDate: string;
  scheduledTime: string;
  collectibleSearchQuery: string;
  isCollectibleDropdownOpen: boolean;
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
  const [loadingCollectibles, setLoadingCollectibles] = useState(false);
  const [scheduledChanges, setScheduledChanges] = useState<ScheduledChange[]>(
    []
  );
  // Add state for disconnect confirmation
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  // Add state for batch disconnect confirmation
  const [showBatchDisconnectConfirm, setShowBatchDisconnectConfirm] = useState(false);
  // Add state for collectible name lookup
  const [collectibleNamesMap, setCollectibleNamesMap] = useState<Record<number, string>>({});
  // Add loading state for schedule change
  const [isSchedulingChange, setIsSchedulingChange] = useState(false);

  // New state for multiple scheduled changes
  const [scheduledChangeForms, setScheduledChangeForms] = useState<ScheduledChangeForm[]>([
    {
      collectibleId: null,
      scheduledDate: "",
      scheduledTime: "",
      collectibleSearchQuery: "",
      isCollectibleDropdownOpen: false,
    }
  ]);

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
            batch_listing_id: link.batch_listing_id ? Number(link.batch_listing_id) : null
          }));
          setChipLinks(formattedEnhancedChipLinks);

          // Fetch scheduled changes from the database
          const scheduledChangesData = await getScheduledCollectibleChanges();
          if (scheduledChangesData) {
            setScheduledChanges(scheduledChangesData);
            
            // Build collectible names map for scheduled changes
            const collectibleIds = [...new Set(scheduledChangesData.map(change => change.collectible_id).filter((id): id is number => id !== null))];
            const collectibleNamePromises = collectibleIds.map(async (id) => {
              const collectible = await fetchCollectibleById(id);
              return { id, name: collectible?.name || `Collectible ${id}` };
            });
            
            const collectibleNames = await Promise.all(collectibleNamePromises);
            const namesMap = collectibleNames.reduce((acc, { id, name }) => {
              acc[id] = name;
              return acc;
            }, {} as Record<number, string>);
            
            setCollectibleNamesMap(namesMap);
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
    
    // Check if there are existing scheduled changes for this chip
    const existingSchedules = getScheduledChangesForChip(chip.chip_id);
    
    if (existingSchedules.length > 0) {
      // If there are scheduled changes, populate the form with existing values
      const forms = existingSchedules
        .sort((a, b) => (a.schedule_unix || 0) - (b.schedule_unix || 0))
        .map(schedule => {
          const scheduleDate = new Date((schedule.schedule_unix || 0) * 1000);
          const dateString = scheduleDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          const timeString = scheduleDate.toISOString().split('T')[1].substring(0, 5); // HH:MM format
          
          return {
            id: schedule.id,
            collectibleId: schedule.collectible_id,
            scheduledDate: dateString,
            scheduledTime: timeString,
            collectibleSearchQuery: "",
            isCollectibleDropdownOpen: false,
          };
        });
      
      setScheduledChangeForms(forms);
    } else {
      // No scheduled changes, start with one empty form
      setScheduledChangeForms([
        {
          collectibleId: null,
          scheduledDate: "",
          scheduledTime: "",
          collectibleSearchQuery: "",
          isCollectibleDropdownOpen: false,
        }
      ]);
    }
    
    fetchCollectiblesForArtist();
    setIsModalOpen(true);
  };

  const handleScheduleChange = async () => {
    // Validate that we have at least one complete entry
    const validForms = scheduledChangeForms.filter(form => 
      form.collectibleId !== null && form.scheduledDate && form.scheduledTime
    );

    if (!selectedChip || validForms.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in at least one complete schedule entry.",
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

    // Validate that all scheduled times are in the future and in sequential order
    const now = new Date().getTime();
    const schedules = validForms.map(form => {
      const scheduleTime = new Date(
        formatDate(
          `${form.scheduledDate}T${form.scheduledTime}`,
          "yyyy-MM-dd'T'HH:mm",
          "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        )
      ).getTime();
      return { form, scheduleTime };
    }).sort((a, b) => a.scheduleTime - b.scheduleTime);

    // Check if all are in the future
    if (schedules[0].scheduleTime <= now) {
      toast({
        title: "Error",
        description: "All scheduled times must be in the future.",
        variant: "destructive",
      });
      return;
    }

    setIsSchedulingChange(true);

    try {
      // Save the new scheduled changes to the database
      await scheduleMultipleCollectibleChanges(
        selectedChip.chip_id,
        schedules.map(({ form, scheduleTime }) => ({
          collectibleId: form.collectibleId!,
          scheduleUnix: Math.floor(scheduleTime / 1000)
        }))
      );

      // Refresh the scheduled changes
      const scheduledChangesData = await getScheduledCollectibleChanges();
      if (scheduledChangesData) {
        setScheduledChanges(scheduledChangesData);
        
        const collectibleIds = [...new Set(scheduledChangesData.map(change => change.collectible_id).filter((id): id is number => id !== null))];
        const collectibleNamePromises = collectibleIds.map(async (id) => {
          const collectible = await fetchCollectibleById(id);
          return { id, name: collectible?.name || `Collectible ${id}` };
        });
        
        const collectibleNames = await Promise.all(collectibleNamePromises);
        const namesMap = collectibleNames.reduce((acc, { id, name }) => {
          acc[id] = name;
          return acc;
        }, {} as Record<number, string>);
        
        setCollectibleNamesMap(namesMap);
      }

      toast({
        title: "Success",
        description: `${validForms.length} change${validForms.length > 1 ? 's' : ''} scheduled successfully.`,
      });

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error scheduling change:", error);
      toast({
        title: "Error",
        description: "Failed to schedule change. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSchedulingChange(false);
    }
  };

  // Function to add a new scheduled change form
  const addScheduledChangeForm = () => {
    const lastForm = scheduledChangeForms[scheduledChangeForms.length - 1];
    const minDateTime = lastForm.scheduledDate && lastForm.scheduledTime 
      ? new Date(`${lastForm.scheduledDate}T${lastForm.scheduledTime}`).getTime() + 60000 // Add 1 minute
      : new Date().getTime() + 60000;

    const minDate = new Date(minDateTime);
    const minDateString = minDate.toISOString().split('T')[0];
    const minTimeString = minDate.toISOString().split('T')[1].substring(0, 5);

    setScheduledChangeForms([
      ...scheduledChangeForms,
      {
        collectibleId: null,
        scheduledDate: minDateString,
        scheduledTime: minTimeString,
        collectibleSearchQuery: "",
        isCollectibleDropdownOpen: false,
      }
    ]);
  };

  // Function to remove a scheduled change form
  const removeScheduledChangeForm = (index: number) => {
    if (scheduledChangeForms.length > 1) {
      setScheduledChangeForms(scheduledChangeForms.filter((_, i) => i !== index));
    }
  };

  // Function to update a specific form
  const updateScheduledChangeForm = (index: number, updates: Partial<ScheduledChangeForm>) => {
    setScheduledChangeForms(
      scheduledChangeForms.map((form, i) => 
        i === index ? { ...form, ...updates } : form
      )
    );
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
      (chip.label || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (chip.collectibleName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (chip.batch_listing_id !== null && 
       String(chip.batch_listing_id).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get scheduled changes for a specific chip (returns array)
  const getScheduledChangesForChip = (chipId: string) => {
    return scheduledChanges.filter((change) => change.chip_id === chipId && !change.executed);
  };

  // Get first scheduled change for a specific chip (for backwards compatibility)
  const getScheduledChangeForChip = (chipId: string) => {
    const changes = getScheduledChangesForChip(chipId);
    return changes.length > 0 ? changes[0] : undefined;
  };

  // Get display value for selected collectible (keeping for backwards compatibility)
  const getSelectedCollectibleDisplay = (formIndex: number = 0) => {
    if (!scheduledChangeForms[formIndex]?.collectibleId) return "";
    const selected = collectibles.find(c => c.id === scheduledChangeForms[formIndex].collectibleId);
    return selected ? `${selected.name} (ID: ${selected.id})` : "";
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
              placeholder="Search by chip ID, label, collectible name, or batch ID..."
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
                    Label
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
                      {chip.label || (
                        <span className="text-gray-400">No label</span>
                      )}
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

                      {/* Show scheduled changes if exist */}
                      {getScheduledChangesForChip(chip.chip_id).length > 0 && (
                        <div className="mt-1 space-y-1">
                          {getScheduledChangesForChip(chip.chip_id).map((change, index) => (
                            <div key={change.id} className="text-sm text-blue-600 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Change {index + 1} scheduled to{" "}
                              {collectibleNamesMap[change.collectible_id!]} (ID: {change.collectible_id})
                              {" "}on{" "}
                              {formatDate(
                                new Date(change.schedule_unix! * 1000).toISOString(),
                                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                                "yyyy-MM-dd HH:mm"
                              )}
                            </div>
                          ))}
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Manage Chip Connection</DialogTitle>
            <DialogDescription>
              {selectedChip && (
                <span className="font-medium">
                  Chip ID: {selectedChip.chip_id}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
              getScheduledChangesForChip(selectedChip.chip_id).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Scheduled Changes ({getScheduledChangesForChip(selectedChip.chip_id).length})
                  </h3>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {getScheduledChangesForChip(selectedChip.chip_id).map((change, index) => (
                      <div key={change.id} className="p-3 bg-blue-50 rounded-md flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {index + 1}. New Collectible:{" "}
                            {collectibleNamesMap[change.collectible_id!] || 
                             `ID: ${change.collectible_id}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            Scheduled for:{" "}
                            {formatDate(
                              new Date(change.schedule_unix! * 1000).toISOString(),
                              "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                              "yyyy-MM-dd HH:mm"
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteScheduledChange(change.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Schedule changes section - only shown if not in batch */}
            {!selectedChip?.batch_listing_id && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Schedule Changes</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addScheduledChangeForm}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Schedule
                  </Button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {scheduledChangeForms.map((form, index) => {
                    // Calculate minimum date/time for this entry
                    const getMinDateTime = () => {
                      if (index === 0) {
                        return new Date().toISOString().split("T")[0];
                      }
                      const prevForm = scheduledChangeForms[index - 1];
                      if (prevForm.scheduledDate && prevForm.scheduledTime) {
                        const prevDateTime = new Date(`${prevForm.scheduledDate}T${prevForm.scheduledTime}`);
                        prevDateTime.setMinutes(prevDateTime.getMinutes() + 1);
                        return prevDateTime.toISOString().split("T")[0];
                      }
                      return new Date().toISOString().split("T")[0];
                    };

                    const getMinTime = () => {
                      if (index === 0) {
                        return "";
                      }
                      const prevForm = scheduledChangeForms[index - 1];
                      if (prevForm.scheduledDate && prevForm.scheduledTime && form.scheduledDate === prevForm.scheduledDate) {
                        const prevDateTime = new Date(`${prevForm.scheduledDate}T${prevForm.scheduledTime}`);
                        prevDateTime.setMinutes(prevDateTime.getMinutes() + 1);
                        return prevDateTime.toISOString().split("T")[1].substring(0, 5);
                      }
                      return "";
                    };

                    // Filter collectibles for this form
                    const formFilteredCollectibles = collectibles.filter((collectible) =>
                      collectible.name.toLowerCase().includes(form.collectibleSearchQuery.toLowerCase()) ||
                      collectible.id.toString().includes(form.collectibleSearchQuery.toLowerCase())
                    );

                    return (
                      <div key={index} className="p-3 border rounded-md bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-medium">Schedule {index + 1}</h4>
                          {scheduledChangeForms.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScheduledChangeForm(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-500 mb-1 block">
                              Select Collectible
                            </label>
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="Search and select a collectible..."
                                value={form.isCollectibleDropdownOpen ? form.collectibleSearchQuery : 
                                  (form.collectibleId ? 
                                    `${collectibles.find(c => c.id === form.collectibleId)?.name || ''} (ID: ${form.collectibleId})` : 
                                    '')}
                                onChange={(e) => {
                                  updateScheduledChangeForm(index, {
                                    collectibleSearchQuery: e.target.value,
                                    isCollectibleDropdownOpen: true,
                                  });
                                }}
                                onFocus={() => {
                                  updateScheduledChangeForm(index, {
                                    collectibleSearchQuery: "",
                                    isCollectibleDropdownOpen: true,
                                  });
                                }}
                                onBlur={(e) => {
                                  // Delay closing to allow for selection clicks
                                  setTimeout(() => {
                                    if (!e.currentTarget.contains(document.activeElement)) {
                                      updateScheduledChangeForm(index, {
                                        isCollectibleDropdownOpen: false,
                                        collectibleSearchQuery: "",
                                      });
                                    }
                                  }, 150);
                                }}
                                className="w-full"
                              />
                              
                              {form.isCollectibleDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-auto">
                                  {loadingCollectibles ? (
                                    <div className="flex justify-center p-3">
                                      <Loader2Icon className="h-4 w-4 animate-spin" />
                                    </div>
                                  ) : formFilteredCollectibles.length === 0 ? (
                                    <div className="p-3 text-sm text-gray-500 text-center">
                                      {form.collectibleSearchQuery 
                                        ? "No collectibles found matching your search." 
                                        : "No collectibles available."}
                                    </div>
                                  ) : (
                                    formFilteredCollectibles.map((collectible) => (
                                      <div
                                        key={collectible.id}
                                        className={`p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${
                                          form.collectibleId === collectible.id ? 'bg-blue-50' : ''
                                        }`}
                                        onMouseDown={(e) => {
                                          e.preventDefault(); // Prevent input blur
                                          updateScheduledChangeForm(index, {
                                            collectibleId: collectible.id,
                                            isCollectibleDropdownOpen: false,
                                            collectibleSearchQuery: "",
                                          });
                                        }}
                                      >
                                        <div className="font-medium text-sm">
                                          {collectible.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ID: {collectible.id}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm text-gray-500 mb-1 block">
                                Date
                              </label>
                              <Input
                                type="date"
                                value={form.scheduledDate}
                                onChange={(e) => {
                                  updateScheduledChangeForm(index, {
                                    scheduledDate: e.target.value,
                                  });
                                }}
                                min={getMinDateTime()}
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 mb-1 block">
                                Time
                              </label>
                              <Input
                                type="time"
                                value={form.scheduledTime}
                                onChange={(e) => {
                                  updateScheduledChangeForm(index, {
                                    scheduledTime: e.target.value,
                                  });
                                }}
                                min={getMinTime()}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={isSchedulingChange}
            >
              Cancel
            </Button>
            {!selectedChip?.batch_listing_id && (
              <Button 
                onClick={handleScheduleChange}
                disabled={isSchedulingChange}
              >
                {isSchedulingChange ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule Changes"
                )}
              </Button>
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
