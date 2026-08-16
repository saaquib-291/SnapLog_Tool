import React, { useState } from "react";
import { Badge } from "./ui/table-20-utils/badge";
import { Button } from "./ui/table-20-utils/button";
import { Checkbox } from "./ui/table-20-utils/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/table-20-utils/dropdown-menu";
import { Input } from "./ui/table-20-utils/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table-20-utils/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown as ArrowUpDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MoreHorizontal as MoreHorizontalIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Copy,
  FileCheck,
  Download,
  Eye,
  Hash
} from "lucide-react";
import "./ui/table-20-utils/table-styles.css";

const forensicEvidenceData = [
  {
    id: "SCR-2026-001",
    caseId: "CASE2026-001",
    platform: "Instagram",
    section: "Timeline / Profile Info",
    fileName: "instagram_timeline_001_20260816T143000.png",
    hash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    timestamp: "2026-08-16 14:30:15",
    examiner: "EXAM_402",
    size: "2.4 MB",
    status: "verified",
  },
  {
    id: "SCR-2026-002",
    caseId: "CASE2026-001",
    platform: "Instagram",
    section: "Followers Modal List",
    fileName: "instagram_followers_002_20260816T143045.png",
    hash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    timestamp: "2026-08-16 14:30:45",
    examiner: "EXAM_402",
    size: "3.1 MB",
    status: "verified",
  },
  {
    id: "SCR-2026-003",
    caseId: "CASE2026-001",
    platform: "Instagram",
    section: "Direct Message Thread",
    fileName: "instagram_messages_003_20260816T143120.png",
    hash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    timestamp: "2026-08-16 14:31:20",
    examiner: "EXAM_402",
    size: "1.8 MB",
    status: "verified",
  },
  {
    id: "SCR-2026-004",
    caseId: "CASE2026-002",
    platform: "WhatsApp Web",
    section: "Suspect Encrypted Chat",
    fileName: "whatsapp_messages_001_20260816T151010.png",
    hash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    timestamp: "2026-08-16 15:10:10",
    examiner: "EXAM_402",
    size: "2.9 MB",
    status: "verified",
  },
  {
    id: "SCR-2026-005",
    caseId: "CASE2026-002",
    platform: "WhatsApp Web",
    section: "Group Info & Member IDs",
    fileName: "whatsapp_account_info_002_20260816T151105.png",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    timestamp: "2026-08-16 15:11:05",
    examiner: "EXAM_402",
    size: "1.5 MB",
    status: "verified",
  },
  {
    id: "SCR-2026-006",
    caseId: "CASE2026-002",
    platform: "Twitter / X",
    section: "Public Posts & Replies",
    fileName: "twitter_timeline_001_20260816T154522.png",
    hash: "872f604904f4e4e9b97423d74c932ff34d3029e793023da6b4d263b22ec68378",
    timestamp: "2026-08-16 15:45:22",
    examiner: "EXAM_108",
    size: "3.7 MB",
    status: "verified",
  },
  {
    id: "SCR-2026-007",
    caseId: "CASE2026-003",
    platform: "Telegram Web",
    section: "Broadcast Channel Archive",
    fileName: "telegram_messages_001_20260816T162000.png",
    hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    timestamp: "2026-08-16 16:20:00",
    examiner: "EXAM_108",
    size: "4.2 MB",
    status: "verified",
  },
  {
    id: "SCR-2026-008",
    caseId: "CASE2026-003",
    platform: "Google History",
    section: "Search & Location Activity",
    fileName: "google_timeline_001_20260816T165512.png",
    hash: "7d1a54127b222502f5b79b5fb0803061152a44f92b37e23c65dd0e336d10e77f",
    timestamp: "2026-08-16 16:55:12",
    examiner: "EXAM_402",
    size: "2.1 MB",
    status: "verified",
  },
];

const platformColors = {
  Instagram: "#E4405F",
  "WhatsApp Web": "#25D366",
  "Twitter / X": "#0f172a",
  "Telegram Web": "#0088CC",
  Facebook: "#1877F2",
  "Google History": "#EA4335",
};

