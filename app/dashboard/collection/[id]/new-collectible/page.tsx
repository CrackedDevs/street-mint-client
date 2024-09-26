"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  TrashIcon,
  Loader2,
  ArrowLeftIcon,
  UploadIcon,
  MapPinIcon,
  CalendarIcon,
} from "lucide-react";
import {
  Collectible,
  createCollectible,
  QuantityType,
  uploadImage,
} from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { NumericUUID } from "@/lib/utils";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import Delivery from "@/app/assets/delivery.svg";
import withAuth from "@/app/dashboard/withAuth";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function CreateCollectiblePage() {
  const router = useRouter();
  const { id: collectionId } = useParams();
  const { toast } = useToast();
  const { publicKey } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userProfile } = useUserProfile();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [collectible, setCollectible] = useState<Collectible>({
    id: NumericUUID(),
    name: "",
    description: "",
    primary_image_url: "",
    quantity_type: QuantityType.Unlimited,
    quantity: 0,
    price_usd: 0,
    gallery_urls: [],
    location: "",
    location_note: "",
    metadata_uri: "", // Add this line
    nfc_public_key: "",
    mint_start_date: "",
    mint_end_date: "",
  });
  const [primaryImageLocalFile, setPrimaryImageLocalFile] =
    useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [isFreeMint, setIsFreeMint] = useState(false);

  const handleCollectibleChange = (field: keyof Collectible, value: any) => {
    setCollectible((prev) => ({ ...prev, [field]: value }));
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
      setPrimaryImageLocalFile(file);
      handleCollectibleChange("primary_image_url", URL.createObjectURL(file));
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
            "You can only upload a maximum of 5 images per collectible.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFreeMintToggle = (checked: boolean) => {
    setIsFreeMint(checked);
    if (checked) {
      handleCollectibleChange("price_usd", 0);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
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
      collectible.quantity_type === QuantityType.Limited &&
      !collectible.quantity
    ) {
      toast({
        title: "Enter quantity",
        description: "Enter quantity for limited quantity type",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      let primaryImageUrl = "";
      if (primaryImageLocalFile) {
        primaryImageUrl = (await uploadImage(primaryImageLocalFile)) || "";
      }

      const uploadedGalleryUrls = await Promise.all(
        galleryImages.map(async (file) => {
          return (await uploadImage(file)) || "";
        })
      );

      const newCollectible: Collectible = {
        ...collectible,
        primary_image_url: primaryImageUrl,
        gallery_urls: uploadedGalleryUrls.filter(Boolean),
        id: NumericUUID(),
        price_usd: isFreeMint ? 0 : collectible.price_usd,
      };

      const createdCollectible = await createCollectible(
        newCollectible,
        Number(collectionId)
      );

      if (createdCollectible) {
        setShowSuccessModal(true);
      } else {
        throw new Error("Failed to create collectible");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create collectible",
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
                  Collectible Created ⭐!
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
              Create New Collectible
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Fill in the details below to create your new collectible.
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
                  />
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
                    htmlFor="collectible-image"
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
                      id="collectible-image"
                      type="file"
                      accept="image/*,video/*,.gif"
                      onChange={handleImageChange}
                      required
                      className="sr-only"
                    />
                    <Label
                      htmlFor="collectible-image"
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
                    htmlFor="collectible-quantity-type"
                    className="text-lg font-semibold"
                  >
                    Quantity Type <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="collectible-quantity-type"
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
                    <option value={QuantityType.Limited}>
                      Limited Edition
                    </option>
                  </select>
                </div>

                {collectible.quantity_type === QuantityType.Limited && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="collectible-quantity"
                      className="text-lg font-semibold"
                    >
                      Quantity <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="collectible-quantity"
                      type="number"
                      value={collectible?.quantity || ""}
                      onChange={(e) =>
                        handleCollectibleChange(
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
                    <div className="space-y-2">
                      <Label
                        htmlFor="collectible-price"
                        className="text-lg font-semibold"
                      >
                        Price (USD) <span className="text-destructive">*</span>
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
                  )}
                </div>

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

                <div className="space-y-6 bg-primary/5 p-6 border-2 border-black rounded-lg">
                  <div className="space-y-2">
                    <Label
                      htmlFor="mint-start-date"
                      className="text-lg font-semibold flex items-center"
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      Minting Start Date and Time *
                    </Label>
                    <span>Mention the timings in GMT</span>
                    <Input
                      id="mint-start-date"
                      type="datetime-local"
                      value={collectible.mint_start_date ?? ""}
                      onChange={(e) =>
                        handleCollectibleChange(
                          "mint_start_date",
                          e.target.value
                        )
                      }
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
                      Minting End Date and Time *
                    </Label>
                    <span>Mention the timings in GMT</span>
                    <Input
                      id="mint-end-date"
                      type="datetime-local"
                      value={collectible.mint_end_date ?? ""}
                      onChange={(e) =>
                        handleCollectibleChange("mint_end_date", e.target.value)
                      }
                      className="text-base w-fit"
                      required
                    />
                  </div>
                  <span className="mt-2 ">You can edit this later</span>
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
                            ? `${galleryImages.length} file${
                                galleryImages.length > 1 ? "s" : ""
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
              </div>

              <Button
                type="submit"
                className="w-full text-lg h-14 mt-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Creating Collectible...
                  </>
                ) : (
                  "Create Collectible"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default withAuth(CreateCollectiblePage);
