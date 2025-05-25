"use client";

import { Input } from "@/components/ui/input";
import {
  BatchListing,
  Collectible,
  getBatchListingById,
  getCollectiblesAndOrdersByBatchListingId,
} from "@/lib/supabaseClient";
import { CheckCircle, Circle, Search, XCircle } from "lucide-react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function BatchPage() {
  const { id: batchId } = useParams();
  // const batchId = 7030604016;
  
  const searchParams = useSearchParams();
  const [batchListing, setBatchListing] = useState<BatchListing | null>(null);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [allDays, setAllDays] = useState<{ date: Date; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  useEffect(() => {
    // Change logic
    async function fetchData() {
      setIsLoading(true);
      const batchListing = await getBatchListingById(Number(batchId));
      setBatchListing(batchListing || null);

      const result = await getCollectiblesAndOrdersByBatchListingId(
        Number(batchId)
      );
      if (result) {
        setCollectibles(result.collectibles || []);
        setOrders(result.orders || []);
      }

      // Generate days based on frequency type
      if (batchListing?.batch_start_date && batchListing?.batch_end_date) {
        const startDate = new Date(batchListing.batch_start_date);
        const endDate = new Date(batchListing.batch_end_date);
        const frequencyType = batchListing.frequency_type || 'daily';
        const frequencyDays = batchListing.frequency_days || [];
        
        let days: { date: Date; label: string }[] = [];

        if (frequencyType === 'daily') {
          // Add all days from start date to end date
          let currentDate = new Date(startDate);
          let dayCount = 1;

          while (currentDate <= endDate) {
            days.push({
              date: new Date(currentDate),
              label: `Day ${dayCount}`
            });
            currentDate.setDate(currentDate.getDate() + 1);
            dayCount++;
          }
        } 
        else if (frequencyType === 'weekly') {
          // Add only specified days of the week
          const dayNames = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat'];
          const daysToInclude = frequencyDays.map(Number);
          
          let currentDate = new Date(startDate);
          let weekCount = 1;

          while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            if (daysToInclude.includes(dayOfWeek)) {
              days.push({
                date: new Date(currentDate),
                label: `Week ${weekCount} - ${dayNames[dayOfWeek]}`
              });
            }
            
            // If we're moving to the next week
            if (dayOfWeek === 6) { // Saturday
              weekCount++;
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } 
        else if (frequencyType === 'monthly') {
          // Add specified days of each month
          const daysOfMonth = frequencyDays.map(Number);
          
          let currentDate = new Date(startDate);
          let monthCount = 1;
          const startMonth = currentDate.getMonth();
          
          while (currentDate <= endDate) {
            const dayOfMonth = currentDate.getDate();
            
            if (daysOfMonth.includes(dayOfMonth)) {
              const month = currentDate.toLocaleString('default', { month: 'short' });
              days.push({
                date: new Date(currentDate),
                label: `Month ${monthCount} - ${month} ${dayOfMonth}`
              });
            }
            
            // If we're moving to the next month
            const nextDate = new Date(currentDate);
            nextDate.setDate(currentDate.getDate() + 1);
            
            if (nextDate.getMonth() !== currentDate.getMonth()) {
              monthCount++;
            }
            
            currentDate = nextDate;
          }
        }

        setAllDays(days);
      }
      setIsLoading(false);
    }

    fetchData();
  }, [batchId, collectibles.length]);

  // Auto search if query is provided in URL
  useEffect(() => {
    if (searchQuery && orders.length > 0 && !hasSearched) {
      handleSearch();
    }
  }, [searchQuery, orders]);

  const handleSearch = useCallback(() => {
    // Change logic
    const filtered = searchQuery
      ? orders.filter(
          (order) =>
            order.wallet_address?.toLowerCase() === searchQuery.toLowerCase() ||
            order.email?.toLowerCase() === searchQuery.toLowerCase()
        )
      : [];

    setFilteredOrders(filtered);
    setHasSearched(true);
  }, [searchQuery, orders]);

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
      style={{ backgroundColor: batchListing?.bg_color || "white" }}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-gray-400 border-t-[#2d3648] rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading loyalty card...</p>
        </div>
      ) : (
        <div className="w-full max-w-4xl flex flex-col items-center text-center">
          {/* Logo Field */}
          <div className="mb-8">
            <Image
              src={batchListing?.logo_image || "/placeholder.png"}
              alt="Logo"
              width={100}
              height={100}
              className="mx-auto"
            />
          </div>

          {/* Title Field */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{batchListing?.name}</h1>
          </div>

          {/* Description Field */}
          <div className="mb-10">
            <p className="text-base">{batchListing?.description}</p>
          </div>

          {/* Email/Wallet Input */}
          <div className="w-full mb-12">
            <div className="relative w-full">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter email or wallet"
                className="w-full border-2 border-black h-12 pr-12"
              />
              <button 
                onClick={handleSearch}
                className="absolute right-0 top-0 h-12 px-6 flex items-center justify-center bg-[#2d3648] text-white rounded-r-md"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Loyalty Card */}
          <div className="w-full mb-16">
            <div className="w-full bg-[#e9e5dc] p-6 pb-12 rounded-lg">
              <h2 className="text-2xl font-bold mb-12 mt-4 text-center">
                LOYALTY CARD
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {allDays.map((item, index) => {
                  // Find collectible for this day
                  const dayStr = item.date.toISOString().split("T")[0];
                  const collectible = collectibles.find(
                    (c) =>
                      c.mint_start_date &&
                      new Date(c.mint_start_date)
                        .toISOString()
                        .split("T")[0] === dayStr
                  );

                  let isCollected = false;

                  if (collectible) {
                    const order = filteredOrders.find(
                      (o) => o.collectible_id === collectible.id
                    );

                    if (order && batchListing?.is_light_version) {
                      isCollected =
                        order.status === "pending" ||
                        order.status === "completed";
                    } else if (order && !batchListing?.is_light_version) {
                      isCollected = order.status === "completed";
                    }
                  }

                  const isFutureDate = item.date > new Date();

                  return (
                    <div key={index} className="flex flex-col items-center">
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
                            {isFutureDate ? (
                              <Circle className="h-8 w-8 text-gray-300" />
                            ) : (
                              <XCircle className="h-8 w-8 text-gray-300" />
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-black font-semibold mt-2">
                        {item.label}
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