const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) =>
          table.toggleAllPageRowsSelected(value === true)
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(value === true)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        style={{ marginLeft: "-0.5rem" }}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Artifact ID</span>
        <ArrowUpDownIcon size={13} style={{ marginLeft: "4px" }} />
      </Button>
    ),
    cell: ({ row }) => (
      <span style={{ fontWeight: 600, fontFamily: "monospace", color: "#0f172a" }}>
        {row.getValue("id")}
      </span>
    ),
  },
  {
    accessorKey: "caseId",
    header: "Case ID",
    cell: ({ row }) => (
      <span style={{ fontSize: "0.75rem", fontFamily: "monospace", padding: "0.15rem 0.4rem", background: "#f1f5f9", borderRadius: "4px" }}>
        {row.getValue("caseId")}
      </span>
    ),
  },
  {
    accessorKey: "platform",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        style={{ marginLeft: "-0.5rem" }}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Platform</span>
        <ArrowUpDownIcon size={13} style={{ marginLeft: "4px" }} />
      </Button>
    ),
    cell: ({ row }) => {
      const platform = row.getValue("platform");
      const dotColor = platformColors[platform] || "#64748b";
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 500 }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: dotColor }}></span>
          <span>{platform}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "section",
    header: "Section Captured",
    cell: ({ row }) => (
      <Badge variant="secondary" style={{ fontWeight: 500, fontSize: "0.75rem" }}>
        {row.getValue("section")}
      </Badge>
    ),
  },
  {
    accessorKey: "hash",
    header: "SHA-256 Checksum",
    cell: ({ row }) => {
      const hash = row.getValue("hash");
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#334155" }}>
            {hash.slice(0, 10)}...{hash.slice(-8)}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(hash);
              alert("SHA-256 Hash copied to clipboard:\n" + hash);
            }}
            title="Copy full SHA-256 hash"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "2px" }}
          >
            <Copy size={12} />
          </button>
        </div>
      );
    },
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        style={{ marginLeft: "-0.5rem" }}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>Timestamp</span>
        <ArrowUpDownIcon size={13} style={{ marginLeft: "4px" }} />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
        {row.getValue("timestamp")}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Integrity",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#10b981", fontSize: "0.75rem", fontWeight: 600 }}>
          <CheckCircle2 size={13} />
          <span>Verified</span>
        </span>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <div style={{ textAlign: "right" }}>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" style={{ width: "2rem", height: "2rem" }}>
                <MoreHorizontalIcon size={15} />
                <span style={{ display: "none" }}>Open menu</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Forensic Actions</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(row.original.hash);
                alert("Copied SHA-256 Hash:\n" + row.original.hash);
              }}
            >
              <Copy size={13} style={{ marginRight: "6px" }} />
              Copy SHA-256 Hash
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                alert(`Artifact: ${row.original.id}\nFile: ${row.original.fileName}\nSize: ${row.original.size}\nExaminer: ${row.original.examiner}\nTimestamp: ${row.original.timestamp}`);
              }}
            >
              <Eye size={13} style={{ marginRight: "6px" }} />
              View Capture Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                alert(`Section 65B Authenticity Certificate generated for Artifact: ${row.original.id}`);
              }}
            >
              <FileCheck size={13} style={{ marginRight: "6px" }} />
              Export 65B Certificate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

export function Table20({ customData }) {
  const [data] = useState(customData || forensicEvidenceData);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 6 } },
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div style={{ width: "100%" }}>
      {/* Toolbar */}
      <div className="table-toolbar" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <Input
          placeholder="Filter by platform (e.g. Instagram, WhatsApp)..."
          value={table.getColumn("platform")?.getFilterValue() ?? ""}
          onChange={(event) =>
            table.getColumn("platform")?.setFilterValue(event.target.value)
          }
          style={{ maxWidth: "20rem" }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
          {selectedCount > 0 && (
            <Button
              size="sm"
              onClick={() =>
                alert(`Exporting ${selectedCount} selected screenshot artifacts into a Panchnama PDF Annexure!`)
              }
              style={{ gap: "0.375rem", background: "#2563eb", borderColor: "#2563eb" }}
            >
              <Download size={14} />
              <span>Compile {selectedCount} to PDF</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <SlidersHorizontalIcon size={14} style={{ marginRight: "6px" }} />
                  Columns
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    closeOnClick={false}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Container */}
      <div className="ui-table-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground"
                  style={{ height: "5rem", textAlign: "center" }}
                >
                  No matching forensic artifacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination & Selection Count */}
      <div className="table-pagination">
        <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} artifact(s) selected.
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeftIcon size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Table20;
