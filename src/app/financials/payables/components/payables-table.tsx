"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Eye, MoreVertical, Edit, Trash2, DollarSign } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Payable } from "@/types/financialsTypes"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { observer } from "mobx-react-lite"
import { useRouter } from "next/navigation"
import { useStore } from "@/providers/store.provider"
import { RecordPayablePaymentModal } from "./record-payable-payment-modal"

interface PayablesTableProps {
    onEdit: (payable: Payable) => void
}

export const PayablesTable = observer(({ onEdit }: PayablesTableProps) => {
    const { payablesStore } = useStore()
    const router = useRouter()
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)
    const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null)

    useEffect(() => {
        payablesStore.fetchAllPayables({ page: 1, limit: 10 })
    }, [payablesStore])

    const payables = payablesStore.payables
    const pagination = payablesStore.pagination

    const handleView = (payable: Payable) => {
        router.push(`/financials/payables/${payable.id}`)
    }

    const handleRecordPayment = (payable: Payable) => {
        setSelectedPayable(payable)
        setPaymentModalOpen(true)
    }

    const handleDelete = async (payable: Payable) => {
        if (confirm(`Are you sure you want to delete bill ${payable.billNumber}?`)) {
            await payablesStore.deletePayable(payable.id)
            payablesStore.fetchAllPayables()
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

    const columns: CustomTableColumn<Payable>[] = [
        {
            header: "Bill Number",
            accessor: "billNumber" as keyof Payable,
            sortable: true,
            className: "font-medium",
        },
        {
            header: "Driver/Vendor",
            cell: (row: Payable) => {
                if (row.driver) {
                    return (
                        <div>
                            <div className="font-medium">{row.driver.name}</div>
                            <div className="text-sm text-muted-foreground">{row.driver.email}</div>
                        </div>
                    )
                }
                if (row.vendor) {
                    return (
                        <div>
                            <div className="font-medium">{row.vendor.name}</div>
                            <div className="text-sm text-muted-foreground">{row.vendor.email}</div>
                        </div>
                    )
                }
                return <div className="text-muted-foreground">N/A</div>
            },
        },
        {
            header: "Bill Date",
            cell: (row: Payable) => format(new Date(row.billDate), "MMM dd, yyyy"),
            sortable: true,
        },
        {
            header: "Due Date",
            cell: (row: Payable) => {
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
            cell: (row: Payable) => formatPrice(row.totalAmount),
            sortable: true,
        },
        {
            header: "Paid Amount",
            cell: (row: Payable) => formatPrice(row.paidAmount),
            sortable: true,
        },
        {
            header: "Balance",
            cell: (row: Payable) => {
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
            cell: (row: Payable) => getStatusBadge(row.status, row.dueDate, row.balance),
        },
        {
            header: "Actions",
            cell: (row: Payable) => (
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
                data={payables}
                usePagination={true}
                page={pagination.page}
                onPageChange={(page) => {
                    payablesStore.setPage(page)
                    payablesStore.fetchAllPayables({ page, limit: pagination.limit })
                }}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={(limit) => {
                    payablesStore.setPageLimit(limit)
                    payablesStore.fetchAllPayables({ page: 1, limit })
                }}
                totalRows={pagination.total}
                exportOptions={{
                    title: "Payables",
                    file_name: "payables",
                }}
                hasExport={true}
            />
            <RecordPayablePaymentModal
                open={paymentModalOpen}
                onOpenChange={setPaymentModalOpen}
                payable={selectedPayable}
                onSuccess={() => {
                    setPaymentModalOpen(false)
                    setSelectedPayable(null)
                    payablesStore.fetchAllPayables()
                }}
            />
        </>
    )
})

