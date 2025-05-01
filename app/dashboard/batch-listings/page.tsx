"use client";

import { useUserProfile } from '@/app/providers/UserProfileProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { BatchListing, deleteBatchListingById, getBatchListingByArtistId } from '@/lib/supabaseClient';
import { useWallet } from '@solana/wallet-adapter-react';
import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BatchListingPage() {
  const [batchListings, setBatchListings] = useState<BatchListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedToDelete, setSelectedToDelete] = useState<BatchListing | null>(null);  // New state for selected item to delete
  const { publicKey, connected } = useWallet();
  const { userProfile } = useUserProfile();
  const router = useRouter();

  async function fetchCollections() {
    if (!connected || !publicKey) {
      setError("Please connect your wallet to view collections.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (userProfile && publicKey) {
        const batchListings = await getBatchListingByArtistId(userProfile.id);
        if (!batchListings) throw new Error("Failed to fetch batch listing data");
        setBatchListings(batchListings);
      }
    } catch (error) {
      console.error("Error in fetchCollections:", error);
      setError("An unexpected error occurred. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to fetch batch listing data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBatchListing(id: number) {
    if (!userProfile) {
      toast({
        title: "Error",
        description: "You must be logged in to delete a batch listing.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { success } = await deleteBatchListingById(id);

      if (!success) {
        toast({
          title: "Error",
          description: "Failed to delete batch listing. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Batch listing deleted successfully.",
        variant: "default",
      });

      setBatchListings((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error in handleDeleteBatchListing:", error);
      setError("An unexpected error occurred. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to delete batch listing. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCollections();
  }, [connected, publicKey, userProfile]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">My Batch Listings</h1>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          batchListings.length === 0 ? (
            <Card className="w-full">
              <CardContent className="p-6">
                <p className="text-center text-gray-500">
                  You have no batch listings yet. Create a new batch listing to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table className="w-full lg:min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Batch Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden sm:table-cell">Collectible Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Start Date</TableHead>
                    <TableHead className="hidden sm:table-cell">End Date</TableHead>
                    <TableHead className="hidden md:table-cell">Hour</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchListings.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">{item.description}</TableCell>
                      <TableCell className="hidden sm:table-cell">{item.collectible_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {item.batch_start_date ? new Date(item.batch_start_date).toLocaleDateString("en-GB") : "N/A"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {item.batch_end_date ? new Date(item.batch_end_date).toLocaleDateString("en-GB") : "N/A"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(item.batch_hour !== null && item.batch_hour < 10 ? "0" : "") + item.batch_hour + ":00"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-1 sm:space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => router.push(`/dashboard/collection/${item.collection_id}/edit-batch-listing/${item.id}`)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => setSelectedToDelete(item)} // Set the selected batch to delete
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Are you sure?</DialogTitle>
                              </DialogHeader>
                              <p>Do you really want to delete batch &quot;{selectedToDelete?.name}&quot;? This action cannot be undone.</p>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    if (selectedToDelete) {
                                      handleDeleteBatchListing(selectedToDelete.id);
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
