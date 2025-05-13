"use client";

import { useState, useEffect } from "react";
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
import { Loader2, ArrowLeftIcon } from "lucide-react";
import { Collection, getCollectionById, updateCollection } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import withAuth from "@/app/dashboard/withAuth";
import { useUserProfile } from "@/app/providers/UserProfileProvider";

function EditCollectionPage() {
  const router = useRouter();
  const { id } = useParams();
  const { toast } = useToast();
  const { publicKey } = useWallet();
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile } = useUserProfile();

  useEffect(() => {
    async function fetchCollection() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const collection = await getCollectionById(Number(id));
        
        if (collection) {
          setCollectionName(collection.name);
          setCollectionDescription(collection.description);
        } else {
          toast({
            title: "Error",
            description: "Collection not found",
            variant: "destructive",
          });
          router.push("/dashboard/collection");
        }
      } catch (error) {
        console.error("Error fetching collection:", error);
        toast({
          title: "Error",
          description: "Failed to load collection",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchCollection();
  }, [id, router, toast]);

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
    setIsSubmitting(true);
    try {
      const result = await updateCollection({
        id: Number(id),
        name: collectionName,
        description: collectionDescription,
        artist: userProfile.id,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Collection updated successfully",
          variant: "default",
        });
        router.push(`/dashboard/collection`);
      } else {
        throw result.error || new Error("Failed to update collection");
      }
    } catch (error) {
      console.error("Error updating collection:", error);
      toast({
        title: "Error",
        description: "Failed to update collection",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/collection")}
          className="mb-6"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Collections
        </Button>
        <Card className="w-full">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-3xl font-bold text-center">
              Edit Collection
            </CardTitle>
            <CardDescription className="text-center">
              Update your collection details below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="collection-name"
                    className="text-base font-semibold"
                  >
                    Collection Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="collection-name"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    className="text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="collection-description"
                    className="text-base font-semibold"
                  >
                    Collection Description{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="collection-description"
                    value={collectionDescription}
                    onChange={(e) => setCollectionDescription(e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-lg h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Updating Collection...
                  </>
                ) : (
                  "Update Collection"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuth(EditCollectionPage); 