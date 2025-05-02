"use client";
import { useState, useEffect, useMemo } from "react";
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
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UploadIcon,
  InstagramIcon,
  Loader2,
  EditIcon,
  LinkedinIcon,
} from "lucide-react";
import X from "@/components/x";
import withAuth from "../withAuth";
import {
  ArtistWithoutWallet,
  checkUsernameAvailability,
  createProfile,
  updateProfile,
  uploadFileToPinata,
} from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@solana/wallet-adapter-react";
import { NumericUUID } from "@/lib/utils";
import { useUserProfile } from "@/app/providers/UserProfileProvider";
import Image from "next/image";

function ProfileForm() {
  const { toast } = useToast();
  const { publicKey, connected } = useWallet();
  const { userProfile, setUserProfile, isLoading } = useUserProfile();
  const [formData, setFormData] = useState<ArtistWithoutWallet | null>(null);
  const [avatarLocalFile, setAvatarLocalFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarSrc = useMemo(() => {
    if (avatarLocalFile) {
      return URL.createObjectURL(avatarLocalFile);
    }
    if (avatarUrl) {
      return avatarUrl;
    }
    return null;
  }, [avatarLocalFile]);

  useEffect(() => {
    if (publicKey && userProfile) {
      setFormData(userProfile);
      setAvatarUrl(userProfile.avatar_url || null);

      if (connected && !isLoading && userProfile && !userProfile.email) {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    } else if (!isLoading) {
      setFormData({
        id: NumericUUID(),
        username: "",
        bio: "",
        email: "",
        avatar_url: "",
        x_username: "",
        instagram_username: "",
        farcaster_username: "",
        linkedin_username: "",
      });
      setIsEditing(true);
    }
  }, [connected, isLoading, publicKey, userProfile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData) return false;
    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.bio) newErrors.bio = "Bio is required";
    if (!formData.email) newErrors.email = "Email is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkUsernameUniqueness = async (username: string) => {
    if (!publicKey || userProfile) {
      return true;
    }
    const { available, error } = await checkUsernameAvailability(username);
    if (error) {
      console.error("Error checking username:", error);
      return true;
    }
    return available;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData || !validateForm()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    if (!userProfile) {
      const isUsernameUnique = await checkUsernameUniqueness(formData.username);
      if (!isUsernameUnique) {
        setErrors((prev) => ({
          ...prev,
          username: "This username is already taken",
        }));
        toast({
          title: "Error",
          description:
            "Username is already taken. Please choose a different one.",
        });
        setIsSubmitting(false);
        return;
      }
    }

    let uploadedUrl: string | null = avatarUrl;
    if (avatarLocalFile) {
      uploadedUrl = await uploadFileToPinata(avatarLocalFile);
      if (uploadedUrl == null) {
        toast({
          title: "Failed to upload image",
          variant: "destructive",
        });
        return;
      }
    }

    const profileData: ArtistWithoutWallet = {
      ...formData,
      avatar_url: uploadedUrl || "",
    };

    if (publicKey) {
      const { data, error } = userProfile
        ? await updateProfile({
          ...profileData,
          wallet_address: publicKey?.toString() || "",
        })
        : await createProfile({
          ...profileData,
          wallet_address: publicKey?.toString() || "",
        });
      if (error) {
        console.error("Error submitting profile:", error);
        toast({
          title: "Error",
          description: "Failed to save profile. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Your profile has been ${userProfile ? "updated" : "created"
            } successfully!`,
          variant: "default",
        });
        setIsEditing(false);
        setUserProfile({
          ...profileData,
          wallet_address: publicKey?.toString() || "",
        }); // Update the context
      }
    }
    setIsSubmitting(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarLocalFile(file);
    }
  };

  if (!publicKey) {
    return (
      <div className="flex flex-col h-full justify-center align-middle">
        <p className="text-center">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col h-full justify-center align-middle relative">
      <Card className="w-full max-w-2xl mx-auto z-20 bg-white my-12">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {userProfile ? "Your Profile" : "Create Your Profile"}
          </CardTitle>
          <CardDescription className="text-center">
            {userProfile
              ? "View your profile information below. Click 'Edit' to make changes."
              : "Fill out the form below to set up your profile and connect your social media accounts."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center space-y-2">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-dashed border-gray-300 group-hover:border-primary transition-colors duration-200">
                    {isEditing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
                        <UploadIcon className="w-8 h-8 text-white" />
                      </div>
                    )}
                    {avatarSrc ? (
                      <AvatarImage src={avatarSrc} alt="Avatar" />
                    ) : (
                      <AvatarFallback className="bg-background">
                        <UploadIcon className="w-12 h-12 text-gray-300 group-hover:text-primary transition-colors duration-200" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>

                {isEditing && (
                  <div>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById("avatar-upload")?.click();
                      }}
                    >
                      <UploadIcon className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      500x500px, 2.5MB max
                    </p>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData?.username || ""}
                    onChange={handleInputChange}
                    className={`bg-background ${errors.username ? "border-red-500" : ""
                      }`}
                    placeholder="michael"
                    readOnly={!isEditing}
                  />
                  {errors.username && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.username}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData?.email || ""}
                    onChange={handleInputChange}
                    className={`bg-background ${errors.email ? "border-red-500" : ""
                      }`}
                    readOnly={!isEditing}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Not shown on profile. For important notifications only.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="bio" className="text-sm font-medium">
                Bio <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData?.bio || ""}
                onChange={handleInputChange}
                className={`bg-background h-24 ${errors.bio ? "border-red-500" : ""
                  }`}
                readOnly={!isEditing}
              />
              {errors.bio && (
                <p className="text-xs text-red-500 mt-1">{errors.bio}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {1500 - (formData?.bio?.length || 0)} characters remaining
              </p>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">
                  Connect Your Socials
                </CardTitle>
                <CardDescription className="text-sm">
                  Connect social accounts to verify your identity as a creator.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <X className="h-4 w-4" />
                  <Input
                    id="x_username"
                    name="x_username"
                    value={formData?.x_username || ""}
                    onChange={handleInputChange}
                    className="bg-background"
                    placeholder="X username"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <InstagramIcon className="h-4 w-4 text-pink-500" />
                  <Input
                    id="instagram_username"
                    name="instagram_username"
                    value={formData?.instagram_username || ""}
                    onChange={handleInputChange}
                    className="bg-background"
                    placeholder="Instagram username"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Image
                    alt="farcaster"
                    src="https://docs.farcaster.xyz/icon.png"
                    width={20}
                    height={20}
                  />
                  <Input
                    id="farcaster_username"
                    name="farcaster_username"
                    value={formData?.farcaster_username || ""}
                    onChange={handleInputChange}
                    className="bg-background"
                    placeholder="Farcaster username"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <LinkedinIcon className="h-4 w-4 text-blue-500" />
                  <Input
                    id="linkedin_username"
                    name="linkedin_username"
                    value={formData?.linkedin_username || ""}
                    onChange={handleInputChange}
                    className="bg-background"
                    placeholder="LinkedIn username"
                    readOnly={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </form>
        </CardContent>
        <CardFooter>
          {isEditing ? (
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={(e) => handleSubmit(e as any)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Profile...
                </div>
              ) : (
                "Save Profile"
              )}
            </Button>
          ) : (
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setIsEditing(true)}
            >
              <EditIcon className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default withAuth(ProfileForm);
