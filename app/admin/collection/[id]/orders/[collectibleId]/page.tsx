"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Collectible, supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SolanaFMService } from "@/lib/services/solanaExplorerService";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Papa from "papaparse";
import { Json } from "@/lib/types/database.types";

interface Order {
  id: string;
  mint_address: string | null;
  wallet_address: string | null;
  status: string | null;
  price_usd: number | null;
  transaction_signature: string | null;
  mint_signature: string | null;
  created_at: string | null;
  price_sol: number | null;
  quantity: number | null;
  updated_at: string | null;
  max_supply: number | null;
  collection_id: number | null;
  collectible_id: number | null;
  device_id: string | null;
  nft_type: string | null;
  airdrop_won: boolean;
  tiplink_url?: string | null;
  email?: string | null;
  email_sent?: boolean | null;
  cta_email?: string | null;
  cta_text?: string | null;
}

const STREETMINT_ADMIN_LINK = "https://www.streetmint.xyz/v1?signatureCode=";
const IRLS_ADMIN_LINK = "https://www.irls.xyz/v1?signatureCode=";

const formatAddress = (address: string | null) => {
  if (!address) return "N/A";
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

const useCountAnimation = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.min(Math.floor(end * progress), end));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
};

export default function CollectionOrders() {
  const router = useRouter();
  const { id: collectionId, collectibleId } = useParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLightVersion, setIsLightVersion] = useState<boolean>(false);
  const [collectible, setCollectible] = useState<Collectible | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    transaction_signature: false,
    mint_signature: false,
  });
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "wallet_address",
      header: "Wallet Address",
      cell: ({ row }) => {
        const address = row.getValue("wallet_address") as string;

        const copyToClipboard = () => {
          navigator.clipboard.writeText(address);
          toast({
            title: "Copied to clipboard",
          });
        };

        return (
          <div className="flex items-center space-x-2">
            <span>{formatAddress(address)}</span>
            <Button variant="ghost" size="icon" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const cellValue = row.getValue(id) as string | undefined;
        return cellValue?.toLowerCase().includes(value.toLowerCase()) ?? false;
      },
    },
    ...(isLightVersion
      ? [
          {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }: { row: Row<Order> }) => (
              <div>{row.getValue("email") || "N/A"}</div>
            ),
          },
        ]
      : []),
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        let status = row.getValue("status") as string;
        if (isLightVersion) {
          status =
            status === "pending"
              ? "Unclaimed"
              : status === "completed"
              ? "Claimed"
              : status ?? "N/A";
        }

        return <div className="capitalize">{status}</div>;
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const createdAt = new Date(row.original.created_at as string);
        const formattedDate = createdAt.toLocaleDateString("en-GB");

        return <div className="capitalize">{formattedDate}</div>;
      },
    },
    {
      accessorKey: "time",
      header: "Time",
      cell: ({ row }) => {
        const createdAt = new Date(row.original.created_at as string);
        const formattedTime = createdAt.toLocaleTimeString("en-GB");

        return <div className="capitalize">{formattedTime}</div>;
      },
    },
    {
      accessorKey: "airdrop_won",
      header: "Airdrop Won",
      cell: ({ row }) => (
        <div className="capitalize">
          {row.getValue("airdrop_won") ? "Yes" : "No"}
        </div>
      ),
    },
    {
      accessorKey: "transaction_signature",
      header: "Transaction",
      cell: ({ row }) => {
        const signature = row.getValue("transaction_signature") as string;
        return signature ? (
          <a
            href={SolanaFMService.getTransaction(signature)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View Transaction
          </a>
        ) : (
          "N/A"
        );
      },
    },
    {
      accessorKey: "mint_signature",
      header: "Mint",
      cell: ({ row }) => {
        const signature = row.getValue("mint_signature") as string;
        return signature ? (
          <a
            href={SolanaFMService.getTransaction(signature)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View Mint
          </a>
        ) : (
          "N/A"
        );
      },
    },
  ];

  const createAdminLink = async () => {
    const response = await fetch("/api/create_admin_link", {
      method: "POST",
      body: JSON.stringify({ collectibleId }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data);
      toast({
        title: "Admin Link Created and Copied to Clipboard",
        description: "Admin link created successfully and copied to clipboard",
      });

      navigator.clipboard.writeText(
        collectible?.is_irls
          ? IRLS_ADMIN_LINK + data.signatureCode
          : STREETMINT_ADMIN_LINK + data.signatureCode
      );
    } else {
      toast({
        title: "Error",
        description: "Failed to create admin link",
      });
    }
  };

  useEffect(() => {
    async function fetchCollectibleAndOrders() {
      if (collectibleId) {
        // First fetch the collectible to check is_light_version
        const { data: collectibleData, error: collectibleError } =
          await supabase
            .from("collectibles")
            .select("is_light_version, is_irls")
            .eq(
              "id",
              Array.isArray(collectibleId)
                ? Number(collectibleId[0])
                : Number(collectibleId)
            )
            .single();

        if (collectibleError) {
          console.error("Error fetching collectible:", collectibleError);
          return;
        }

        setCollectible(collectibleData as Collectible);
        setIsLightVersion(collectibleData.is_light_version);

        // Then fetch orders from the appropriate table
        const { data, error } = await supabase
          .from(collectibleData.is_light_version ? "light_orders" : "orders")
          .select("*")
          .eq("collectible_id", Number(collectibleId))
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching orders:", error);
        } else {
          setOrders(data || []);
        }
      }
    }
    fetchCollectibleAndOrders();
  }, [collectibleId]);

  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const exportToCSV = () => {
    const csvData = orders.map((order) => {
      let status = order.status;
      if (isLightVersion) {
        status =
          order.status === "pending"
            ? "Unclaimed"
            : order.status === "completed"
            ? "Claimed"
            : order.status ?? "N/A";
      }

      return {
        id: order.id,
        date: order.created_at
          ? new Date(order.created_at).toLocaleDateString("en-GB")
          : "N/A",
        time: order.created_at
          ? new Date(order.created_at).toLocaleTimeString("en-GB")
          : "N/A",
        wallet_address: order.wallet_address ?? "N/A",
        ...(isLightVersion && {
          email: order.email ?? "N/A",
          email_sent: order.email_sent ? "Yes" : "No",
        }),
        tiplink_url: order.tiplink_url ?? "N/A",
        status: status,
        transaction: order.transaction_signature
          ? SolanaFMService.getTransaction(order.transaction_signature)
          : "N/A",
        mint: order.mint_signature
          ? SolanaFMService.getTransaction(order.mint_signature)
          : "N/A",
        cta_email: order.cta_email ?? "N/A",
        cta_text: order.cta_text ?? "N/A",
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${isLightVersion ? "light-" : ""}orders-${collectibleId}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCtaData = () => {
    if (!collectible) {
      toast({
        title: "Error",
        description: "No collectible data available",
      });
      return;
    }

    const emailList = collectible.cta_email_list || [];
    const textList = collectible.cta_text_list || [];

    const csvData = {
      emails: emailList.map((entry) => {
        const obj = entry as { [key: string]: string };
        const [walletAddress, email] = Object.entries(obj)[0] || ["", ""];
        return { walletAddress, value: email };
      }),
      texts: textList.map((entry) => {
        const obj = entry as { [key: string]: string };
        const [walletAddress, text] = Object.entries(obj)[0] || ["", ""];
        return { walletAddress, value: text };
      }),
    };

    const csv = Papa.unparse({
      fields: [
        "Wallet Address",
        "Email Address",
        // "Wallet Address",
        "Text Response",
      ],
      data: Array.from(
        { length: Math.max(csvData.emails.length, csvData.texts.length) },
        (_, i) => [
          csvData.emails[i]?.walletAddress ||
            csvData.texts[i]?.walletAddress ||
            "",
          csvData.emails[i]?.value || "",
          // csvData.texts[i]?.walletAddress || "",
          csvData.texts[i]?.value || "",
        ]
      ),
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cta-data-collectible-${collectibleId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate order statistics
  const totalOrders = orders.length;
  const successfulOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;
  const failedOrders = orders.filter(
    (order) => order.status === "failed"
  ).length;
  const successfulPercentage = totalOrders
    ? ((successfulOrders / totalOrders) * 100).toFixed(2)
    : 0;
  const failedPercentage = totalOrders
    ? ((failedOrders / totalOrders) * 100).toFixed(2)
    : 0;

  // Add these animated counts
  const animatedTotal = useCountAnimation(totalOrders);
  const animatedSuccessful = useCountAnimation(successfulOrders);
  const animatedFailed = useCountAnimation(failedOrders);

  return (
    <div className="p-4 md:p-8">
      <Toaster />

      {/* Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg border border-gray-100 transition-all hover:shadow-xl">
          <div className="flex flex-col items-center">
            <h2 className="text-gray-600 text-base md:text-lg font-semibold mb-2">
              Total Orders
            </h2>
            <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
              {animatedTotal}
            </div>
            <div className="text-xs md:text-sm text-gray-500">All time orders</div>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg border border-green-100 transition-all hover:shadow-xl">
          <div className="flex flex-col items-center">
            <h2 className="text-gray-600 text-base md:text-lg font-semibold mb-2">
              Successful Orders
            </h2>
            <div className="text-3xl md:text-4xl font-bold text-green-600 mb-1">
              {animatedSuccessful}
            </div>
            <div className="flex items-center space-x-1">
              <div className="text-xs md:text-sm font-medium text-green-600">
                {successfulPercentage}%
              </div>
              <div className="text-xs md:text-sm text-gray-500">success rate</div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg border border-red-100 transition-all hover:shadow-xl sm:col-span-2 lg:col-span-1">
          <div className="flex flex-col items-center">
            <h2 className="text-gray-600 text-base md:text-lg font-semibold mb-2">
              Failed Orders
            </h2>
            <div className="text-3xl md:text-4xl font-bold text-red-600 mb-1">
              {animatedFailed}
            </div>
            <div className="flex items-center space-x-1">
              <div className="text-xs md:text-sm font-medium text-red-600">
                {failedPercentage}%
              </div>
              <div className="text-xs md:text-sm text-gray-500">failure rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => router.back()}
            className="flex items-center gap-2"
            size="sm"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <Button
            onClick={() => createAdminLink()}
            className="flex items-center text-sm md:text-md text-black gap-2 font-semibold bg-gray-100 hover:bg-gray-200"
            size="sm"
          >
            Create Admin Link
          </Button>
        </div>

        <h1 className="text-xl md:text-3xl font-bold text-center md:text-right my-2 md:my-0">
          {isLightVersion ? "Light" : ""} Orders for Collectible {collectibleId}
        </h1>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center py-2 md:py-4 gap-2 sm:gap-0">
        <Input
          placeholder="Filter by Order ID..."
          value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("id")?.setFilterValue(event.target.value)
          }
          className="w-full sm:max-w-sm mb-2 sm:mb-0 sm:mr-4"
        />
        <Input
          placeholder="Filter by Wallet Address..."
          value={
            (table.getColumn("wallet_address")?.getFilterValue() as string) ??
            ""
          }
          onChange={(event) =>
            table
              .getColumn("wallet_address")
              ?.setFilterValue(event.target.value)
          }
          className="w-full sm:max-w-sm mb-2 sm:mb-0"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-2 py-4">
        <div className="w-full sm:flex-1 text-xs sm:text-sm text-muted-foreground text-center sm:text-left mb-2 sm:mb-0">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="w-full sm:w-auto flex flex-wrap justify-center sm:justify-end gap-2 mb-2 sm:mb-0">
          <Button variant="outline" size="sm" onClick={() => exportToCSV()} className="w-full sm:w-auto">
            Export to CSV
          </Button>
          {/* <Button variant="outline" onClick={exportCtaData}>
            Export CTA Data
          </Button> */}
        </div>
        <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-xs sm:text-sm whitespace-nowrap">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
