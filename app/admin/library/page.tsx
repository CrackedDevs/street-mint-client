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
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCollections, setFilteredCollections] = useState<PopulatedCollection[]>([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { isLoggedIn, collections } = await checkAdminSession();
      setIsLoggedIn(isLoggedIn);
      if (isLoggedIn && collections) {
        setCollections(collections);
        setFilteredCollections(collections);
      } else if (!isLoggedIn) {
        // Redirect to login page if not logged in
        router.push("/admin");
      }
      setIsLoading(false);
    };

    checkSession();
  }, [router]);

  // Handle search input change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter collections based on search term
  useEffect(() => {
    if (debouncedSearchTerm === "") {
      setFilteredCollections(collections);
    } else {
      const filtered = collections.filter(
        (collection) =>
          collection.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          collection.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
      setFilteredCollections(filtered);
    }
  }, [debouncedSearchTerm, collections]);

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
      
      {/* Search box */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-500"
          />
          <button 
            onClick={() => setSearchTerm("")}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCollections.length > 0 ? (
          filteredCollections.map((collection) => (
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
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            No collections found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}
