"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import { createStampbook, uploadFileToPinata } from "@/lib/supabaseClient";
import { CollectibleSelector } from "@/components/CollectibleSelector";

function CreateStampbookPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
  const [stampbook, setStampbook] = useState({
    name: "",
    description: "",
    bg_color: "#ffffff",
    loyalty_bg_color: "#000000",
    collectibles: [] as number[],
  });

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
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      toast({
        title: "Error",
        description: "You must be logged in to create a stampbook",
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

    if (!logoImage) {
      toast({
        title: "Error",
        description: "Please upload a logo image",
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
      let logoImageUrl = "";
      if (logoImage) {
        logoImageUrl = await uploadFileToPinata(logoImage) || "";
        if (!logoImageUrl) {
          throw new Error("Failed to upload logo image");
        }
      }

      const newStampbook = await createStampbook({
        name: stampbook.name,
        description: stampbook.description,
        bg_color: stampbook.bg_color,
        loyalty_bg_color: stampbook.loyalty_bg_color,
        collectibles: stampbook.collectibles,
        artist_id: userProfile.id,
        logo_image: logoImageUrl,
      });

      if (!newStampbook) throw new Error("Failed to create stampbook");

      toast({
        title: "Success",
        description: "Stampbook created successfully",
      });

      router.push("/dashboard/stampbooks");
    } catch (error) {
      console.error("Error creating stampbook:", error);
      toast({
        title: "Error",
        description: "Failed to create stampbook",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-4xl font-bold text-center">
              Create New Stampbook
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Fill in the details below to create your new stampbook.
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
                    value={stampbook.name}
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
                    value={stampbook.description}
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
                      value={stampbook.bg_color}
                      onChange={(e) => handleStampbookChange("bg_color", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={stampbook.bg_color}
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
                      value={stampbook.loyalty_bg_color}
                      onChange={(e) => handleStampbookChange("loyalty_bg_color", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={stampbook.loyalty_bg_color}
                      onChange={(e) => handleStampbookChange("loyalty_bg_color", e.target.value)}
                      className="flex-1"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_image" className="text-lg font-semibold">
                    Logo Image <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="logo_image"
                    type="file"
                    onChange={handleLogoImageChange}
                    accept="image/*"
                    className="text-base"
                    required
                  />
                  {logoPreviewUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <Image
                        src={logoPreviewUrl}
                        alt="Logo preview"
                        width={200}
                        height={200}
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
                    Creating Stampbook...
                  </div>
                ) : (
                  "Create Stampbook"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CreateStampbookPage;
