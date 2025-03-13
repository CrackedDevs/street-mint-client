"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAdminSession } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAllRegularOrders,
  getAllLightOrders,
  LightOrder,
} from "@/lib/supabaseAdminClient";
import { Search, RefreshCw, Copy, Check } from "lucide-react";
import Link from "next/link";

// Generic order type that can represent both light and regular orders
type OrderWithDetails = {
  id: string;
  created_at: string | null;
  email?: string | null;
  wallet_address?: string | null;
  price_usd: number | null;
  status: string | null;
  collectible_id?: string; // Alternative field name
  collection_id?: string; // Alternative field name
  collectibles?: {
    id: string;
    name: string;
    primary_image_url: string;
    collection_id?: string; // Alternative field name
    collections?: {
      id: string;
      name: string;
    } | null;
  } | null;
  isLight?: boolean;
  cta_email?: string | null;
};

export default function OrdersPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { isLoggedIn } = await checkAdminSession();
      setIsLoggedIn(isLoggedIn);
      if (isLoggedIn) {
        fetchOrders();
      } else {
        router.push("/admin");
      }
      setIsLoading(false);
    };

    checkSession();
  }, [router]);

  const fetchOrders = async (resetPage = false) => {
    setIsLoading(true);
    try {
      const newPage = resetPage ? 0 : page;
      if (resetPage) {
        setPage(0);
      }

      // Fetch regular orders
      const { orders: regularOrders, total: regularTotal } =
        await getAllRegularOrders(newPage, 100, {});

      // Fetch light orders
      const { orders: lightOrdersData, total: lightTotal } =
        await getAllLightOrders(newPage, 100, {});

      // Mark light orders
      const lightOrders =
        lightOrdersData?.map((order: any) => ({
          ...order,
          isLight: true,
        })) || [];

      // Mark regular orders
      const markedRegularOrders =
        regularOrders?.map((order: any) => ({
          ...order,
          isLight: false,
        })) || [];

      // Combine and sort all orders by created_at in descending order
      const combinedOrders = [...markedRegularOrders, ...lightOrders].sort(
        (a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        }
      );

      if (combinedOrders) {
        if (resetPage) {
          setOrders(combinedOrders);
        } else {
          setOrders([...orders, ...combinedOrders]);
        }
        setTotalOrders((regularTotal || 0) + (lightTotal || 0));
        setHasMore(combinedOrders.length === 200); // 100 from each table
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleLoadMore = () => {
    setPage(page + 1);
    fetchOrders();
  };

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderTypeColor = (isLight: boolean | undefined) => {
    return isLight
      ? "bg-purple-100 text-purple-800"
      : "bg-blue-100 text-blue-800";
  };

  // Filter orders based on search query
  const filteredOrders = searchQuery
    ? orders.filter((order) => {
        const query = searchQuery.toLowerCase().trim();
        const email = order.email?.toLowerCase() || "";
        const walletAddress = order.wallet_address?.toLowerCase() || "";
        const id = order.id.toLowerCase();
        const collectibleName = order.collectibles?.name?.toLowerCase() || "";

        return (
          id.includes(query) ||
          email.includes(query) ||
          walletAddress.includes(query) ||
          collectibleName.includes(query)
        );
      })
    : orders;

  const handleCopyToClipboard = (text: string, orderId: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedOrderId(orderId);
        setTimeout(() => setCopiedOrderId(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const isEmailAddress = (text: string | null): boolean => {
    if (!text) return false;
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const truncateAddress = (address: string | null | undefined): string => {
    if (!address) return "N/A";
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by ID, email, collectible..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Collectible</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {order.id.slice(0, 6)}...{order.id.slice(-4)}
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <div
                        onClick={() =>
                          handleCopyToClipboard(
                            order.isLight
                              ? order.email || ""
                              : order.wallet_address || "",
                            order.id
                          )
                        }
                        className="flex items-center gap-1 cursor-pointer hover:text-blue-600 group relative"
                        title="Click to copy"
                      >
                        {order.isLight ? (
                          // Light orders: show email field
                          <span>{order.email || "N/A"}</span>
                        ) : // Regular orders
                        order.wallet_address &&
                          isEmailAddress(order.wallet_address) ? (
                          // If wallet_address is email, show full
                          <span>{order.wallet_address}</span>
                        ) : (
                          // If wallet_address is address, truncate and add tooltip
                          <span title={order.wallet_address || undefined}>
                            {truncateAddress(order.wallet_address)}
                          </span>
                        )}
                        {copiedOrderId === order.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{order.collectibles?.name || "N/A"}</TableCell>
                    <TableCell>
                      {order.price_usd
                        ? `$${order.price_usd.toFixed(2)}`
                        : "Free"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status
                          ? order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)
                          : "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderTypeColor(
                          order.isLight
                        )}`}
                      >
                        {order.isLight ? "Light" : "Standard"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium"
                        onClick={() => {
                          // Get collection and collectible IDs from wherever they exist in the data structure
                          const collectionId =
                            order.collectibles?.collections?.id ||
                            order.collectibles?.collection_id ||
                            order.collection_id ||
                            "";
                          const collectibleId =
                            order.collectibles?.id ||
                            order.collectible_id ||
                            "";

                          if (collectionId && collectibleId) {
                            router.push(
                              `/admin/collection/${collectionId}/orders/${collectibleId}`
                            );
                          } else {
                            console.error(
                              "Missing collection or collectible ID",
                              order
                            );
                          }
                        }}
                      >
                        View All
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {hasMore && orders.length > 0 && (
          <div className="mt-6 text-center">
            <Button
              onClick={handleLoadMore}
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
