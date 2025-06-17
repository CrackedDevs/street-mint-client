"use client";

import { Input } from "@/components/ui/input";
import {
  Collectible,
  Stampbook,
  getStampbookWithCollectibles,
  searchOrdersByEmailOrWallet,
  LightOrder,
  RegularOrder,
} from "@/lib/supabaseClient";
import { Circle, Search, XCircle } from "lucide-react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function StampbookPage() {
  const { id: stampbookId } = useParams();
  const searchParams = useSearchParams();
  const [stampbook, setStampbook] = useState<Stampbook | null>(null);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<(LightOrder | RegularOrder)[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isLightVersion, setIsLightVersion] = useState(false);

  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Get stampbook and collectibles data
        const { stampbook: stampbookData, collectibles: collectiblesData } = 
          await getStampbookWithCollectibles(Number(stampbookId));
        
        setStampbook(stampbookData);
        
        // Sort collectibles based on sorting_method
        let sortedCollectibles = [...collectiblesData];
        if (stampbookData?.sorting_method === "latest") {
          // Sort by latest mint_end_date
          sortedCollectibles.sort((a, b) => {
            const dateA = a.mint_end_date ? new Date(a.mint_end_date).getTime() : 0;
            const dateB = b.mint_end_date ? new Date(b.mint_end_date).getTime() : 0;
            return dateB - dateA; // Latest first
          });
        } else {
          // For "selection" method, keep the array pattern ordering as is
          // The order is already maintained by the collectibles array from the stampbook
          sortedCollectibles = collectiblesData;
        }
        
        setCollectibles(sortedCollectibles);
        
        // Check if all collectibles are light version
        const allLightVersion = sortedCollectibles.every(c => c.is_light_version);
        setIsLightVersion(allLightVersion);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [stampbookId]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !collectibles.length) {
      setFilteredOrders([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      const collectibleIds = collectibles.map(c => c.id);
      const orders = await searchOrdersByEmailOrWallet(searchQuery.trim(), collectibleIds, isLightVersion);
      setFilteredOrders(orders);
      setHasSearched(true);
    } catch (error) {
      console.error("Error searching orders:", error);
      setFilteredOrders([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, collectibles, isLightVersion]);

  // Debounced search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else {
        setFilteredOrders([]);
        setHasSearched(false);
      }
    }, 2000);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, handleSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-start py-10 px-4"
      style={{ backgroundColor: stampbook?.bg_color || "white" }}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-gray-400 border-t-[#2d3648] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading stampbook...</p>
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col items-center text-center">
          {/* Logo Field */}
          <div className="mb-8">
            <Image
              src={stampbook?.logo_image || "/placeholder.png"}
              alt="Logo"
              width={100}
              height={100}
              className="mx-auto"
            />
          </div>

          {/* Title Field */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{stampbook?.name}</h1>
          </div>

          {/* Description Field */}
          <div className="mb-10">
            <p className="text-base whitespace-pre-wrap">{stampbook?.description}</p>
          </div>

          {/* Email/Wallet Input */}
          <div className="w-full mb-12">
            <div className="relative w-full">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLightVersion ? "Enter email" : "Enter email or wallet"}
                className="w-full border-2 border-black h-12 pr-12"
                disabled={isSearching}
              />
              <button 
                onClick={handleSearch}
                className="absolute right-0 top-0 h-12 px-6 flex items-center justify-center bg-[#2d3648] text-white rounded-r-md"
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Loyalty Card */}
          <div className="w-full mb-16">
            <div className="w-full bg-[#e9e5dc] p-6 pb-12 rounded-lg" style={{ backgroundColor: stampbook?.loyalty_bg_color || "#e9e5dc" }}>
              <h2 className="text-2xl font-bold mb-12 mt-4 text-center">
                {stampbook?.loyalty_card_title || "Solana Stampbook"}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {collectibles.map((collectible, index) => {
                  let isCollected = false;

                  const order = filteredOrders.find(
                    (o) => o.collectible_id === collectible.id
                  );

                  if (order && collectible.is_light_version) {
                    isCollected =
                      order.status === "pending" ||
                      order.status === "completed";
                  } else if (order && !collectible.is_light_version) {
                    isCollected = order.status === "completed";
                  }

                  const hasEnded = collectible.mint_end_date 
                    ? new Date(collectible.mint_end_date) < new Date() 
                    : false;

                  return (
                    <div 
                      key={index} 
                      className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(`/mint/${collectible.id}`, '_blank')}
                    >
                      <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border border-gray-300 bg-gray-50">
                        {isCollected ? (
                          <Image
                            src={
                              collectible?.primary_image_url ||
                              "/placeholder.png"
                            }
                            alt={collectible?.name || "Collectible"}
                            width={96}
                            height={96}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            {hasEnded ? (
                              <XCircle className="h-8 w-8 text-gray-300" />
                            ) : (
                              <Circle className="h-8 w-8 text-gray-300" />
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-black font-semibold mt-2">
                        {collectible.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Congratulations Message */}
          <div className="text-center mb-8">
            <p className="text-lg font-medium">
              Keep collecting to unlock special rewards! Every stamp brings you
              closer to exclusive benefits.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
