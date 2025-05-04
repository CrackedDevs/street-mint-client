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
import { getChipLinksByArtistId } from '@/lib/supabaseAdminClient';
import { BatchListing, deleteBatchListingById, getBatchListingByArtistId } from '@/lib/supabaseClient';
import { useWallet } from '@solana/wallet-adapter-react';
import { Copy, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

type BatchListingWithMetadata = BatchListing & {
  chip_id: string | null;
};

export default function BatchListingPage() {
  const [batchListings, setBatchListings] = useState<BatchListingWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedToDelete, setSelectedToDelete] = useState<BatchListing | null>(null);
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
        const chipLinks = await getChipLinksByArtistId(userProfile.id);

        if (!batchListings || !chipLinks) throw new Error("Failed to fetch batch listing data");


        const updatedBatchListing = batchListings.map((batchListing) => {
          const matchingChipLink = chipLinks.find((chipLink) => chipLink.id === batchListing.chip_link_id);
          return {
            ...batchListing,
            chip_id: matchingChipLink ? matchingChipLink.chip_id : null,
          };
        });

        setBatchListings(updatedBatchListing);
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

  const handleCopyStampBookLink = (item: BatchListingWithMetadata) => {
    try {
      const baseUrl = item.is_irls ? "https://irls.xyz/batch/" : "https://streetmint.xyz/batch/";
      const linkToCopy = `${baseUrl}${item.id}`;
      
      navigator.clipboard.writeText(linkToCopy);
      
      toast({
        title: "Link Copied",
        description: "Stamp book link has been copied to clipboard.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          <div className="w-full space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
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
                    <TableHead className="hidden sm:table-cell">Chip Id</TableHead>
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
                      <TableCell className="hidden sm:table-cell">{item.chip_id}</TableCell>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/collection/${item.collection_id}/edit-batch-listing/${item.id}`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyStampBookLink(item)}>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Copy Stamp Book Link</span>
                            </DropdownMenuItem>
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => {
                                  e.preventDefault();
                                  setSelectedToDelete(item);
                                }}
                                className="text-red-500 hover:text-red-600 focus:text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
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
                          </DropdownMenuContent>
                        </DropdownMenu>
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