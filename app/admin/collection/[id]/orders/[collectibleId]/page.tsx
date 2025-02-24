"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
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
  airdrop_won: boolean | null;
  tiplink_url: string | null;
}

const formatAddress = (address: string | null) => {
  if (!address) return "N/A";
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
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
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Timestamp",
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at") as string;
      const date = new Date(createdAt).toISOString();
      return (
        <div className="capitalize">{date.slice(0, 19).replace("T", " ")}</div>
      )
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

export default function CollectionOrders() {
  const router = useRouter();
  const { id: collectionId, collectibleId } = useParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    async function fetchOrders() {
      if (collectibleId) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("collectible_id", collectibleId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching orders:", error);
        } else {
          setOrders(data || []);
        }
      }
    }
    fetchOrders();
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
    const csvData = orders.map((order) => ({
      id: order.id,
      wallet_address: order.wallet_address ?? "N/A",
      tiplink_url: order.tiplink_url ?? "N/A",
      status: order.status ?? "N/A",
      transaction: order.transaction_signature
        ? SolanaFMService.getTransaction(order.transaction_signature)
        : "N/A",
      mint: order.mint_signature
        ? SolanaFMService.getTransaction(order.mint_signature)
        : "N/A",
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `orders-${collectibleId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8">
      <Toaster />
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <h1 className="text-3xl font-bold">
          Orders for Collectible {collectibleId}
        </h1>
      </div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by Order ID..."
          value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("id")?.setFilterValue(event.target.value)
          }
          className="max-w-sm mr-4"
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
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                    <TableCell key={cell.id}>
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <Button variant="outline" onClick={() => exportToCSV()}>
          Export to CSV
        </Button>
        <div className="space-x-2 flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span className="text-sm">
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
