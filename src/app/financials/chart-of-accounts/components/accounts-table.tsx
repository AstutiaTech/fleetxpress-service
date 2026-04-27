"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, MoreVertical, Trash2 } from "lucide-react"

import { Account } from "@/types/financialsTypes"
import { ApiService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { formatPrice } from "@/handlers/formatters"
import { toastUtils } from "@/utils/toast-utils"

interface AccountsTableProps {
    accounts: Account[]
    loading: boolean
    onEdit: (account: Account) => void
    page?: number
    onPageChange?: (page: number) => void
    rowsPerPage?: number
    onRowsPerPageChange?: (rows: number) => void
    totalRows?: number
    onRefresh?: () => void
}

export function AccountsTable({ 
    accounts, 
    loading, 
    onEdit,
    page,
    onPageChange,
    rowsPerPage,
    onRowsPerPageChange,
    totalRows,
    onRefresh,
}: AccountsTableProps) {
    const handleDelete = async (account: Account) => {
        if (confirm(`Are you sure you want to delete account ${account.accountCode} - ${account.accountName}?`)) {
            try {
                const response = await ApiService.deleteAccount(account.id)
                if (response.status) {
                    toastUtils.success("Deleted", "Account deleted successfully.")
                    onRefresh?.()
                } else {
                    toastUtils.error("Delete Failed", response.message || "Failed to delete account.")
                }
            } catch (error) {
                console.error("Failed to delete account:", error)
                toastUtils.error("Delete Failed", "An error occurred while deleting the account.")
            }
        }
    }


    const columns: CustomTableColumn<Account>[] = [
        {
            header: "Code",
            accessor: "accountCode" as keyof Account,
            sortable: true,
            className: "font-medium",
        },
        {
            header: "Name",
            accessor: "accountName" as keyof Account,
            sortable: true,
        },
        {
            header: "Type",
            cell: (row: Account) => (
                <Badge variant="outline">{row.accountType}</Badge>
            ),
        },
        {
            header: "Category",
            cell: (row: Account) => (
                <Badge variant="secondary">{row.accountCategory}</Badge>
            ),
        },
        {
            header: "Opening Balance",
            cell: (row: Account) => {
                const balance = parseFloat(row.openingBalance || "0")
                return (
                    <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatPrice(balance)}
                    </span>
                )
            },
        },
        {
            header: "Status",
            cell: (row: Account) => (
                <Badge variant={row.status === 1 ? "default" : "secondary"}>
                    {row.status === 1 ? "Active" : "Inactive"}
                </Badge>
            ),
        },
        {
            header: "Actions",
            cell: (row: Account) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(row)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => handleDelete(row)}
                            className="text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
            data={accounts}
            usePagination={!!onPageChange}
            page={page}
            onPageChange={onPageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            totalRows={totalRows}
            exportOptions={{
                title: "Chart of Accounts",
                file_name: "chart-of-accounts",
                header_title: "Chart of Accounts",
            }}
            hasExport={true}
            enableSorting={true}
        />
    )
}

