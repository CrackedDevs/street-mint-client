"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import { getStampbookById, updateStampbook, uploadFileToPinata } from "@/lib/supabaseClient";
import { CollectibleSelector } from "@/components/CollectibleSelector";
import type { Tables } from "@/lib/types/database.types";

type Stampbook = Tables<"stampbooks">;

export default function EditStampbookPage() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
  const [stampbook, setStampbook] = useState<Stampbook>({
    id: Number(id),
    name: "",
    description: "",
    bg_color: "#ffffff",
    loyalty_bg_color: "#000000",
    logo_image: "",
    collectibles: [],
    artist_id: 0,
    created_at: new Date().toISOString(),
  });

  useEffect(() => {
    const loadStampbook = async () => {
      if (!id) return;
      
      try {
        const data = await getStampbookById(Number(id));
        if (!data) {
          toast({
            title: "Error",
            description: "Stampbook not found",
            variant: "destructive",
          });
          router.push("/dashboard/stampbooks");
          return;
        }

        // Check if user owns this stampbook
        if (data.artist_id !== userProfile?.id) {
          toast({
            title: "Unauthorized",
            description: "You don't have permission to edit this stampbook",
            variant: "destructive",
          });
          router.push("/dashboard/stampbooks");
          return;
        }

        setStampbook(data);
        if (data.logo_image) {
          setLogoPreviewUrl(data.logo_image);
        }
      } catch (error) {
        console.error("Error loading stampbook:", error);
        toast({
          title: "Error",
          description: "Failed to load stampbook",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStampbook();
  }, [id, router, toast, userProfile?.id]);

  const handleStampbookChange = (
    field: keyof typeof stampbook,
    value: string | number[]
  ) => {
    setStampbook((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoImage(file);
      const url = URL.createObjectURL(file);
      setLogoPreviewUrl(url);
    }
  };

  useEffect(() => {
    return () => {
      if (logoPreviewUrl && logoImage) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl, logoImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a stampbook",
        variant: "destructive",
      });
      return;
    }

    if (!stampbook.name) {
      toast({
        title: "Error",
        description: "Please enter a name for the stampbook",
        variant: "destructive",
      });
      return;
    }

    if (!stampbook.description) {
      toast({
        title: "Error",
        description: "Please enter a description for the stampbook",
        variant: "destructive",
      });
      return;
    }

    if (!stampbook.collectibles.length) {
      toast({
        title: "Error",
        description: "Please select at least one collectible",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let logoImageUrl = stampbook.logo_image;
      if (logoImage) {
        logoImageUrl = await uploadFileToPinata(logoImage) || "";
        if (!logoImageUrl) {
          throw new Error("Failed to upload logo image");
        }
      }

      const result = await updateStampbook({
        ...stampbook,
        logo_image: logoImageUrl,
      });

      if (!result.success) throw result.error;

      toast({
        title: "Success",
        description: "Stampbook updated successfully",
      });

      router.push("/dashboard/stampbooks");
    } catch (error) {
      console.error("Error updating stampbook:", error);
      toast({
        title: "Error",
        description: "Failed to update stampbook",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Add authorization check
  if (!userProfile || stampbook.artist_id !== userProfile.id) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-destructive">
              Unauthorized Access
            </CardTitle>
            <CardDescription className="text-center text-lg">
              You don't have permission to edit this stampbook.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={() => router.push("/dashboard/stampbooks")}>
              Return to Stampbooks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/stampbooks")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Stampbooks
        </Button>
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-4xl font-bold text-center">
              Edit Stampbook
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Update your stampbook details below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-lg font-semibold">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={stampbook.name || ""}
                    onChange={(e) => handleStampbookChange("name", e.target.value)}
                    className="text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-lg font-semibold">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={stampbook.description || ""}
                    onChange={(e) => handleStampbookChange("description", e.target.value)}
                    className="min-h-[120px] text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bg_color" className="text-lg font-semibold">
                    Background Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="bg_color"
                      type="color"
                      value={stampbook.bg_color || "#ffffff"}
                      onChange={(e) => handleStampbookChange("bg_color", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={stampbook.bg_color || "#ffffff"}
                      onChange={(e) => handleStampbookChange("bg_color", e.target.value)}
                      className="flex-1"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loyalty_bg_color" className="text-lg font-semibold">
                    Loyalty Background Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="loyalty_bg_color"
                      type="color"
                      value={stampbook.loyalty_bg_color || "#000000"}
                      onChange={(e) => handleStampbookChange("loyalty_bg_color", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={stampbook.loyalty_bg_color || "#000000"}
                      onChange={(e) => handleStampbookChange("loyalty_bg_color", e.target.value)}
                      className="flex-1"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_image" className="text-lg font-semibold">
                    Logo Image {!stampbook.logo_image && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="logo_image"
                    type="file"
                    onChange={handleLogoImageChange}
                    accept="image/*"
                    className="text-base"
                    required={!stampbook.logo_image}
                  />
                  {logoPreviewUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <img
                        src={logoPreviewUrl}
                        alt="Logo preview"
                        className="max-w-[200px] h-auto object-contain"
                      />
                    </div>
                  )}
                </div>

                {userProfile && (
                  <CollectibleSelector
                    artistId={userProfile.id}
                    selectedCollectibles={stampbook.collectibles}
                    onCollectiblesChange={(collectibles: number[]) => handleStampbookChange("collectibles", collectibles)}
                  />
                )}
              </div>

              <Button
                type="submit"
                className="w-full text-lg h-14 mt-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-6 justify-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Updating Stampbook...
                  </div>
                ) : (
                  "Update Stampbook"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
