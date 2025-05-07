"use client";

import Delivery from "@/app/assets/delivery.svg";
import withAuth from "@/app/dashboard/withAuth";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/helper/date";
import { useToast } from "@/hooks/use-toast";
import {
  getChipLinksByArtistId,
  getSponsorsByArtistId,
  updateChipLink,
} from "@/lib/supabaseAdminClient";
import {
  Brand,
  Collectible,
  fetchCollectibleById,
  QuantityType,
  Sponsor,
  updateCollectible,
  uploadFileToPinata
} from "@/lib/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftIcon,
  CalendarIcon,
  Loader2,
  MapPinIcon,
  PlusCircleIcon,
  UploadIcon,
  XCircleIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [isFreeMint, setIsFreeMint] = useState(false);
  const [customEmail, setCustomEmail] = useState(false);
  const [availableChips, setAvailableChips] = useState<
    Array<{
      id: number;
      chip_id: string;
      active: boolean;
      collectible_id: number | null;
      created_at: string;
      artists_id: number | null;
    }>
  >([]);
  const [selectedChipIds, setSelectedChipIds] = useState<number[]>([]);
  const [isLoadingChips, setIsLoadingChips] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
          enable_card_payments:
            fetchedCollectible.enable_card_payments || false,
          stripe_price_id: fetchedCollectible.stripe_price_id || undefined,
          sponsor_id: fetchedCollectible.sponsor_id || null,
          only_card_payment: fetchedCollectible.only_card_payment || false,
          custom_email: fetchedCollectible.custom_email || false,
          custom_email_subject: fetchedCollectible.custom_email_subject || "",
          custom_email_body: fetchedCollectible.custom_email_body || "",
        });
        // Set isFreeMint based on price
        setIsFreeMint(fetchedCollectible.price_usd === 0);
        // Set customEmail based on custom_email field
        setCustomEmail(fetchedCollectible.custom_email || false);
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

  // Fetch available chips for the artist
  useEffect(() => {
    const fetchArtistChips = async () => {
      if (userProfile?.id) {
        setIsLoadingChips(true);
        try {
          const chips = await getChipLinksByArtistId(userProfile.id);
          if (chips) {
            // Filter out chips that are already assigned to other collectibles
            const availableChips = chips.filter((chip) => !chip.collectible_id && !chip.batch_listing_id);

            // Get all chips, including those already assigned to other collectibles
            setAvailableChips(availableChips);

            // Set selected chips that are already assigned to this collectible
            if (collectible?.id) {
              const assignedToThisCollectible = availableChips
                .filter((chip) => chip.collectible_id === collectible.id)
                .map((chip) => chip.id);

              setSelectedChipIds(assignedToThisCollectible);
            }
          }
        } catch (error) {
          console.error("Error fetching artist chips:", error);
          toast({
            title: "Error",
            description:
              "Failed to load your assigned chips. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingChips(false);
        }
      }
    };

    fetchArtistChips();
  }, [userProfile?.id, collectible?.id, toast]);

  const handleCollectibleChange = (field: keyof Collectible, value: any) => {
    if (field === "mint_start_date") {
      value = formatDate(value);
    } else if (field === "mint_end_date") {
      value = formatDate(value);
    }
    setCollectible((prev) => (prev ? { ...prev, [field]: value } : null));
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

  const handleFreeMintToggle = (checked: boolean) => {
    setIsFreeMint(checked);
    if (checked) {
      handleCollectibleChange("price_usd", 0);
      handleCollectibleChange("enable_card_payments", false);
    }
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
        gallery_urls: [
          ...collectible.gallery_urls,
          ...(newGalleryUrls.filter(Boolean) as string[]),
        ],
        cta_logo_url: ctaLogoUrl,
      };

      const result = await updateCollectible(updatedCollectible);

      if (result.success) {
        // Handle chip assignments
        if (userProfile?.id) {
          try {
            // Get current chip assignments for this collectible
            const currentAssignments = availableChips
              .filter((chip) => chip.collectible_id === collectible.id)
              .map((chip) => chip.id);

            // Find chips to add and remove
            const chipsToAdd = selectedChipIds.filter(
              (id) => !currentAssignments.includes(id)
            );
            const chipsToRemove = currentAssignments.filter(
              (id) => !selectedChipIds.includes(id)
            );

            // Update chip assignments
            await Promise.all([
              // Add new assignments
              ...chipsToAdd.map((chipId) =>
                updateChipLink(chipId, {
                  id: chipId,
                  chip_id:
                    availableChips.find((chip) => chip.id === chipId)
                      ?.chip_id || "",
                  collectible_id: collectible.id,
                  active: true,
                  created_at: new Date().toISOString(),
                  artists_id: userProfile.id,
                })
              ),
              // Remove unselected assignments
              ...chipsToRemove.map((chipId) =>
                updateChipLink(chipId, {
                  id: chipId,
                  chip_id:
                    availableChips.find((chip) => chip.id === chipId)
                      ?.chip_id || "",
                  collectible_id: null,
                  active: true,
                  created_at: new Date().toISOString(),
                  artists_id: userProfile.id,
                })
              ),
            ]);
          } catch (error) {
            console.error("Error updating chip assignments:", error);
            toast({
              title: "Warning",
              description:
                "Collectible updated but chip assignments may not be complete. Please check them manually.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Success",
          description: "Collectible updated successfully",
        });
        setShowSuccessModal(true);
      } else {
        throw new Error(
          result.error?.message || "Failed to update collectible"
        );
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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4 sm:px-6 lg:px-8">
      <AnimatePresence>
        {showSuccessModal && (
          <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
            <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                  }}
                  className="mb-6"
                >
                  <div className="relative inline-block">
                    <div className="absolute inset-0  rounded-full blur-xl"></div>
                    <Image
                      width={300}
                      height={300}
                      src={Delivery}
                      alt="Delivery"
                      className="text-primary relative z-10"
                    />
                  </div>
                </motion.div>

                <h2 className="text-3xl font-bold mb-4 text-primary">
                  Collectible Edited ⭐!
                </h2>

                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push(`/dashboard/collection/${collectionId}`);
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  Back to Collection
                </Button>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/collection/${collectionId}`)}
          className="mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Collection
        </Button>

        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-4xl font-bold text-center">
              Edit Collectible
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Fill in the details below to edit this collectible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="collectible-name"
                    className="text-lg font-semibold"
                  >
                    Collectible Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="collectible-name"
                    value={collectible.name}
                    onChange={(e) =>
                      handleCollectibleChange("name", e.target.value)
                    }
                    className="text-lg"
                    required
                    maxLength={32}
                  />
                  <p className="text-sm text-muted-foreground">
                    {collectible.name.length}/32 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="collectible-description"
                    className="text-lg font-semibold"
                  >
                    Collectible Description{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="collectible-description"
                    value={collectible.description}
                    onChange={(e) =>
                      handleCollectibleChange("description", e.target.value)
                    }
                    className="min-h-[120px] text-base"
                    required
                  />
                </div>


                <div className="space-y-2">
                  <Label
                    htmlFor="chip-selection"
                    className="text-lg font-semibold"
                  >
                    Assign NFC Chips
                  </Label>
                  {isLoadingChips ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading your assigned chips...</span>
                    </div>
                  ) : availableChips.length > 0 ? (
                    <div className="space-y-2">
                      <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                        {availableChips.map((chip) => (
                          <div
                            key={chip.id}
                            className="flex items-center space-x-2 p-2 hover:bg-primary/5 rounded-md"
                          >
                            <input
                              type="checkbox"
                              id={`chip-${chip.id}`}
                              checked={selectedChipIds.includes(chip.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedChipIds([
                                    ...selectedChipIds,
                                    chip.id,
                                  ]);
                                } else {
                                  setSelectedChipIds(
                                    selectedChipIds.filter(
                                      (id) => id !== chip.id
                                    )
                                  );
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <label
                              htmlFor={`chip-${chip.id}`}
                              className="flex-grow cursor-pointer"
                            >
                              {chip.chip_id}
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select one or more chips to link to this collectible.
                      </p>
                      {selectedChipIds.length > 0 && (
                        <p className="text-sm text-primary">
                          {selectedChipIds.length} chip
                          {selectedChipIds.length > 1 ? "s" : ""} selected
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-md bg-amber-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-amber-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-amber-800">
                            No chips available
                          </h3>
                          <div className="mt-2 text-sm text-amber-700">
                            <p>
                              You don&apos;t have any available chips to assign
                              to this collectible. Please contact an admin to
                              have NFC chips assigned to your account.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="collectible-brand">Brand</Label>
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

                <div>
                  <Label htmlFor="quantity_type">Quantity Type</Label>
                  <select
                    id="quantity_type"
                    value={collectible.quantity_type}
                    onChange={(e) =>
                      handleCollectibleChange(
                        "quantity_type",
                        e.target.value as QuantityType
                      )
                    }
                    className="w-full p-2 border rounded-md bg-background text-base"
                    required
                  >
                    <option value={QuantityType.Unlimited}>Open Edition</option>
                    <option value={QuantityType.Single}>1 of 1</option>
                    <option value={QuantityType.Limited}>Limited Edition</option>
                  </select>
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
                      required={
                        collectible.quantity_type === QuantityType.Limited
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="free-mint-toggle"
                    className="text-lg font-semibold"
                  >
                    Make Free Claim
                  </Label>
                  <Switch
                    id="free-mint-toggle"
                    checked={isFreeMint}
                    onCheckedChange={handleFreeMintToggle}
                    className="scale-125"
                  />
                </div>
                {!isFreeMint && (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="collectible-price"
                        className="text-lg font-semibold"
                      >
                        Price (USD){" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="collectible-price"
                        type="number"
                        value={collectible.price_usd}
                        onChange={(e) =>
                          handleCollectibleChange(
                            "price_usd",
                            parseFloat(e.target.value)
                          )
                        }
                        placeholder="Enter price in USD"
                        required
                        className="text-base"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <Label
                          htmlFor="card-payments-toggle"
                          className="text-lg font-semibold"
                        >
                          Enable Card Payments
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Allow users to pay with credit/debit cards
                        </p>
                      </div>
                      <Switch
                        id="card-payments-toggle"
                        checked={collectible.enable_card_payments}
                        onCheckedChange={(checked) =>
                          handleCollectibleChange(
                            "enable_card_payments",
                            checked
                          )
                        }
                        className="scale-125"
                      />
                    </div>

                    {collectible.enable_card_payments && (
                      <div className="flex items-center justify-between pt-4 pl-6 mt-2">
                        <div>
                          <Label
                            htmlFor="only-card-payments-toggle"
                            className="text-lg font-semibold"
                          >
                            Only Card Payments
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Disable crypto payment option for users
                          </p>
                        </div>
                        <Switch
                          id="only-card-payments-toggle"
                          checked={collectible.only_card_payment || false}
                          onCheckedChange={(checked) =>
                            handleCollectibleChange(
                              "only_card_payment",
                              checked
                            )
                          }
                          className="scale-125"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="free-mint-toggle"
                    className="text-lg font-semibold"
                  >
                    Custom Email After Mint
                  </Label>
                  <Switch
                    id="custom-email-toggle"
                    checked={customEmail}
                    onCheckedChange={(checked) => {
                      setCustomEmail(checked);
                      handleCollectibleChange("custom_email", checked);
                    }}
                    className="scale-125"
                  />
                </div>
                {customEmail && (
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="custom-email-subject"
                        className="text-lg font-semibold"
                      >
                        Custom Email Subject
                      </Label>
                      <Input
                        id="custom-email-subject"
                        value={collectible.custom_email_subject ?? ""}
                        onChange={(e) =>
                          handleCollectibleChange(
                            "custom_email_subject",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="custom-email-content"
                        className="text-lg font-semibold"
                      >
                        Custom Email Content
                      </Label>
                      <Textarea
                        id="custom-email-content"
                        value={collectible.custom_email_body ?? ""}
                        className="min-h-[120px] text-base"
                        onChange={(e) =>
                          handleCollectibleChange(
                            "custom_email_body",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Location Section */}
              <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                <div className="space-y-2">
                  <Label
                    htmlFor="collectible-location"
                    className="text-lg font-semibold flex items-center"
                  >
                    <MapPinIcon className="mr-2 h-5 w-5" />
                    Location (Google Maps URL) *
                  </Label>
                  <Input
                    id="collectible-location"
                    value={collectible.location ?? ""}
                    onChange={(e) =>
                      handleCollectibleChange("location", e.target.value)
                    }
                    placeholder="Enter Google Maps URL"
                    className="text-base"
                    required
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
                <span className="mt-2 ">You can edit this later</span>
              </div>

              {/* Add Date and Time Section */}
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
                    value={collectible.mint_start_date?.slice(0, 16) ?? ""}
                    onChange={(e) => {
                      handleCollectibleChange("mint_start_date", e.target.value);
                    }}
                    className="text-base w-fit"
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
                    value={collectible.mint_end_date?.slice(0, 16) ?? ""}
                    onChange={(e) =>
                      handleCollectibleChange("mint_end_date", e.target.value)
                    }
                    className="text-base w-fit"
                  />
                </div>
                <span className="mt-2">You can edit this later</span>
              </div>

              <div className="mb-6">
                <Label
                  htmlFor="gallery-name"
                  className="text-lg font-semibold"
                >
                  Gallery Name
                </Label>
                <Input
                  id="gallery-name"
                  value={collectible.gallery_name ?? ""}
                  onChange={(e) =>
                    handleCollectibleChange("gallery_name", e.target.value)
                  }
                  className="text-lg"
                  required
                  maxLength={32}
                />
              </div>

              {/* Call to Action Section */}
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
                        value={collectible.cta_title ?? ""}
                        placeholder="Join our newsletter"
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
                              : "Add Logo"}
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

              {/* Creator Royalties Section */}
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

              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sponsor</CardTitle>
                    <CardDescription>
                      Select a sponsor to associate with this collectible
                      (optional)
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
                            <Link
                              href="/dashboard/sponsors"
                              className="text-blue-500 hover:underline"
                            >
                              Sponsors section
                            </Link>
                            .
                          </div>
                        ) : (
                          <Select
                            value={
                              collectible.sponsor_id?.toString() || "none"
                            }
                            onValueChange={(value) => {
                              console.log("Selected sponsor value:", value);
                              handleCollectibleChange(
                                "sponsor_id",
                                value === "none" ? null : parseInt(value)
                              );
                            }}
                          >
                            <SelectTrigger className="w-full mt-1">
                              <SelectValue placeholder="Select a sponsor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {sponsors.map((sponsor) => (
                                <SelectItem
                                  key={sponsor.id}
                                  value={sponsor.id.toString()}
                                >
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
              </div>

              <Button
                type="submit"
                className="w-full text-lg h-14 mt-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-6 justify-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Editing Collectible...
                  </div>
                ) : (
                  "Edit Collectible"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(EditCollectiblePage);
