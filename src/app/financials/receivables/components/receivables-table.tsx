"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Eye, MoreVertical, Edit, Trash2, DollarSign } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Receivable } from "@/types/financialsTypes"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { observer } from "mobx-react-lite"
import { useRouter } from "next/navigation"
import { useStore } from "@/providers/store.provider"
import { RecordPaymentModal } from "./record-payment-modal"

interface ReceivablesTableProps {
    onEdit: (receivable: Receivable) => void
}

export const ReceivablesTable = observer(({ onEdit }: ReceivablesTableProps) => {
    const { receivablesStore } = useStore()
    const router = useRouter()
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)

    useEffect(() => {
        receivablesStore.fetchAllReceivables({ page: 1, limit: 10 })
    }, [receivablesStore])

    const receivables = receivablesStore.receivables
    const pagination = receivablesStore.pagination

    const handleView = (receivable: Receivable) => {
        router.push(`/financials/receivables/${receivable.id}`)
    }

    const handleRecordPayment = (receivable: Receivable) => {
        setSelectedReceivable(receivable)
        setPaymentModalOpen(true)
    }

    const handleDelete = async (receivable: Receivable) => {
        if (confirm(`Are you sure you want to delete invoice ${receivable.invoiceNumber}?`)) {
            await receivablesStore.deleteReceivable(receivable.id)
            receivablesStore.fetchAllReceivables()
        }
    }

    const getStatusBadge = (status: string, dueDate: string, balance: number) => {
        const isOverdue = new Date(dueDate) < new Date() && balance > 0
        const displayStatus = isOverdue ? "OVERDUE" : status

        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            PAID: "default",
            PARTIAL: "secondary",
            PENDING: "outline",
            OVERDUE: "destructive",
            CANCELLED: "destructive",
        }

        return (
            <Badge variant={variants[displayStatus] || "outline"}>
                {displayStatus}
            </Badge>
        )
    }

    const columns: CustomTableColumn<Receivable>[] = [
        {
            header: "Invoice Number",
            accessor: "invoiceNumber" as keyof Receivable,
            sortable: true,
            className: "font-medium",
        },
        {
            header: "Customer",
            cell: (row: Receivable) => {
                const customer = row.customer
                return customer ? (
                    <div>
                        <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                    </div>
                ) : (
                    <div className="text-muted-foreground">N/A</div>
                )
            },
        },
        {
            header: "Invoice Date",
            cell: (row: Receivable) => format(new Date(row.invoiceDate), "MMM dd, yyyy"),
            sortable: true,
        },
        {
            header: "Due Date",
            cell: (row: Receivable) => {
                const isOverdue = new Date(row.dueDate) < new Date() && row.balance > 0
                return (
                    <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                        {format(new Date(row.dueDate), "MMM dd, yyyy")}
                    </span>
                )
            },
            sortable: true,
        },
        {
            header: "Total Amount",
            cell: (row: Receivable) => formatPrice(row.totalAmount),
            sortable: true,
        },
        {
            header: "Paid Amount",
            cell: (row: Receivable) => formatPrice(row.paidAmount),
            sortable: true,
        },
        {
            header: "Balance",
            cell: (row: Receivable) => {
                const isOverdue = new Date(row.dueDate) < new Date() && row.balance > 0
                return (
                    <span className={isOverdue ? "text-red-600 font-bold" : "font-medium"}>
                        {formatPrice(row.balance)}
                    </span>
                )
            },
            sortable: true,
        },
        {
            header: "Status",
            cell: (row: Receivable) => getStatusBadge(row.status, row.dueDate, row.balance),
        },
        {
            header: "Actions",
            cell: (row: Receivable) => (
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
                        {row.status !== "PAID" && row.status !== "CANCELLED" && (
                            <>
                                <DropdownMenuItem onClick={() => onEdit(row)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRecordPayment(row)}>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Record Payment
                                </DropdownMenuItem>
                            </>
                        )}
                        {row.status !== "PAID" && (
                            <DropdownMenuItem 
                                onClick={() => handleDelete(row)}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    return (
        <>
            <CustomTable
                columns={columns}
                data={receivables}
                usePagination={true}
                page={pagination.page}
                onPageChange={(page) => {
                    receivablesStore.setPage(page)
                    receivablesStore.fetchAllReceivables({ page, limit: pagination.limit })
                }}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={(limit) => {
                    receivablesStore.setPageLimit(limit)
                    receivablesStore.fetchAllReceivables({ page: 1, limit })
                }}
                totalRows={pagination.total}
                exportOptions={{
                    title: "Receivables",
                    file_name: "receivables",
                }}
                hasExport={true}
            />
            <RecordPaymentModal
                open={paymentModalOpen}
                onOpenChange={setPaymentModalOpen}
                receivable={selectedReceivable}
                onSuccess={() => {
                    setPaymentModalOpen(false)
                    setSelectedReceivable(null)
                    receivablesStore.fetchAllReceivables()
                }}
            />
        </>
    )
})

