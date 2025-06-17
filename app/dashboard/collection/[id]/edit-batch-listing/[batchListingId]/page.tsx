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
import { createProduct } from "@/helpers/stripe";
import { useToast } from "@/hooks/use-toast";
import {
  getChipLinksByArtistId,
  getSponsorsByArtistId,
  updateChipLink
} from "@/lib/supabaseAdminClient";
import {
  BatchListing,
  Brand,
  getBatchListingById,
  getLatestCollectibleByBatchListingId,
  QuantityType,
  Sponsor,
  updateBatchListing,
  uploadFileToPinata,
  LabelFormat,
  LabelPositionMode
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
  UploadIcon,
  XCircleIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Draggable from "react-draggable";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface CreatorRoyalty {
  creator_wallet_address: string;
  royalty_percentage: number;
  name: string;
}

function CreateBatchListingPage() {
  const router = useRouter();
  const { id: collectionId, batchListingId } = useParams();

  const { toast } = useToast();
  const { publicKey } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userProfile } = useUserProfile();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newCtaLogoImage, setNewCtaLogoImage] = useState<File | null>(null);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [availableChips, setAvailableChips] = useState<
    Array<{
      id: number;
      chip_id: string;
      active: boolean;
      collectible_id: number | null;
      batch_listing_id: number | null;
      created_at: string;
      artists_id: number | null;
    }>
  >([]);
  const [selectedChipIds, setSelectedChipIds] = useState<number[]>([]);
  const [isLoadingChips, setIsLoadingChips] = useState(false);
  const [frequencyType, setFrequencyType] = useState<string>("daily");
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]);

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
    batch_start_date: null,
    batch_end_date: null,
    batch_hour: 0,
    collection_id: Number(collectionId),
    gallery_name: null,
    logo_image: null,
    label_text_color: "#000000",
    label_format: LabelFormat.None,
    label_position_x: 0,
    label_position_y: 0,
    display_width: 0,
    display_height: 0,
    frequency_type: "daily",
    frequency_days: [],
    always_active: true,
    label_size: 16,
  });
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [isFreeMint, setIsFreeMint] = useState(false);
  const [customEmail, setCustomEmail] = useState(false);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState(false);
  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
    displayWidth: 0
  });
  const imageRef = useRef<HTMLImageElement>(null);

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

  useEffect(() => {
    async function fetchBatchListing() {
      if (batchListingId && userProfile?.id) {
        try {
          const id = parseInt(batchListingId as string);

          const batchListing = await getBatchListingById(id);
          if (batchListing) {
            const startDate = new Date(batchListing.batch_start_date ?? "").toISOString().split("T")[0]
            const endDate = new Date(batchListing.batch_end_date ?? "").toISOString().split("T")[0]

            setBatchListing({
              ...batchListing,
              batch_start_date: startDate,
              batch_end_date: endDate
            });

            // Set frequency type and days
            if (batchListing.frequency_type) {
              setFrequencyType(batchListing.frequency_type);

              if (batchListing.frequency_days && batchListing.frequency_days.length > 0) {
                if (batchListing.frequency_type === "weekly") {
                  setSelectedWeekDays(batchListing.frequency_days);
                } else if (batchListing.frequency_type === "monthly") {
                  setSelectedMonthDays(batchListing.frequency_days);
                }
              }
            }

            setIsFreeMint(batchListing.price_usd === 0);
            setGalleryImages([]);
            batchListing.gallery_urls?.forEach((url) => {
              fetch(url)
                .then((res) => res.blob())
                .then((blob) => {
                  const file = new File([blob], "gallery_image", { type: blob.type });
                  setGalleryImages((prev) => [...prev, file]);
                })
                .catch((error) => console.error("Error converting URL to File:", error));
            });
          } else {
            toast({
              title: "Error",
              description: "Batch listing not found.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching batch listing:", error);
          toast({
            title: "Error",
            description: "Failed to fetch batch listing.",
            variant: "destructive",
          });
        }
      }
    }

    fetchBatchListing();
  }, [userProfile?.id]);

  // Fetch chips for the artist
  useEffect(() => {
    const fetchArtistChips = async () => {
      if (userProfile?.id) {
        setIsLoadingChips(true);
        try {
          const chips = await getChipLinksByArtistId(userProfile.id);
          if (chips) {
            const batchListingIdNum = parseInt(batchListingId as string);

            // Filter chips that are either:
            // 1. Not assigned to any collectible or batch listing
            // 2. Assigned to this specific batch listing
            const availableOrAssignedChips = chips.filter(
              (chip) =>
                (!chip.collectible_id && !chip.batch_listing_id) || // Unassigned
                chip.batch_listing_id === batchListingIdNum // Assigned to this batch
            );

            setAvailableChips(availableOrAssignedChips);

            // Set selected chips (only those assigned to this batch listing)
            const chipsForThisBatch = chips
              .filter((chip) => chip.batch_listing_id === batchListingIdNum)
              .map((chip) => chip.id);

            setSelectedChipIds(chipsForThisBatch);
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
  }, [userProfile?.id, batchListingId, toast]);

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

  const handleFreeMintToggle = (checked: boolean) => {
    setIsFreeMint(checked);
    if (checked) {
      handleBatchListingChange("price_usd", 0);
      handleBatchListingChange("enable_card_payments", false);
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

  const toggleChipSelection = (chipId: number) => {
    setSelectedChipIds((prev) => {
      if (prev.includes(chipId)) {
        return prev.filter((id) => id !== chipId);
      } else {
        return [...prev, chipId];
      }
    });
  };

  const handleFrequencyTypeChange = (type: string) => {
    setFrequencyType(type);
    handleBatchListingChange("frequency_type", type);

    // Reset frequency days when changing type
    if (type === "daily") {
      handleBatchListingChange("frequency_days", []);
      setSelectedWeekDays([]);
      setSelectedMonthDays([]);
    } else if (type === "weekly") {
      handleBatchListingChange("frequency_days", selectedWeekDays);
    } else if (type === "monthly") {
      handleBatchListingChange("frequency_days", selectedMonthDays);
    }
  };

  const handleWeekDayToggle = (day: number) => {
    setSelectedWeekDays(prev => {
      const newSelection = prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day];

      handleBatchListingChange("frequency_days", newSelection);
      return newSelection;
    });
  };

  const handleMonthDayToggle = (day: number) => {
    setSelectedMonthDays(prev => {
      const newSelection = prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day];

      handleBatchListingChange("frequency_days", newSelection);
      return newSelection;
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

    // Add frequency validation
    if (frequencyType === "weekly" && selectedWeekDays.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day of the week",
        variant: "destructive",
      });
      return;
    }
    if (frequencyType === "monthly" && selectedMonthDays.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day of the month",
        variant: "destructive",
      });
      return;
    }

    // Validate always_active is set for weekly/monthly frequency types
    if ((frequencyType === "weekly" || frequencyType === "monthly") && batchListing.always_active === undefined) {
      toast({
        title: "Error",
        description: "Please select when the collectible should end",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const batchStartDate = new Date(batchListing.batch_start_date || "").toISOString();
      const batchEndDate = new Date(batchListing.batch_end_date || "").toISOString();

      let stripePriceId: string | null = null;
      if (batchListing.enable_card_payments) {
        stripePriceId = await createProduct(
          batchListing.name,
          batchListing.price_usd
        );
      }

      // Upload logo image if a new one was selected
      let logoImageUrl = batchListing.logo_image;
      if (logoImage) {
        logoImageUrl = await uploadFileToPinata(logoImage);
      }

      const newBatchListing: BatchListing = {
        ...batchListing,
        primary_image_url: batchListing.primary_image_url,
        gallery_urls: batchListing.gallery_urls,
        price_usd: isFreeMint ? 0 : batchListing.price_usd,
        cta_logo_url: batchListing.cta_logo_url,
        logo_image: logoImageUrl,
        stripe_price_id: stripePriceId || "",
        batch_start_date: batchStartDate,
        batch_end_date: batchEndDate,
        frequency_type: frequencyType,
        frequency_days: frequencyType === "daily" ? [] :
          frequencyType === "weekly" ? selectedWeekDays : selectedMonthDays,
        always_active: batchListing.always_active,
      };

      const updatedBatchListing = await updateBatchListing(newBatchListing);

      if (updatedBatchListing) {
        // Handle chip assignments
        if (userProfile?.id && batchListingId) {
          try {
            // Get the batch listing ID as a number
            const batchListingIdNum = parseInt(batchListingId as string);

            // Fetch the latest collectible for this batch listing
            const latestCollectible = await getLatestCollectibleByBatchListingId(batchListingIdNum);

            // Get current chip assignments for this batch listing
            const currentAssignments = availableChips
              .filter((chip) => chip.batch_listing_id === batchListingIdNum)
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
                  collectible_id: latestCollectible?.id || null,
                  batch_listing_id: batchListingIdNum,
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
                  batch_listing_id: null,
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
                "Batch listing updated but chip assignments may not be complete. Please check them manually.",
              variant: "destructive",
            });
          }
        }
        setShowSuccessModal(true);
      } else {
        throw new Error("Failed to create batch listing");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create batch listing",
        variant: "destructive",
      });
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
                  Batch Updated ⭐!
                </h2>

                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push(`/dashboard/collection/${collectionId}`);
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-white h-12"
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
              Edit Batch Listing
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Edit the details below to edit your new batch listing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                  <div className="space-y-2">
                    <Label
                      htmlFor="mint-start-date"
                      className="text-lg font-semibold flex items-center"
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      Batch Start Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="mint-start-date"
                      type="date"
                      value={batchListing.batch_start_date ?? ""}
                      onChange={(e) => {
                        handleBatchListingChange(
                          "batch_start_date",
                          e.target.value
                        );
                      }}
                      className="text-base w-fit"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="mint-end-date"
                      className="text-lg font-semibold flex items-center"
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      Batch End Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="mint-end-date"
                      type="date"
                      value={batchListing.batch_end_date ?? ""}
                      onChange={(e) =>
                        handleBatchListingChange("batch_end_date", e.target.value)
                      }
                      className="text-base w-fit"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="batch-frequency"
                      className="text-lg font-semibold"
                    >
                      Frequency Type <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex space-x-4 mt-2">
                      <button
                        type="button"
                        onClick={() => handleFrequencyTypeChange("daily")}
                        className={`px-4 py-2 rounded-md ${frequencyType === "daily"
                            ? "bg-primary text-white"
                            : "bg-primary/10 hover:bg-primary/20"
                          }`}
                      >
                        Daily
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFrequencyTypeChange("weekly")}
                        className={`px-4 py-2 rounded-md ${frequencyType === "weekly"
                            ? "bg-primary text-white"
                            : "bg-primary/10 hover:bg-primary/20"
                          }`}
                      >
                        Weekly
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFrequencyTypeChange("monthly")}
                        className={`px-4 py-2 rounded-md ${frequencyType === "monthly"
                            ? "bg-primary text-white"
                            : "bg-primary/10 hover:bg-primary/20"
                          }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>

                  {frequencyType === "weekly" && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-lg font-semibold">
                        Select Days of Week <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-7 gap-2 mt-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleWeekDayToggle(index)}
                            className={`p-2 rounded-md text-center ${selectedWeekDays.includes(index)
                                ? "bg-primary text-white"
                                : "bg-primary/10 hover:bg-primary/20"
                              }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedWeekDays.length === 0
                          ? "Please select at least one day"
                          : `Selected: ${selectedWeekDays.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}`}
                      </p>
                    </div>
                  )}

                  {frequencyType === "monthly" && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-lg font-semibold">
                        Select Days of Month <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-7 gap-2 mt-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleMonthDayToggle(day)}
                            className={`p-2 rounded-md text-center ${selectedMonthDays.includes(day)
                                ? "bg-primary text-white"
                                : "bg-primary/10 hover:bg-primary/20"
                              }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedMonthDays.length === 0
                          ? "Please select at least one day"
                          : `Selected: ${selectedMonthDays.sort((a, b) => a - b).join(", ")}`}
                      </p>
                    </div>
                  )}

                  {(frequencyType === "weekly" || frequencyType === "monthly") && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-lg font-semibold">
                        End collectible at <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <button
                          type="button"
                          onClick={() => handleBatchListingChange("always_active", true)}
                          className={`p-4 rounded-lg border-2 transition-colors ${batchListing.always_active === true
                              ? "border-primary bg-primary/10"
                              : "border-gray-200 hover:border-primary/50"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">New Collectible Created</h3>
                            <div className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center ${batchListing.always_active === true ? "bg-primary/20" : ""
                              }`}>
                              {batchListing.always_active === true && (
                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            This collectible will remain active until a new collectible is created in this batch
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBatchListingChange("always_active", false)}
                          className={`p-4 rounded-lg border-2 transition-colors ${batchListing.always_active === false
                              ? "border-primary bg-primary/10"
                              : "border-gray-200 hover:border-primary/50"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">After 24 Hours</h3>
                            <div className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center ${batchListing.always_active === false ? "bg-primary/20" : ""
                              }`}>
                              {batchListing.always_active === false && (
                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            This collectible will automatically expire 24 hours after creation
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="batchListing-hour-of-day"
                      className="text-lg font-semibold"
                    >
                      Batch Start Hour <span className="text-destructive">*</span>
                    </Label>
                    <div className="text-sm text-muted-foreground">Mention the hour in UTC format</div>
                    <select
                      id="batchListing-hour-of-day"
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
                    Gallery Name <span className="text-destructive">*</span>
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
                        <p className="text-sm text-muted-foreground mt-1">
                          Use {"{#email#}"} in the link to include the captured email address (e.g., https://example.com/signup?email={"{#email#}"})
                        </p>
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
                  {(logoImage || batchListing.logo_image) && (
                    <div className="mb-2">
                      <p className="text-sm text-muted-foreground">
                        {logoImage ? "New logo preview:" : "Current logo:"}
                      </p>
                      <div className="relative h-20 w-20 overflow-hidden rounded-md border border-input">
                        <Image
                          src={logoImage ? URL.createObjectURL(logoImage) : batchListing.logo_image || ""}
                          alt="Logo"
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
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
                  <Label htmlFor="batchListing-label-format" className="text-lg font-semibold">
                    Collectible Media Label Format <span className="text-destructive">*</span>
                  </Label>

                  <select
                    id="batchListing-label-format"
                    value={batchListing.label_format || LabelFormat.None}
                    onChange={(e) =>
                      handleBatchListingChange(
                        "label_format",
                        e.target.value as LabelFormat
                      )
                    }
                    className="w-full p-2 border rounded-md bg-background text-base"
                  >
                    <option value={LabelFormat.None}>No Label</option>
                    <option value={LabelFormat.Day}>Day (Day 1, Day 2, etc.)</option>
                    <option value={LabelFormat.Date}>Date (01/01/1970, 01/02/1970, etc.)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="label-text-color"
                    className="text-lg font-semibold"
                  >
                    Collectible Media Label Text Color
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="label-text-color"
                      type="color"
                      value={batchListing.label_text_color || "#000000"}
                      onChange={(e) =>
                        handleBatchListingChange("label_text_color", e.target.value)
                      }
                      className="w-16 h-10 p-1 rounded cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={batchListing.label_text_color || "#000000"}
                      onChange={(e) =>
                        handleBatchListingChange("label_text_color", e.target.value)
                      }
                      placeholder="#000000"
                      className="flex-grow"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose a text color for your collectible label.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="label-size"
                    className="text-lg font-semibold"
                  >
                    Label Size
                  </Label>
                  <select
                    id="label-size"
                    value={batchListing.label_size}
                    onChange={(e) =>
                      handleBatchListingChange("label_size", parseInt(e.target.value))
                    }
                    className="w-full p-2 border rounded-md bg-background text-base"
                  >
                    <option value="12">Very Small</option>
                    <option value="14">Small</option>
                    <option value="16">Medium</option>
                    <option value="20">Large</option>
                    <option value="24">Extra Large</option>
                  </select>
                </div>

                {batchListing.primary_image_url && batchListing.label_format !== LabelFormat.None && (
                  <div
                    className="relative mx-auto"
                    style={{
                      width: imageSize.width,
                      height: imageSize.height,
                    }}
                  >
                    {/* Image */}
                    <div
                      className="absolute"
                      style={{
                        width: imageSize.width,
                        height: imageSize.height,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imageRef}
                        src={batchListing.primary_image_url}
                        alt="Editable image"
                        className="object-cover"
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          const aspectRatio = img.naturalWidth / img.naturalHeight;
                          const displayWidth = 400 * aspectRatio;

                          setImageSize({
                            width: displayWidth,
                            height: 400,
                            displayWidth: displayWidth
                          });
                        }}
                        width={imageSize.displayWidth || 400}
                        height={400}
                      />
                    </div>

                    {/* Draggable label */}
                    <Draggable
                      bounds="parent"
                      defaultPosition={{ 
                        x: batchListing.label_position_x || 0, 
                        y: batchListing.label_position_y || 0 
                      }}
                      onDrag={(_: any, data: { x: number; y: number }) => {
                        handleBatchListingChange("label_position_x", data.x);
                        handleBatchListingChange("label_position_y", data.y);
                      }}
                    >
                      <div
                        className="absolute cursor-move px-3 py-1.5 z-10"
                        style={{
                          color: batchListing.label_text_color || "#000000",
                          fontSize: `${batchListing.label_size}px`
                        }}
                      >
                        <p className="text-md font-semibold">
                          {batchListing.label_format === "date" ? "01/01/1970" : "Day 1"}
                        </p>
                      </div>
                    </Draggable>
                  </div>
                )}
              </div>

              {/* Chip Links Section */}
              <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-lg font-semibold">
                      Chip Links
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Assign chip links to this batch listing
                    </p>
                  </div>
                </div>

                {isLoadingChips ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : availableChips.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No available chips found. You need to create chips first in the Chip Management section.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {availableChips.map((chip) => (
                      <div
                        key={chip.id}
                        onClick={() => toggleChipSelection(chip.id)}
                        className={`cursor-pointer p-3 rounded-md border-2 flex items-center justify-between transition-colors ${selectedChipIds.includes(chip.id)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                          }`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full ${selectedChipIds.includes(chip.id)
                                ? "bg-primary"
                                : "border border-gray-400"
                              }`}
                          />
                          <span className="ml-2 font-medium">
                            {chip.chip_id}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(chip.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full text-lg h-14 mt-8"
                disabled={
                  isSubmitting ||
                  (frequencyType === "weekly" && selectedWeekDays.length === 0) ||
                  (frequencyType === "monthly" && selectedMonthDays.length === 0) ||
                  ((frequencyType === "weekly" || frequencyType === "monthly") && batchListing.always_active === undefined)
                }
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-6 justify-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Editing Batch Listing...
                  </div>
                ) : (
                  "Edit Batch Listing"
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