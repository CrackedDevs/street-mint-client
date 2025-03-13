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
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  getAllOrders, 
  LightOrder 
} from "@/lib/supabaseAdminClient";
import { Search, RefreshCw, Download } from "lucide-react";

type OrderWithDetails = LightOrder & {
  collectibles?: {
    name: string;
    primary_image_url: string;
    collections?: {
      name: string;
    } | null;
  } | null;
};

export default function OrdersPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { isLoggedIn } = await checkAdminSession();
      setIsLoggedIn(isLoggedIn);
      if (isLoggedIn) {
        fetchOrders();
      } else {
        // Redirect to login page if not logged in
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

      const filters: { status?: string } = {};
      if (statusFilter) {
        filters.status = statusFilter;
      }

      const { orders: newOrders, total } = await getAllOrders(newPage, 20, filters);

      if (newOrders) {
        if (resetPage) {
          setOrders(newOrders);
        } else {
          setOrders([...orders, ...newOrders]);
        }
        setTotalOrders(total);
        setHasMore(newOrders.length === 20);
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

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? undefined : value);
    fetchOrders(true);
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

  // Filter orders based on search query
  const filteredOrders = searchQuery 
    ? orders.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.collectibles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.collectibles?.collections?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orders;

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
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
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
                placeholder="Search by ID, email, collectible or collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select 
              onValueChange={handleStatusFilterChange} 
              defaultValue="all"
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="md:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="text-sm text-gray-500 mb-4">
          Showing {filteredOrders.length} of {totalOrders} orders
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Collectible</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
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
                    <TableCell>{order.email}</TableCell>
                    <TableCell>{order.collectibles?.name || "N/A"}</TableCell>
                    <TableCell>{order.collectibles?.collections?.name || "N/A"}</TableCell>
                    <TableCell>
                      {order.price_usd ? `$${order.price_usd.toFixed(2)}` : "N/A"}
                    </TableCell>
                    <TableCell>{order.quantity || "N/A"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Unknown"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {isSearching ? "Searching..." : "No orders found"}
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