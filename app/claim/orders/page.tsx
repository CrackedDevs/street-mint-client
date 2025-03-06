"use client";

import { useState } from "react";
import { getLightOrdersByEmail } from "@/lib/supabaseAdminClient";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);

  const isIrlsDomain =
    typeof window !== "undefined" &&
    window.location.hostname === "www.irls.xyz";

  const fetchOrders = async (newSearch = false) => {
    setLoading(true);
    try {
      const emailToSearch = newSearch ? email : searchEmail;
      const pageToFetch = newSearch ? 0 : page;

      const { orders: newOrders, total } = await getLightOrdersByEmail(
        emailToSearch,
        pageToFetch
      );

      if (newOrders) {
        if (newSearch) {
          setOrders(newOrders);
          setSearchEmail(email);
          setPage(0);
        } else {
          setOrders([...orders, ...newOrders]);
        }
        setTotalOrders(total);
        setHasMore(newOrders.length === 20);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(true);
  };

  const handleLoadMore = () => {
    setPage(page + 1);
    fetchOrders();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="py-4 px-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex justify-center items-center w-full">
            <Image
              src={isIrlsDomain ? "/irlLogo.svg" : "/logo.svg"}
              alt={isIrlsDomain ? "IRLS logo" : "Street mint logo"}
              width={150}
              height={50}
              className="h-8 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-8 md:px-10 gap-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-10 text-center">
            Light Orders Search
          </h1>

          <form onSubmit={handleSearch} className="mb-10">
            <div className="flex gap-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email Address"
                className="w-1/3 h-12 py-3 px-4 border border-gray-600 rounded bg-white text-md text-black"
                required
              />
              <Button
                type="submit"
                className="w-1/7 h-12 bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </form>

          {searchEmail && (
            <p className="mb-6 text-gray-600">
              Showing results for: {searchEmail} ({totalOrders} orders found)
            </p>
          )}

          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border-gray-300 bg-white relative z-10"
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-gray-400">Order ID</p>
                    <p className="font-medium">
                      {order.id.slice(0, 6)}...{order.id.slice(-6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Status</p>
                    <p className="font-medium">
                      {order.status
                        ? order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Created At</p>
                    <p className="font-medium">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Collectible</p>
                    {order.collectible_id ? (
                      <p className="font-medium">
                        {order.collectibles?.name ||
                          `ID: ${order.collectible_id}`}
                      </p>
                    ) : (
                      <p className="font-medium">N/A</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-400">Price</p>
                    <p className="font-medium">
                      {order.price_usd
                        ? `$${order.price_usd.toFixed(2)}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Quantity</p>
                    <p className="font-medium">{order.quantity || "N/A"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && orders.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}

          {orders.length === 0 && searchEmail && (
            <div className="text-center text-gray-600 mt-8">
              No orders found for this email.
            </div>
          )}
        </div>
      </main>
      <DotPattern
        className={cn(
          "absolute inset-0 w-full h-full z-0 opacity-40",
          "[mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
        )}
      />
    </div>
  );
}
