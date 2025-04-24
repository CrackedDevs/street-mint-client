"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PopulatedCollection } from "@/lib/supabaseClient";
import CollectionCard from "@/components/collectionCard";
import { checkAdminSession } from "../actions";

export default function LibraryPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [collections, setCollections] = useState<PopulatedCollection[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { isLoggedIn, collections } = await checkAdminSession();
      setIsLoggedIn(isLoggedIn);
      if (isLoggedIn && collections) {
        setCollections(collections);
      } else if (!isLoggedIn) {
        // Redirect to login page if not logged in
        router.push("/admin");
      }
      setIsLoading(false);
    };

    checkSession();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Collections Library</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <div key={collection.id} className="relative z-20 bg-white">
            <CollectionCard
              isAdmin={true}
              collection={{
                id: collection.id?.toString() || "",
                name: collection.name,
                description: collection.description,
                collectible_image_urls: collection.collectible_image_urls,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
