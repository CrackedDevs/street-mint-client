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
import { createProduct } from "@/helpers/stripe";
import { useToast } from "@/hooks/use-toast";
import {
  getChipLinksByArtistId,
  getSponsorsByArtistId,
  updateChipLink,
} from "@/lib/supabaseAdminClient";
import {
  BatchListing,
  Brand,
  createBatchListing,
  QuantityType,
  Sponsor,
  uploadFileToPinata
} from "@/lib/supabaseClient";
import { NumericUUID } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftIcon,
  CalendarIcon,
  Loader2,
  MapPinIcon,
  PlusCircleIcon,
  TrashIcon,
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

function CreateBatchListingPage() {
  const router = useRouter();
  const { id: collectionId } = useParams();

  const { toast } = useToast();
  const { publicKey } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userProfile } = useUserProfile();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newCtaLogoImage, setNewCtaLogoImage] = useState<File | null>(null);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [availableChips, setAvailableChips] = useState<
    Array<{ id: number; chip_id: string; active: boolean }>
  >([]);
  const [selectedChipIds, setSelectedChipIds] = useState<number[]>([]);
  const [isLoadingChips, setIsLoadingChips] = useState(false);

  useEffect(() => {
    const fetchArtistChips = async () => {
      if (userProfile?.id) {
        setIsLoadingChips(true);
        try {
          const chips = await getChipLinksByArtistId(userProfile.id);
          if (chips) {
            // Filter out chips that are already assigned to collectibles
            const availableChips = chips.filter((chip) => !chip.collectible_id);
            setAvailableChips(availableChips);
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
  }, [userProfile?.id, toast]);

  const [batchListing, setBatchListing] = useState<BatchListing>({
    id: NumericUUID(),
    name: "",
    description: "",
    collectible_name: "",
    collectible_description: "",
    primary_image_url: "",
    quantity_type: QuantityType.Unlimited,
    quantity: 0,
    price_usd: 0,
    gallery_name: "",
    gallery_urls: [],
    location: "",
    location_note: "",
    metadata_uri: "",
    nfc_public_key: "",
    airdrop_eligibility_index: null,
    whitelist: false,
    cta_enable: false,
    cta_title: "",
    cta_description: "",
    cta_logo_url: "",
    cta_text: "",
    cta_link: "",
    cta_has_email_capture: false,
    cta_email_list: [],
    cta_has_text_capture: false,
    cta_text_list: [],
    enable_card_payments: false,
    only_card_payment: false,
    stripe_price_id: "",
    creator_royalty_array: [],
    is_irls: false,
    primary_media_type: "image",
    is_light_version: false,
    sponsor_id: null,
    custom_email: false,
    custom_email_subject: "",
    custom_email_body: "",
    batch_start_date: "",
    batch_end_date: "",
    batch_hour: 0,
    collection_id: Number(collectionId),
    chip_link_id: 0,
    logo_image: null,
    bg_color: null,
  });
  const [primaryImageLocalFile, setPrimaryImageLocalFile] =
    useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [isFreeMint, setIsFreeMint] = useState(false);
  const [customEmail, setCustomEmail] = useState(false);

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState(false);

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

  const handleBatchListingChange = (field: keyof BatchListing, value: any) => {
    if (field === "name" && value.length > 32 || field === "collectible_name" && value.length > 32) {
      toast({
        title: "Error",
        description: "Batch listing and collectible name must not exceed 32 characters.",
        variant: "destructive",
      });
      return;
    }

    if (field === "enable_card_payments" && value === true) {
      if (batchListing.price_usd < 1) {
        toast({
          title: "Error",
          description: "Card payments require a minimum price of $1.",
          variant: "destructive",
        });
        return;
      }
    }

    if (
      field === "price_usd" &&
      batchListing.enable_card_payments &&
      value < 1
    ) {
      toast({
        title: "Warning",
        description: "Card payments will be disabled as price is less than $1.",
        variant: "default",
      });
      setBatchListing((prev) => ({
        ...prev,
        enable_card_payments: false,
        [field]: value,
      }));
      return;
    }

    setBatchListing((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: "File size exceeds 10MB limit.",
          variant: "destructive",
        });
        return;
      }
      if (file.type.includes("video")) {
        handleBatchListingChange("primary_media_type", "video");
      } else if (file.type.includes("audio")) {
        handleBatchListingChange("primary_media_type", "audio");
      } else {
        handleBatchListingChange("primary_media_type", "image");
      }
      setPrimaryImageLocalFile(file);
      handleBatchListingChange("primary_image_url", URL.createObjectURL(file));
    }
  };

  const handleLogoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: "File size exceeds 10MB limit.",
          variant: "destructive",
        });
        return;
      }
      setLogoImage(file);
    }
  };

  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && galleryImages.length < 5) {
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

      if (validFiles.length + galleryImages.length <= 5) {
        setGalleryImages([...galleryImages, ...validFiles]);
      } else {
        toast({
          title: "Error",
          description:
            "You can only upload a maximum of 5 images per batch listing.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFreeMintToggle = (checked: boolean) => {
    setIsFreeMint(checked);
    if (checked) {
      handleBatchListingChange("price_usd", 0);
      handleBatchListingChange("enable_card_payments", false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
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

    setBatchListing((prev) => ({
      ...prev,
      creator_royalty_array: [
        ...(prev.creator_royalty_array || []),
        newCreator,
      ],
    }));
  };

  const handleRemoveCreator = (index: number) => {
    setBatchListing((prev) => ({
      ...prev,
      creator_royalty_array:
        prev.creator_royalty_array?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleCreatorChange = (
    index: number,
    field: keyof CreatorRoyalty,
    value: string | number
  ) => {
    setBatchListing((prev) => {
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
    if (!publicKey) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive",
      });
      return;
    }
    if (
      batchListing.quantity_type === QuantityType.Limited &&
      !batchListing.quantity
    ) {
      toast({
        title: "Enter quantity",
        description: "Enter quantity for limited quantity type",
        variant: "destructive",
      });
      return;
    }
    if (batchListing.name.length > 32) {
      toast({
        title: "Error",
        description: "batchListing name must not exceed 32 characters.",
        variant: "destructive",
      });
      return;
    }
    if (batchListing.enable_card_payments && batchListing.price_usd < 1) {
      toast({
        title: "Error",
        description: "Card payments require a minimum price of $1.",
        variant: "destructive",
      });
      return;
    }
    if (selectedChipIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select an NFC chip to assign to this collectible.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      let primaryImageUrl = "";
      if (primaryImageLocalFile) {
        primaryImageUrl =
          (await uploadFileToPinata(primaryImageLocalFile)) || "";
      }

      const uploadedGalleryUrls = await Promise.all(
        galleryImages.map(async (file) => {
          return (await uploadFileToPinata(file)) || "";
        })
      );

      const uploadedCtaLogoUrl = newCtaLogoImage
        ? await uploadFileToPinata(newCtaLogoImage)
        : null;

      const uploadedLogoUrl = logoImage
        ? await uploadFileToPinata(logoImage)
        : null;

      let stripePriceId: string | null = null;
      if (batchListing.enable_card_payments) {
        stripePriceId = await createProduct(
          batchListing.name,
          batchListing.price_usd
        );
      }

      const newBatchListing: BatchListing = {
        ...batchListing,
        primary_image_url: primaryImageUrl,
        gallery_urls: uploadedGalleryUrls.filter(Boolean),
        id: NumericUUID(),
        price_usd: isFreeMint ? 0 : batchListing.price_usd,
        cta_logo_url: uploadedCtaLogoUrl,
        logo_image: uploadedLogoUrl,
        stripe_price_id: stripePriceId || "",
        batch_start_date: formatDate(`${batchListing.batch_start_date}T00:00`),
        batch_end_date: formatDate(`${batchListing.batch_end_date}T00:00`),
        chip_link_id: selectedChipIds[0],
      };

      const createdBatchListing = await createBatchListing(
        newBatchListing,
        Number(collectionId)
      );

      if (!createdBatchListing) {
        toast({
          title: "Error",
          description: "Failed to create batch listing",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Batch listing created successfully",
        variant: "default",
      });

      router.push(`/dashboard/collection/${collectionId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    {/* <CheckCircleIcon className="w-24 h-24 text-primary relative z-10" />
                     */}
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
                  Batch Listing Created ⭐!
                </h2>

                <p className="text-lg mb-6">
                  Your NFC tag is on its way to you 🎉
                </p>

                <p className="text-sm mb-6 bg-primary/10 p-3 rounded-lg inline-block">
                  Keep an eye on your mailbox. Youll receive a tracking number
                  soon!
                </p>

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
              Create New Batch Listing
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Fill in the details below to create your new batch listing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                  <div className="space-y-2">
                    <Label
                      htmlFor="batch-start-date"
                      className="text-lg font-semibold flex items-center"
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      Batch Start Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="batch-start-date"
                      type="date"
                      value={batchListing.batch_start_date ?? ""}
                      onChange={(e) => {
                        handleBatchListingChange(
                          "batch_start_date",
                          e.target.value
                        );
                      }}
                      min={new Date().toISOString().split("T")[0]}
                      className="text-base w-fit"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="batch-end-date"
                      className="text-lg font-semibold flex items-center"
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      Batch End Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="batch-end-date"
                      type="date"
                      value={batchListing.batch_end_date ?? ""}
                      onChange={(e) =>
                        handleBatchListingChange("batch_end_date", e.target.value)
                      }
                      min={batchListing.batch_start_date ?? ""}
                      className="text-base w-fit"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="batch-hour"
                      className="text-lg font-semibold"
                    >
                      Batch Start Time <span className="text-destructive">*</span>
                    </Label>
                    <div className="text-sm text-muted-foreground">Mention the timings in UTC format</div>
                    <select
                      id="batch-hour"
                      value={batchListing.batch_hour ?? ""}
                      onChange={(e) =>
                        handleBatchListingChange(
                          "batch_hour",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full p-2 border rounded-md text-base"
                      required
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i.toString()}>
                          {i}:00
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="mt-2 ">You can edit this later</span>
                </div>

                {/* Batch Info */}
                <div className="space-y-2">
                  <Label
                    htmlFor="batchListing-name"
                    className="text-lg font-semibold"
                  >
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="batchListing-name"
                    value={batchListing.name}
                    onChange={(e) =>
                      handleBatchListingChange("name", e.target.value)
                    }
                    className="text-lg"
                    required
                    maxLength={32}
                  />
                  <p className="text-sm text-muted-foreground">
                    {batchListing.name.length}/32 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="batchListing-description"
                    className="text-lg font-semibold"
                  >
                    Description{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="batchListing-description"
                    value={batchListing.description}
                    onChange={(e) =>
                      handleBatchListingChange("description", e.target.value)
                    }
                    className="min-h-[120px] text-base"
                    required
                  />
                </div>

                {/* Collectible Info */}
                <div className="space-y-2">
                  <Label
                    htmlFor="collectible-name"
                    className="text-lg font-semibold"
                  >
                    Collectible Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="collectible-name"
                    value={batchListing.collectible_name}
                    onChange={(e) =>
                      handleBatchListingChange("collectible_name", e.target.value)
                    }
                    className="text-lg"
                    required
                    maxLength={32}
                  />
                  <p className="text-sm text-muted-foreground">
                    {batchListing.name.length}/32 characters
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
                    value={batchListing.collectible_description}
                    onChange={(e) =>
                      handleBatchListingChange("collectible_description", e.target.value)
                    }
                    className="min-h-[120px] text-base"
                    required
                  />
                </div>

                {/* Chip Selection */}
                <div className="space-y-2">
                  <Label
                    htmlFor="chip-selection"
                    className="text-lg font-semibold"
                  >
                    Assign Chip <span className="text-destructive">*</span>
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
                            <Input
                              type="radio"
                              name="nfc-chip"
                              id={`chip-${chip.id}`}
                              checked={selectedChipIds.includes(chip.id)}
                              onChange={() => setSelectedChipIds([chip.id])}
                              className="h-4 w-4 rounded border-gray-300"
                              required
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
                        Select one chip to link to this collectible. <span className="text-destructive font-medium">Required</span>
                      </p>
                      {selectedChipIds.length > 0 && (
                        <p className="text-sm text-primary">
                          1 chip selected
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
                            <p className="mt-2 font-medium">
                              NFC chip assignment is required to create a collectible.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="batchListing-image"
                    className="text-lg font-semibold"
                  >
                    Collectible Media{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Supported formats: .png, .jpg, .jpeg, .gif, .mp4, .mov,
                    .webm (Max size: 10MB)
                  </p>
                  <div className="relative">
                    <Input
                      id="batchListing-image"
                      type="file"
                      accept="image/*,video/*,.gif,audio/*"
                      onChange={handleImageChange}
                      required
                      className="sr-only"
                    />
                    <Label
                      htmlFor="batchListing-image"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-md cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <UploadIcon className="w-6 h-6 text-muted-foreground" />
                        <span className="text-base font-medium text-muted-foreground">
                          {primaryImageLocalFile
                            ? primaryImageLocalFile.name
                            : "Choose file"}
                        </span>
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="logo-image"
                    className="text-lg font-semibold"
                  >
                    Logo Image
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a logo image (Max size: 10MB)
                  </p>
                  <div className="relative">
                    <Input
                      id="logo-image"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoImageChange}
                      className="sr-only"
                    />
                    <Label
                      htmlFor="logo-image"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-md cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <UploadIcon className="w-6 h-6 text-muted-foreground" />
                        <span className="text-base font-medium text-muted-foreground">
                          {logoImage
                            ? logoImage.name
                            : "Choose logo file"}
                        </span>
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="bg-color"
                    className="text-lg font-semibold"
                  >
                    Background Color
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="bg-color"
                      type="color"
                      value={batchListing.bg_color || "#ffffff"}
                      onChange={(e) =>
                        handleBatchListingChange("bg_color", e.target.value)
                      }
                      className="w-16 h-10 p-1 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={batchListing.bg_color || "#ffffff"}
                      onChange={(e) =>
                        handleBatchListingChange("bg_color", e.target.value)
                      }
                      placeholder="#ffffff"
                      className="flex-grow"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose a background color for your collectible. Remember, the text color is black.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="batchListing-brand"
                    className="text-lg font-semibold"
                  >
                    Brand <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="batchListing-brand"
                    value={batchListing.is_irls ? Brand.IRLS : Brand.StreetMint}
                    onChange={(e) =>
                      handleBatchListingChange(
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

                <div className="space-y-2">
                  <Label
                    htmlFor="batchListing-quantity-type"
                    className="text-lg font-semibold"
                  >
                    Quantity Type <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="batchListing-quantity-type"
                    value={batchListing.quantity_type}
                    onChange={(e) =>
                      handleBatchListingChange(
                        "quantity_type",
                        e.target.value as QuantityType
                      )
                    }
                    className="w-full p-2 border rounded-md bg-background text-base"
                    required
                  >
                    <option value={QuantityType.Unlimited}>Open Edition</option>
                    <option value={QuantityType.Single}>1 of 1</option>
                    <option value={QuantityType.Limited}>
                      Limited Edition
                    </option>
                  </select>
                </div>

                {batchListing.quantity_type === QuantityType.Limited && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="batchListing-quantity"
                      className="text-lg font-semibold"
                    >
                      Quantity <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="batchListing-quantity"
                      type="number"
                      value={batchListing?.quantity || ""}
                      onChange={(e) =>
                        handleBatchListingChange(
                          "quantity",
                          parseInt(e.target.value)
                        )
                      }
                      className="text-base"
                    />
                  </div>
                )}

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
                          htmlFor="batchListing-price"
                          className="text-lg font-semibold"
                        >
                          Price (USD){" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="batchListing-price"
                          type="number"
                          value={batchListing.price_usd}
                          onChange={(e) =>
                            handleBatchListingChange(
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
                          checked={batchListing.enable_card_payments}
                          onCheckedChange={(checked) =>
                            handleBatchListingChange(
                              "enable_card_payments",
                              checked
                            )
                          }
                          className="scale-125"
                        />
                      </div>

                      {batchListing.enable_card_payments && (
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
                            checked={batchListing.only_card_payment || false}
                            onCheckedChange={(checked) =>
                              handleBatchListingChange(
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
                        handleBatchListingChange("custom_email", checked);
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
                          value={batchListing.custom_email_subject ?? ""}
                          onChange={(e) =>
                            handleBatchListingChange(
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
                          value={batchListing.custom_email_body ?? ""}
                          className="min-h-[120px] text-base"
                          onChange={(e) =>
                            handleBatchListingChange(
                              "custom_email_body",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                  <div className="space-y-2">
                    <Label
                      htmlFor="batchListing-location"
                      className="text-lg font-semibold flex items-center"
                    >
                      <MapPinIcon className="mr-2 h-5 w-5" />
                      Location (Google Maps URL) *
                    </Label>
                    <Input
                      id="batchListing-location"
                      value={batchListing.location ?? ""}
                      onChange={(e) =>
                        handleBatchListingChange("location", e.target.value)
                      }
                      placeholder="Enter Google Maps URL"
                      className="text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="batchListing-location-note"
                      className="text-lg font-semibold"
                    >
                      Location Note
                    </Label>
                    <Textarea
                      id="batchListing-location-note"
                      value={batchListing.location_note ?? ""}
                      onChange={(e) =>
                        handleBatchListingChange("location_note", e.target.value)
                      }
                      placeholder="Add any additional details about the location"
                      className="min-h-[80px] text-base"
                    />
                  </div>
                  <span className="mt-2 ">You can edit this later</span>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="gallery-name"
                    className="text-lg font-semibold"
                  >
                    Gallery Name
                  </Label>
                  <Input
                    id="gallery-name"
                    value={batchListing.gallery_name ?? ""}
                    onChange={(e) =>
                      handleBatchListingChange("gallery_name", e.target.value)
                    }
                    className="text-lg"
                    maxLength={32}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="gallery-images"
                    className="text-lg font-semibold"
                  >
                    Gallery Images (Max 5)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Supported formats: .png, .jpg, .jpeg, .gif, .mp4, .mov,
                    .webm (Max size: 10MB)
                  </p>
                  <div className="relative">
                    <Input
                      id="gallery-images"
                      type="file"
                      accept="image/*,video/*,.gif"
                      multiple
                      onChange={handleGalleryImageChange}
                      disabled={galleryImages.length >= 5}
                      className="sr-only"
                    />
                    <Label
                      htmlFor="gallery-images"
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-md cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <UploadIcon className="w-6 h-6 text-muted-foreground" />
                        <span className="text-base font-medium text-muted-foreground">
                          {galleryImages.length > 0
                            ? `${galleryImages.length} file${galleryImages.length > 1 ? "s" : ""
                            } selected`
                            : "Choose files"}
                        </span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4">
                    {galleryImages.map((file, index) => (
                      <div key={index} className="relative group">
                        {file.type.startsWith("image/") ? (
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Gallery media ${index + 1}`}
                            width={100}
                            height={100}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <video
                            src={URL.createObjectURL(file)}
                            width={100}
                            height={100}
                            className="rounded-md"
                          />
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGalleryImage(index)}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-lg font-semibold">
                        Call to Action
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Add a call to action to your batchListing.
                      </p>
                    </div>

                    <Switch
                      id="call-to-action-toggle"
                      checked={batchListing.cta_enable}
                      onCheckedChange={(checked) =>
                        handleBatchListingChange("cta_enable", checked)
                      }
                      className="scale-125"
                    />
                  </div>
                  {batchListing.cta_enable && (
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
                          value={batchListing.cta_title ?? ""}
                          placeholder="Join our newsletter"
                          required
                          onChange={(e) =>
                            handleBatchListingChange("cta_title", e.target.value)
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
                          value={batchListing.cta_description ?? ""}
                          onChange={(e) =>
                            handleBatchListingChange(
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
                          value={batchListing.cta_text ?? ""}
                          onChange={(e) =>
                            handleBatchListingChange("cta_text", e.target.value)
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
                          value={batchListing.cta_link ?? ""}
                          placeholder="https://streetmint.xyz"
                          onChange={(e) =>
                            handleBatchListingChange("cta_link", e.target.value)
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
                          checked={batchListing.cta_has_email_capture}
                          onCheckedChange={() =>
                            handleBatchListingChange(
                              "cta_has_email_capture",
                              !batchListing.cta_has_email_capture
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
                          checked={batchListing.cta_has_text_capture}
                          onCheckedChange={() =>
                            handleBatchListingChange(
                              "cta_has_text_capture",
                              !batchListing.cta_has_text_capture
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                  <div>
                    <Label
                      htmlFor="free-mint-toggle"
                      className="text-lg font-semibold"
                    >
                      Collectible Version{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        handleBatchListingChange("is_light_version", false)
                      }
                      className={`flex-1 p-4 rounded-lg transition-colors relative ${batchListing.is_light_version === false
                        ? "bg-primary/20"
                        : "bg-primary/5 hover:bg-primary/10"
                        }`}
                    >
                      <div className="absolute top-4 right-4 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center">
                        {batchListing.is_light_version === false && (
                          <div className="w-3 h-3 rounded-full bg-black"></div>
                        )}
                      </div>
                      <h3 className="font-bold mb-2">IRLS STANDARD</h3>
                      <div className="h-0.5 bg-black/10 mb-4"></div>
                      <div className="space-y-2">
                        <div>
                          Instant Mint - If an email is provided, a wallet is
                          automatically created. The user can then transfer
                          their IRLS NFT to their own wallet via email.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleBatchListingChange("is_light_version", true)
                      }
                      className={`flex-1 p-4 rounded-lg transition-colors relative ${batchListing.is_light_version === true
                        ? "bg-primary/20"
                        : "bg-primary/5 hover:bg-primary/10"
                        }`}
                    >
                      <div className="absolute top-4 right-4 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center">
                        {batchListing.is_light_version === true && (
                          <div className="w-3 h-3 rounded-full bg-black"></div>
                        )}
                      </div>
                      <h3 className="font-bold mb-2">IRLS LIGHT</h3>
                      <div className="h-0.5 bg-black/10 mb-4"></div>
                      <div className="space-y-2">
                        <div>
                          Email-Based Minting - Users receive an email with the
                          option to mint their IRLS NFT and transfer it to their
                          own wallet at their convenience.
                        </div>
                      </div>
                    </button>
                  </div>
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

                  {batchListing.creator_royalty_array?.map((creator, index) => (
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

                  {batchListing.creator_royalty_array?.length === 0 && (
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
                        Select a sponsor to associate with this batchListing
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
                                batchListing.sponsor_id?.toString() || "none"
                              }
                              onValueChange={(value) => {
                                console.log("Selected sponsor value:", value);
                                handleBatchListingChange(
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
              </div>

              <Button
                type="submit"
                className="w-full text-lg h-14 mt-8"
                disabled={isSubmitting || selectedChipIds.length === 0 || availableChips.length === 0}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-6 justify-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Creating Batch Listing...
                  </div>
                ) : (
                  "Create Batch Listing"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default withAuth(CreateBatchListingPage);