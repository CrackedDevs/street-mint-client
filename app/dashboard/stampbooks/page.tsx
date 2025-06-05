"use client";

import { useEffect, useState } from "react";
import { Copy, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { getStampbooksByArtistId, deleteStampbookById, fetchCollectibleById } from "@/lib/supabaseClient";
import { Tables } from "@/lib/types/database.types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type Stampbook = Tables<"stampbooks">;

interface Collectible {
  id: number;
  name: string;
  description: string;
  primary_image_url: string;
  price_usd: number;
  quantity_type: string;
  quantity: number | null;
  collection_id: number;
  created_at: string;
}

type StampbookWithCollectibles = Omit<Stampbook, 'collectibles'> & {
  collectibles: Collectible[];
};

export default function StampbooksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const [stampbooks, setStampbooks] = useState<StampbookWithCollectibles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stampbookToDelete, setStampbookToDelete] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (userProfile?.id) {
        try {
          const data = await getStampbooksByArtistId(userProfile.id);
          // Transform the data to include collectible details
          const stampbooksWithCollectibles = await Promise.all(data?.map(async (stampbook) => {
            const collectiblesData = await Promise.all(
              (stampbook.collectibles || []).map(async (id) => {
                const collectible = await fetchCollectibleById(id);
                return collectible;
              })
            );
            return {
              ...stampbook,
              collectibles: collectiblesData.filter(Boolean) // Remove null values
            } as StampbookWithCollectibles;
          }) || []);
          setStampbooks(stampbooksWithCollectibles);
        } catch (error) {
          toast({
            title: "Error fetching stampbooks",
            description: "Please try again later",
            variant: "destructive",
          });
        }
      }
      setTimeout(() => setIsLoading(false), 1000);
    };

    loadData();
  }, [userProfile?.id, toast]);

  const filteredStampbooks = stampbooks.filter((stampbook) =>
    stampbook.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stampbook.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stampbook.id.toString().includes(searchQuery)
  );

  const handleCreateNew = () => {
    if (!userProfile) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a stampbook",
        variant: "destructive",
      });
      return;
    }
    router.push("/dashboard/stampbooks/create");
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/stampbooks/${id}/edit`);
  };

  const handleCopyLink = (id: number) => {
    const link = `${window.location.origin}/stamps/${id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Stampbook link copied to clipboard",
    });
  };

  const handleDelete = async (id: number) => {
    try {
      const result = await deleteStampbookById(id);
      if (!result.success) throw result.error;

      setStampbooks((prev) => prev.filter((book) => book.id !== id));
      toast({
        title: "Success",
        description: "Stampbook deleted successfully",
      });
      setDeleteDialogOpen(false);
      setStampbookToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete stampbook",
        variant: "destructive",
      });
    }
  };

  const renderTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-12 w-12 rounded" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8" />
          </TableCell>
        </TableRow>
      ));
    }

    if (!userProfile) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center py-12">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Authentication Required</h3>
              <p className="text-gray-500">Please log in to view your stampbooks</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (filteredStampbooks.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center py-8">
            {searchQuery ? (
              <p className="text-gray-500">
                No stampbooks found matching &quot;{searchQuery}&quot;
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-500">No stampbooks created yet</p>
                <Button variant="outline" onClick={handleCreateNew}>
                  Create your first stampbook
                </Button>
              </div>
            )}
          </TableCell>
        </TableRow>
      );
    }

    return filteredStampbooks.map((stampbook) => (
      <TableRow key={stampbook.id}>
        <TableCell className="font-mono text-center">{stampbook.id}</TableCell>
        <TableCell className="text-center">
          {stampbook.logo_image ? (
            <div className="flex justify-center">
              <Image
                src={stampbook.logo_image}
                alt={`${stampbook.name} logo`}
                width={48}
                height={48}
                className="h-12 w-12 object-cover rounded"
              />
            </div>
          ) : (
            <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 mx-auto">
              No logo
            </div>
          )}
        </TableCell>
        <TableCell className="font-medium text-center">{stampbook.name}</TableCell>
        <TableCell className="max-w-xs truncate text-center">
          {stampbook.description}
        </TableCell>
        <TableCell className="text-center">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link" className="p-0">
                {stampbook.collectibles.length} collectibles
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 text-left">
              <ScrollArea className="h-[300px] pr-4">
                {stampbook.collectibles.length > 0 ? (
                  <div className="space-y-4">
                    {stampbook.collectibles.map((collectible, index) => (
                      <div
                        key={collectible.id}
                        className="flex items-start space-x-4 border-b border-border pb-4 last:border-0 last:pb-0"
                      >
                        {collectible.primary_image_url && (
                          <Image
                            src={collectible.primary_image_url}
                            alt={collectible.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        )}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{collectible.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {collectible.description}
                          </p>
                          {collectible.price_usd > 0 && (
                            <Badge variant="outline" className="text-xs">
                              ${collectible.price_usd}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No collectibles added yet
                  </p>
                )}
              </ScrollArea>
            </HoverCardContent>
          </HoverCard>
        </TableCell>
        <TableCell className="text-center">
          {new Date(stampbook.created_at).toLocaleString()}
        </TableCell>
        <TableCell className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCopyLink(stampbook.id)}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy Stampbook Link</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(stampbook.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onSelect={(e) => {
                  e.preventDefault();
                  setStampbookToDelete(stampbook.id);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Stampbooks</h1>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Stampbook
          </Button>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Search stampbooks by name, description, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">ID</TableHead>
                <TableHead className="text-center">Logo</TableHead>
                <TableHead className="text-center">Name</TableHead>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Collectibles</TableHead>
                <TableHead className="text-center">Created At</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableContent()}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your stampbook
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => stampbookToDelete && handleDelete(stampbookToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}