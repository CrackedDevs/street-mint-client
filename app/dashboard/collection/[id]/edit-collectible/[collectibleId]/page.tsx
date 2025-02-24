"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeftIcon,
  MapPinIcon,
  UploadIcon,
  TrashIcon,
  CalendarIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "lucide-react";
import {
  Collectible,
  fetchCollectibleById,
  QuantityType,
  updateCollectible,
  uploadFileToPinata,
  Brand,
} from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import withAuth from "@/app/dashboard/withAuth";
import { Switch } from "@/components/ui/switch";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collectible, setCollectible] = useState<Collectible | null>(null);
  const [newGalleryImages, setNewGalleryImages] = useState<File[]>([]);
  const [newCtaLogoImage, setNewCtaLogoImage] = useState<File>();
  useEffect(() => {
    // Fetch the collectible data
    const fetchCollectible = async () => {
      const fetchedCollectible = await fetchCollectibleById(
        Number(collectibleId)
      );
      if (fetchedCollectible) {
        setCollectible({
          ...fetchedCollectible,
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
          variant: "default",
        });
      }

      if (validFiles.length + newGalleryImages.length <= 5) {
        setNewGalleryImages([...newGalleryImages, ...validFiles]);
      } else {
        toast({
          title: "Error",
          description:
            "You can only upload a maximum of 5 images per collectible.",
          variant: "destructive",
        });
      }
    }
  };

  const removeGalleryImage = (index: number, isNewImage: boolean) => {
    if (isNewImage) {
      setNewGalleryImages((prev) => prev.filter((_, i) => i !== index));
    } else if (collectible) {
      setCollectible({
        ...collectible,
        gallery_urls: collectible.gallery_urls.filter((_, i) => i !== index),
      });
    }
  };

  const handleCtaLogoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      if (file.size <= MAX_FILE_SIZE) {
        setNewCtaLogoImage(file);
      } else {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddCreator = () => {
    const newCreator: CreatorRoyalty = {
      creator_wallet_address: "",
      royalty_percentage: 0,
      name: "",
    };

    setCollectible((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        creator_royalty_array: [
          ...(prev.creator_royalty_array || []),
          newCreator,
        ],
      };
    });
  };

  const handleRemoveCreator = (index: number) => {
    setCollectible((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        creator_royalty_array:
          prev.creator_royalty_array?.filter((_, i) => i !== index) || [],
      };
    });
  };

  const handleCreatorChange = (
    index: number,
    field: keyof CreatorRoyalty,
    value: string | number
  ) => {
    setCollectible((prev) => {
      if (!prev) return prev;
      const updatedCreators = [...(prev.creator_royalty_array || [])];
      updatedCreators[index] = {
        ...updatedCreators[index],
        [field]:
          field === "royalty_percentage"
            ? Math.min(100, Math.max(0, Number(value)))
            : value,
      };
      return {
        ...prev,
        creator_royalty_array: updatedCreators,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectible) return;

    if (
      collectible.mint_start_date &&
      collectible.mint_end_date &&
      new Date(collectible.mint_start_date) >=
        new Date(collectible.mint_end_date)
    ) {
      toast({
        title: "Invalid Date Range",
        description: "The start date must be before the end date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedGalleryUrls = await Promise.all(
        newGalleryImages.map(async (file) => {
          return (await uploadFileToPinata(file)) || "";
        })
      );

      const uploadedCtaLogoUrl = newCtaLogoImage
        ? await uploadFileToPinata(newCtaLogoImage)
        : collectible.cta_logo_url;

      const updatedCollectible: Collectible = {
        ...collectible,
        gallery_urls: [
          ...collectible.gallery_urls,
          ...uploadedGalleryUrls.filter(Boolean),
        ],
        cta_logo_url: uploadedCtaLogoUrl,
      };

      const { success } = await updateCollectible(updatedCollectible);

      if (success) {
        toast({
          title: "Success",
          description: "Collectible updated successfully",
        });
        router.push(`/dashboard/collection/${collectionId}`);
      } else {
        throw new Error("Failed to update collectible");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update collectible",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!collectible) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/collection/${collectionId}`)}
          className="mb-8"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Collection
        </Button>
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-4xl font-bold text-center">
              Edit Collectible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label
                  htmlFor="collectible-brand"
                  className="text-lg font-semibold"
                >
                  Brand <span className="text-destructive">*</span>
                </Label>
                <select
                  id="collectible-brand"
                  value={collectible.is_irls ? Brand.IRLS : Brand.StreetMint}
                  onChange={(e) =>
                    handleCollectibleChange(
                      "is_irls",
                      e.target.value === Brand.IRLS
                    )
                  }
                  className="w-full p-2 border rounded-md bg-background text-base"
                  required
                >
                  <option value={Brand.StreetMint}>StreetMint</option>
                  <option value={Brand.IRLS}>IRLS</option>
                </select>
              </div>

              <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                <div className="space-y-2">
                  <Label
                    htmlFor="collectible-location"
                    className="text-lg font-semibold flex items-center"
                  >
                    <MapPinIcon className="mr-2 h-5 w-5" />
                    Location (Google Maps URL)
                  </Label>
                  <Input
                    id="collectible-location"
                    value={collectible.location ?? ""}
                    onChange={(e) =>
                      handleCollectibleChange("location", e.target.value)
                    }
                    placeholder="Enter Google Maps URL"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="collectible-location-note"
                    className="text-lg font-semibold"
                  >
                    Location Note
                  </Label>
                  <Textarea
                    id="collectible-location-note"
                    value={collectible.location_note ?? ""}
                    onChange={(e) =>
                      handleCollectibleChange("location_note", e.target.value)
                    }
                    placeholder="Add any additional details about the location"
                    className="min-h-[80px] text-base"
                  />
                </div>
              </div>

              <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                <div className="space-y-2">
                  <Label
                    htmlFor="mint-start-date"
                    className="text-lg font-semibold flex items-center"
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    Minting Start Date and Time
                  </Label>
                  <span>Mention the timings in GMT</span>
                  <Input
                    id="mint-start-date"
                    type="datetime-local"
                    value={collectible.mint_start_date ?? ""}
                    onChange={(e) =>
                      handleCollectibleChange(
                        "mint_start_date",
                        new Date(e.target.value + ":00Z").toISOString()
                      )
                    }
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="mint-end-date"
                    className="text-lg font-semibold flex items-center"
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    Minting End Date and Time
                  </Label>
                  <span>Mention the timings in GMT</span>
                  <Input
                    id="mint-end-date"
                    type="datetime-local"
                    value={collectible.mint_end_date ?? ""}
                    onChange={(e) =>
                      handleCollectibleChange(
                        "mint_end_date",
                        new Date(e.target.value + ":00Z").toISOString()
                      )
                    }
                    className="text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="gallery-images"
                  className="text-lg font-semibold"
                >
                  Gallery Images (Max 5)
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Current images: {collectible.gallery_urls.length}
                </p>
                <div className="flex flex-wrap gap-4 mt-4">
                  {collectible.gallery_urls.map((url, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={url}
                        alt={`Gallery image ${index + 1}`}
                        width={100}
                        height={100}
                        className="rounded-md object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeGalleryImage(index, false)}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {newGalleryImages.map((file, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`New gallery image ${index + 1}`}
                        width={100}
                        height={100}
                        className="rounded-md object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeGalleryImage(index, true)}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  <Input
                    id="gallery-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryImageChange}
                    disabled={
                      collectible.gallery_urls.length +
                        newGalleryImages.length >=
                      5
                    }
                    className="sr-only"
                  />
                  <Label
                    htmlFor="gallery-images"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-md cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <UploadIcon className="w-6 h-6 text-muted-foreground" />
                      <span className="text-base font-medium text-muted-foreground">
                        {newGalleryImages.length > 0
                          ? `${newGalleryImages.length} new file${
                              newGalleryImages.length > 1 ? "s" : ""
                            } selected`
                          : "Add more images"}
                      </span>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-lg font-semibold">
                      Call to Action
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add a call to action to your collectible.
                    </p>
                  </div>

                  <Switch
                    id="call-to-action-toggle"
                    checked={collectible.cta_enable}
                    onCheckedChange={(checked) =>
                      handleCollectibleChange("cta_enable", checked)
                    }
                    className="scale-125"
                  />
                </div>
                {collectible.cta_enable && (
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="call-to-action-title"
                        className="text-lg font-semibold"
                      >
                        Title
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="call-to-action-title"
                        placeholder="Join our newsletter"
                        value={collectible.cta_title ?? ""}
                        required
                        onChange={(e) =>
                          handleCollectibleChange("cta_title", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="call-to-action-description"
                        className="text-lg font-semibold"
                      >
                        Description
                        <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="call-to-action-description"
                        required
                        placeholder="Join our newsletter to get exclusive updates and early access to new drops."
                        value={collectible.cta_description ?? ""}
                        onChange={(e) =>
                          handleCollectibleChange(
                            "cta_description",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="call-to-action-logo-url"
                        className="text-lg font-semibold"
                      >
                        Logo
                      </Label>
                      <Label
                        htmlFor="call-to-action-logo-url"
                        className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-md cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <UploadIcon className="w-6 h-6 text-muted-foreground" />
                          <span className="text-base font-medium text-muted-foreground">
                            {newCtaLogoImage
                              ? newCtaLogoImage.name
                              : "Update Logo"}
                          </span>
                        </div>
                      </Label>
                      <Input
                        id="call-to-action-logo-url"
                        type="file"
                        accept="image/*"
                        onChange={handleCtaLogoImageChange}
                        className="sr-only"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="call-to-action-cta-text"
                        className="text-lg font-semibold"
                      >
                        CTA Button Text
                      </Label>
                      <Input
                        id="call-to-action-cta-text"
                        placeholder="Signup"
                        value={collectible.cta_text ?? ""}
                        onChange={(e) =>
                          handleCollectibleChange("cta_text", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="call-to-action-cta-link"
                        className="text-lg font-semibold"
                      >
                        CTA Link
                      </Label>
                      <Input
                        id="call-to-action-cta-link"
                        value={collectible.cta_link ?? ""}
                        placeholder="https://streetmint.xyz"
                        onChange={(e) =>
                          handleCollectibleChange("cta_link", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <Label
                        htmlFor="call-to-action-has-email-capture"
                        className="text-lg font-semibold"
                      >
                        Has Email Capture
                      </Label>
                      <Switch
                        id="call-to-action-has-email-capture"
                        checked={collectible.cta_has_email_capture}
                        onCheckedChange={() =>
                          handleCollectibleChange(
                            "cta_has_email_capture",
                            !collectible.cta_has_email_capture
                          )
                        }
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <Label
                        htmlFor="call-to-action-has-text-capture"
                        className="text-lg font-semibold"
                      >
                        Has Text Capture
                      </Label>
                      <Switch
                        id="call-to-action-has-text-capture"
                        checked={collectible.cta_has_text_capture}
                        onCheckedChange={() =>
                          handleCollectibleChange(
                            "cta_has_text_capture",
                            !collectible.cta_has_text_capture
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-lg font-semibold">
                      Creator Royalties
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add creators and their royalty percentages
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddCreator}
                    className="flex items-center gap-2"
                  >
                    <PlusCircleIcon className="h-4 w-4" />
                    Add Creator
                  </Button>
                </div>

                {collectible.creator_royalty_array?.map((creator, index) => (
                  <div
                    key={index}
                    className="space-y-4 bg-background/50 p-4 rounded-lg relative"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => handleRemoveCreator(index)}
                    >
                      <XCircleIcon className="h-4 w-4 text-destructive" />
                    </Button>

                    <div className="space-y-2">
                      <Label htmlFor={`creator-name-${index}`}>
                        Creator Name
                      </Label>
                      <Input
                        id={`creator-name-${index}`}
                        value={creator.name}
                        onChange={(e) =>
                          handleCreatorChange(index, "name", e.target.value)
                        }
                        placeholder="Enter creator name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`creator-wallet-${index}`}>
                        Wallet Address
                      </Label>
                      <Input
                        id={`creator-wallet-${index}`}
                        value={creator.creator_wallet_address}
                        onChange={(e) =>
                          handleCreatorChange(
                            index,
                            "creator_wallet_address",
                            e.target.value.trim()
                          )
                        }
                        placeholder="Enter wallet address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`creator-royalty-${index}`}>
                        Royalty Percentage
                      </Label>
                      <Input
                        id={`creator-royalty-${index}`}
                        type="text"
                        value={creator.royalty_percentage}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*\.?\d*$/.test(value)) {
                            handleCreatorChange(
                              index,
                              "royalty_percentage",
                              Number(value)
                            );
                          }
                        }}
                        placeholder="Enter percentage (0-100)"
                      />
                    </div>
                  </div>
                ))}

                {collectible.creator_royalty_array?.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No creators added. Click &apos;Add Creator&apos; to add
                    creator royalties.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full text-lg h-14 mt-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Collectible"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(EditCollectiblePage);
