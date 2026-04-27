"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Eye, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LedgerEntry } from "@/types/financialsTypes"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface LedgerTableProps {
    entries: LedgerEntry[]
    loading: boolean
}

export function LedgerTable({ entries, loading }: LedgerTableProps) {
    const router = useRouter()

    const handleView = (entry: LedgerEntry) => {
        router.push(`/financials/ledger/${entry.id}`)
    }

    const columns: CustomTableColumn<LedgerEntry>[] = [
        {
            header: "Entry Number",
            accessor: "entryNumber" as keyof LedgerEntry,
            sortable: true,
            className: "font-medium",
        },
        {
            header: "Transaction Date",
            cell: (row: LedgerEntry) => format(new Date(row.transactionDate), "MMM dd, yyyy"),
            sortable: true,
        },
        {
            header: "Description",
            accessor: "description" as keyof LedgerEntry,
        },
        {
            header: "Reference",
            cell: (row: LedgerEntry) => row.referenceNumber || "-",
        },
        {
            header: "Source",
            cell: (row: LedgerEntry) => (
                <Badge variant="outline">{row.source}</Badge>
            ),
        },
        {
            header: "Total Amount",
            cell: (row: LedgerEntry) => formatPrice(row.totalAmount),
            sortable: true,
        },
        {
            header: "Reversed",
            cell: (row: LedgerEntry) => (
                <Badge variant={row.isReversed ? "destructive" : "default"}>
                    {row.isReversed ? "Yes" : "No"}
                </Badge>
            ),
        },
        {
            header: "Actions",
            cell: (row: LedgerEntry) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(row)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <CustomTable
            columns={columns}
            data={entries}
            exportOptions={{
                title: "Ledger Entries",
                file_name: "ledger-entries",
            }}
            hasExport={true}
        />
    )
}

