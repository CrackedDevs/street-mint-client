"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Loader2, PlusCircle, Edit, ImageIcon } from "lucide-react";
import { Sponsor, uploadFileToPinata } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import withAuth from "@/app/dashboard/withAuth";
import {
  createSponsor,
  deleteSponsor,
  getSponsorsByArtistId,
  updateSponsor,
} from "@/lib/supabaseAdminClient";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function SponsorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [currentSponsor, setCurrentSponsor] = useState<Sponsor | null>(null);
  const [newSponsorName, setNewSponsorName] = useState("");
  const [sponsorImage, setSponsorImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.id) {
      fetchSponsors();
    }
  }, [userProfile]);

  const fetchSponsors = async () => {
    setIsLoading(true);
    try {
      if (userProfile?.id) {
        const fetchedSponsors = await getSponsorsByArtistId(userProfile.id);
        setSponsors(fetchedSponsors);
      }
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      toast({
        title: "Error",
        description: "Failed to load sponsors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: "Image size should not exceed 5MB",
          variant: "destructive",
        });
        return;
      }

      setSponsorImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setNewSponsorName("");
    setSponsorImage(null);
    setImagePreview(null);
    setCurrentSponsor(null);
  };

  const handleAddSponsor = async () => {
    if (!userProfile?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to add a sponsor",
        variant: "destructive",
      });
      return;
    }

    if (!newSponsorName.trim()) {
      toast({
        title: "Error",
        description: "Sponsor name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let imgUrl = null;

      if (sponsorImage) {
        const uploadResult = await uploadFileToPinata(sponsorImage);
        if (uploadResult) {
          imgUrl = uploadResult;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const newSponsor = await createSponsor({
        name: newSponsorName,
        img_url: imgUrl,
        artist_id: userProfile.id,
      });

      if (newSponsor) {
        toast({
          title: "Success",
          description: "Sponsor created successfully",
        });

        setShowAddDialog(false);
        resetForm();
        fetchSponsors();
      } else {
        throw new Error("Failed to create sponsor");
      }
    } catch (error) {
      console.error("Error creating sponsor:", error);
      toast({
        title: "Error",
        description: "Failed to create sponsor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSponsor = async () => {
    if (!currentSponsor) return;

    setIsSubmitting(true);
    try {
      let imgUrl = currentSponsor.img_url;

      if (sponsorImage) {
        const uploadResult = await uploadFileToPinata(sponsorImage);
        if (uploadResult) {
          imgUrl = uploadResult;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const result = await updateSponsor({
        ...currentSponsor,
        name: newSponsorName || currentSponsor.name,
        img_url: imgUrl,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Sponsor updated successfully",
        });

        setShowEditDialog(false);
        resetForm();
        fetchSponsors();
      } else {
        throw new Error("Failed to update sponsor");
      }
    } catch (error) {
      console.error("Error updating sponsor:", error);
      toast({
        title: "Error",
        description: "Failed to update sponsor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSponsor = async () => {
    if (!currentSponsor) return;

    setIsSubmitting(true);
    try {
      const result = await deleteSponsor(currentSponsor.id);

      if (result.success) {
        toast({
          title: "Success",
          description: "Sponsor deleted successfully",
        });

        setShowDeleteDialog(false);
        setCurrentSponsor(null);
        fetchSponsors();
      } else {
        throw new Error("Failed to delete sponsor");
      }
    } catch (error) {
      console.error("Error deleting sponsor:", error);
      toast({
        title: "Error",
        description: "Failed to delete sponsor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (sponsor: Sponsor) => {
    setCurrentSponsor(sponsor);
    setNewSponsorName(sponsor.name || "");
    setImagePreview(sponsor.img_url || null);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (sponsor: Sponsor) => {
    setCurrentSponsor(sponsor);
    setShowDeleteDialog(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sponsors</h1>
        <Button onClick={() => setShowAddDialog(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Sponsor
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-48">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-32" />
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-0">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : sponsors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No sponsors yet</h3>
          <p className="mt-2 text-gray-500">
            Add your first sponsor to display on your collectibles.
          </p>
          <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Sponsor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map((sponsor) => (
            <Card key={sponsor.id} className="overflow-hidden">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {sponsor.img_url ? (
                  <Image
                    src={sponsor.img_url}
                    alt={sponsor.name || "Sponsor"}
                    width={200}
                    height={200}
                    className="object-contain h-full w-full"
                  />
                ) : (
                  <ImageIcon className="h-16 w-16 text-gray-400" />
                )}
              </div>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold">{sponsor.name}</h3>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(sponsor)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteDialog(sponsor)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Sponsor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sponsor</DialogTitle>
            <DialogDescription>
              Create a new sponsor to display on your collectibles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Sponsor Name</Label>
              <Input
                id="name"
                value={newSponsorName}
                onChange={(e) => setNewSponsorName(e.target.value)}
                placeholder="Enter sponsor name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Sponsor Logo</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
              </div>
              {imagePreview && (
                <div className="mt-4 h-40 bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="object-contain h-full w-full"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSponsor} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Sponsor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sponsor Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sponsor</DialogTitle>
            <DialogDescription>Update the sponsor details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Sponsor Name</Label>
              <Input
                id="edit-name"
                value={newSponsorName}
                onChange={(e) => setNewSponsorName(e.target.value)}
                placeholder="Enter sponsor name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">Sponsor Logo</Label>
              <div className="flex items-center space-x-4">
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
              </div>
              {imagePreview && (
                <div className="mt-4 h-40 bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="object-contain h-full w-full"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSponsor} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Sponsor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sponsor Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sponsor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sponsor? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setCurrentSponsor(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSponsor}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Sponsor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(SponsorsPage);
