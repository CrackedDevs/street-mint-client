"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BatchListing,
  Collectible,
  getBatchListingById,
  getCollectiblesAndOrdersByBatchListingId,
} from "@/lib/supabaseClient";
import { CheckCircle, Circle, Search, XCircle } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BatchPage() {
  const { id: batchId } = useParams();
  const [batchListing, setBatchListing] = useState<BatchListing | null>(null);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [allDays, setAllDays] = useState<Date[]>([]);

  useEffect(() => {
    async function fetchData() {
      const batchListing = await getBatchListingById(Number(batchId));
      setBatchListing(batchListing || null);

      const result = await getCollectiblesAndOrdersByBatchListingId(Number(batchId));
      if (result) {
        setCollectibles(result.collectibles || []);
        setOrders(result.orders || []);
      }

      // Generate all days based on batch_start_date and batch_end_date
      if (batchListing?.batch_start_date && batchListing?.batch_end_date) {
        const startDate = new Date(batchListing.batch_start_date);
        const endDate = new Date(batchListing.batch_end_date);
        const days = [];

        let currentDate = new Date(startDate);

        // Add all days from start date to end date
        while (currentDate <= endDate) {
          days.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        setAllDays(days);
      }
    }

    fetchData();
  }, [batchId, collectibles.length]);

  const handleSearch = () => {
    const filtered = searchQuery
      ? orders.filter((order) =>
        order.wallet_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : [];

    setFilteredOrders(filtered);
    setHasSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 w-full">
      <div className="max-w-7xl mx-auto">
        <div>
          <span className="text-xs -mb-4">Batch Listing Name</span>
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            {batchListing?.name}
          </h1>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by wallet address or email"
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8 rounded-lg">
            <Search className="h-20 w-20 text-gray-300 mb-4" />
            <h1 className="text-2xl font-medium text-gray-600 mb-2">No Search Results Yet</h1>
            <p className="text-gray-500 max-w-md text-lg">
              Enter a wallet address or email above and click Search to view collected items.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" /> Collected Items
            </h2>
            <div className="flex justify-center mb-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {allDays.map((day, index) => {
                  // Find collectible for this day
                  const dayStr = day.toISOString().split('T')[0];
                  const collectible = collectibles.find(c =>
                    c.mint_start_date && new Date(c.mint_start_date).toISOString().split('T')[0] === dayStr
                  );

                  let isCollected = false;

                  if (collectible) {
                    const order = filteredOrders.find(o => o.collectible_id === collectible.id);

                    if (order && batchListing?.is_light_version) {
                      isCollected = order.status === "pending" || order.status === "completed";
                    } else if (order && !batchListing?.is_light_version) {
                      isCollected = order.status === "completed";
                    }
                  }

                  const isFutureDate = day > new Date();

                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden border border-gray-300 bg-gray-50">
                        {isCollected ? (
                          <Image
                            src={collectible?.primary_image_url || "/placeholder.png"}
                            alt={collectible?.name || "Collectible"}
                            width={128}
                            height={128}
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
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}