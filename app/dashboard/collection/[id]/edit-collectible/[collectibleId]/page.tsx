"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ArrowLeftIcon,
  MapPinIcon,
  UploadIcon,
  TrashIcon,
  CalendarIcon,
  PlusCircleIcon,
  XCircleIcon,
  Loader2,
} from "lucide-react";
import {
  Collectible,
  fetchCollectibleById,
  QuantityType,
  updateCollectible,
  uploadFileToPinata,
  Brand,
  Sponsor,
} from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import withAuth from "@/app/dashboard/withAuth";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/helper/date";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import { getSponsorsByArtistId } from "@/lib/supabaseAdminClient";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface CreatorRoyalty {
  creator_wallet_address: string;
  royalty_percentage: number;
  name: string;
}

function EditCollectiblePage() {
  const router = useRouter();
  const { id: collectionId, collectibleId } = useParams();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collectible, setCollectible] = useState<Collectible | null>(null);
  const [newGalleryImages, setNewGalleryImages] = useState<File[]>([]);
  const [newCtaLogoImage, setNewCtaLogoImage] = useState<File>();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState(false);

  useEffect(() => {
    // Fetch the collectible data
    const fetchCollectible = async () => {
      const fetchedCollectible = await fetchCollectibleById(
        Number(collectibleId)
      );
      if (fetchedCollectible) {
        setCollectible({
          ...fetchedCollectible,
          is_light_version: fetchedCollectible.is_light_version || false,
          quantity_type: fetchedCollectible.quantity_type as QuantityType,
          whitelist: fetchedCollectible.whitelist || false,
          cta_enable: fetchedCollectible.cta_enable || false,
          creator_royalty_array: (fetchedCollectible.creator_royalty_array ||
            []) as unknown as CreatorRoyalty[],
          cta_has_email_capture:
            fetchedCollectible.cta_has_email_capture || false,
          cta_email_list: (fetchedCollectible.cta_email_list || []) as {
            [key: string]: string;
          }[],
          cta_has_text_capture:
            fetchedCollectible.cta_has_text_capture || false,
          cta_text_list: (fetchedCollectible.cta_text_list || []) as {
            [key: string]: string;
          }[],
          enable_card_payments: fetchedCollectible.enable_card_payments || false,
          stripe_price_id: fetchedCollectible.stripe_price_id || undefined,
          sponsor_id: fetchedCollectible.sponsor_id || null,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch collectible data",
          variant: "destructive",
        });
      }
    };

    fetchCollectible();
  }, [collectibleId, collectionId]);

  // Fetch sponsors for the artist
  useEffect(() => {
    const fetchSponsors = async () => {
      if (userProfile?.id) {
        setIsLoadingSponsors(true);
        try {
          const fetchedSponsors = await getSponsorsByArtistId(userProfile.id);
          setSponsors(fetchedSponsors);
        } catch (error) {
          console.error("Error fetching sponsors:", error);
          toast({
            title: "Error",
            description: "Failed to load sponsors. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingSponsors(false);
        }
      }
    };

    fetchSponsors();
  }, [userProfile?.id, toast]);

  const handleCollectibleChange = (field: keyof Collectible, value: any) => {
    setCollectible((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && newGalleryImages.length < 5) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(
        (file) => file.size <= MAX_FILE_SIZE
      );
      const invalidFiles = filesArray.length - validFiles.length;

      if (invalidFiles > 0) {
        toast({
          title: "Warning",
          description: `${invalidFiles} file(s) exceeded the 10MB size limit and were not added.`,
          variant: "destructive",
        });
      }

      setNewGalleryImages((prev) => [...prev, ...validFiles]);
    }
  };

  const removeGalleryImage = (index: number, isNewImage: boolean) => {
    if (isNewImage) {
      setNewGalleryImages((prev) => {
        const newImages = [...prev];
        newImages.splice(index, 1);
        return newImages;
      });
    } else {
      setCollectible((prev) => {
        if (!prev) return null;
        const newGalleryUrls = [...prev.gallery_urls];
        newGalleryUrls.splice(index, 1);
        return { ...prev, gallery_urls: newGalleryUrls };
      });
    }
  };

  const handleCtaLogoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: "Image size should not exceed 10MB",
          variant: "destructive",
        });
        return;
      }
      setNewCtaLogoImage(file);
    }
  };

  const handleAddCreator = () => {
    setCollectible((prev) => {
      if (!prev) return null;
      const newCreatorRoyaltyArray = [
        ...(prev.creator_royalty_array || []),
        {
          creator_wallet_address: "",
          royalty_percentage: 0,
          name: "",
        },
      ];
      return { ...prev, creator_royalty_array: newCreatorRoyaltyArray };
    });
  };

  const handleRemoveCreator = (index: number) => {
    setCollectible((prev) => {
      if (!prev || !prev.creator_royalty_array) return prev;
      const newCreatorRoyaltyArray = [...prev.creator_royalty_array];
      newCreatorRoyaltyArray.splice(index, 1);
      return { ...prev, creator_royalty_array: newCreatorRoyaltyArray };
    });
  };

  const handleCreatorChange = (
    index: number,
    field: keyof CreatorRoyalty,
    value: string | number
  ) => {
    setCollectible((prev) => {
      if (!prev || !prev.creator_royalty_array) return prev;
      const newCreatorRoyaltyArray = [...prev.creator_royalty_array];
      newCreatorRoyaltyArray[index] = {
        ...newCreatorRoyaltyArray[index],
        [field]: value,
      };
      return { ...prev, creator_royalty_array: newCreatorRoyaltyArray };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectible) return;

    setIsSubmitting(true);

    try {
      // Upload new gallery images if any
      const newGalleryUrls = await Promise.all(
        newGalleryImages.map(async (file) => {
          const url = await uploadFileToPinata(file);
          return url;
        })
      );

      // Upload new CTA logo image if any
      let ctaLogoUrl = collectible.cta_logo_url;
      if (newCtaLogoImage) {
        ctaLogoUrl = await uploadFileToPinata(newCtaLogoImage);
      }

      // Update collectible with new data
      const updatedCollectible: Collectible = {
        ...collectible,
        gallery_urls: [...collectible.gallery_urls, ...newGalleryUrls.filter(Boolean) as string[]],
        cta_logo_url: ctaLogoUrl,
      };

      const result = await updateCollectible(updatedCollectible);

      if (result.success) {
        toast({
          title: "Success",
          description: "Collectible updated successfully",
        });
        router.push(`/dashboard/collection/${collectionId}`);
      } else {
        throw new Error(result.error?.message || "Failed to update collectible");
      }
    } catch (error) {
      console.error("Error updating collectible:", error);
      toast({
        title: "Error",
        description: "Failed to update collectible. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!collectible) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="outline"
        onClick={() => router.push(`/dashboard/collection/${collectionId}`)}
        className="mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to Collection
      </Button>

      <h1 className="text-3xl font-bold mb-6">Edit Collectible</h1>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={collectible.name}
                  onChange={(e) =>
                    handleCollectibleChange("name", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={collectible.description}
                  onChange={(e) =>
                    handleCollectibleChange("description", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={collectible.price_usd}
                  onChange={(e) =>
                    handleCollectibleChange(
                      "price_usd",
                      parseFloat(e.target.value)
                    )
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity_type">Quantity Type</Label>
                <Select
                  value={collectible.quantity_type}
                  onValueChange={(value) =>
                    handleCollectibleChange("quantity_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quantity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={QuantityType.Unlimited}>
                      Unlimited
                    </SelectItem>
                    <SelectItem value={QuantityType.Limited}>Limited</SelectItem>
                    <SelectItem value={QuantityType.Single}>Single</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {collectible.quantity_type === QuantityType.Limited && (
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={collectible.quantity || ""}
                    onChange={(e) =>
                      handleCollectibleChange(
                        "quantity",
                        parseInt(e.target.value)
                      )
                    }
                    required={collectible.quantity_type === QuantityType.Limited}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sponsor Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sponsor</CardTitle>
            <CardDescription>
              Select a sponsor to associate with this collectible (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sponsor">Sponsor</Label>
                {isLoadingSponsors ? (
                  <div className="flex items-center mt-2">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Loading sponsors...</span>
                  </div>
                ) : sponsors.length === 0 ? (
                  <div className="text-sm text-gray-500 mt-2">
                    No sponsors available. Create sponsors in the{" "}
                    <Link href="/dashboard/sponsors" className="text-blue-500 hover:underline">
                      Sponsors section
                    </Link>
                    .
                  </div>
                ) : (
                  <Select
                    value={collectible.sponsor_id?.toString() || "none"}
                    onValueChange={(value) => {
                      console.log("Selected sponsor value:", value);
                      handleCollectibleChange(
                        "sponsor_id",
                        value === "none" ? null : parseInt(value)
                      )
                    }}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select a sponsor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {sponsors.map((sponsor) => (
                        <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                          {sponsor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rest of the form remains unchanged */}
        
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Collectible"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default withAuth(EditCollectiblePage);
