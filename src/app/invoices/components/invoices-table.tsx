"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Download, Eye, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Invoice } from "@/types/invoiceTypes"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { generateInvoicePDF } from "@/utils/invoice-pdf"
import { observer } from "mobx-react-lite"
import { useRouter } from "next/navigation"
import { useStore } from "@/providers/store.provider"

export const InvoicesTable = observer(() => {
    const { invoiceStore } = useStore()
    const router = useRouter()
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null)

    useEffect(() => {
        invoiceStore.fetchAllInvoices({ page: 1, limit: 10 })
    }, [invoiceStore])

    const invoices = invoiceStore.invoices
    const pagination = invoiceStore.pagination

    const handleViewInvoice = (invoiceId: string) => {
        // TODO: Navigate to invoice detail page when created
        router.push(`/invoices/${invoiceId}`)
    }

    const handleDownloadInvoice = async (invoice: Invoice) => {
        setDownloadingInvoiceId(invoice.id)
        try {
            // Fetch full invoice details if needed
            const result = await invoiceStore.fetchInvoiceById(invoice.id)
            if (result.success && invoiceStore.currentInvoice) {
                const fullInvoice = invoiceStore.currentInvoice
                // TODO: Fetch customer details if needed
                const pdf = generateInvoicePDF(fullInvoice)
                pdf.save(`invoice-${fullInvoice.invoiceNumber}-${format(new Date(), "yyyy-MM-dd")}.pdf`)
            } else {
                // Fallback to using the invoice from the list
                const pdf = generateInvoicePDF(invoice)
                pdf.save(`invoice-${invoice.invoiceNumber}-${format(new Date(), "yyyy-MM-dd")}.pdf`)
            }
        } catch (error) {
            console.error("Failed to download invoice:", error)
            // Fallback to using the invoice from the list
            const pdf = generateInvoicePDF(invoice)
            pdf.save(`invoice-${invoice.invoiceNumber}-${format(new Date(), "yyyy-MM-dd")}.pdf`)
        } finally {
            setDownloadingInvoiceId(null)
        }
    }

    const columns: CustomTableColumn<Invoice>[] = [
        {
            header: "Invoice Number",
            accessor: "invoiceNumber" as keyof Invoice,
            sortable: true,
            className: "font-medium",
        },
        {
            header: "Customer",
            cell: (row: Invoice) => {
                // TODO: Fetch customer name from customerId when customer store is available
                return <div className="font-medium">Customer {row.customerId}</div>
            },
        },
        {
            header: "Invoice Date",
            cell: (row: Invoice) => format(new Date(row.invoiceDate), "MMM dd, yyyy"),
            sortable: true,
        },
        {
            header: "Due Date",
            cell: (row: Invoice) => format(new Date(row.dueDate), "MMM dd, yyyy"),
            sortable: true,
        },
        {
            header: "Total",
            cell: (row: Invoice) => formatPrice(row.totalAmount),
            sortable: true,
        },
        {
            header: "Status",
            cell: (row: Invoice) => {
                const status = row.status || (new Date(row.dueDate) < new Date() && row.totalAmount > 0 ? "OVERDUE" : "SENT")
                const getBadgeVariant = (status: string) => {
                    switch (status) {
                        case "PAID":
                            return "default"
                        case "OVERDUE":
                        case "CANCELLED":
                            return "destructive"
                        case "DRAFT":
                            return "secondary"
                        case "PARTIAL":
                            return "outline"
                        default:
                            return "secondary"
                    }
                }
                const getStatusLabel = (status: string) => {
                    switch (status) {
                        case "DRAFT":
                            return "Draft"
                        case "SENT":
                            return "Sent"
                        case "VIEWED":
                            return "Viewed"
                        case "PARTIAL":
                            return "Partial"
                        case "PAID":
                            return "Paid"
                        case "OVERDUE":
                            return "Overdue"
                        case "CANCELLED":
                            return "Cancelled"
                        default:
                            return status
                    }
                }
                return (
                    <Badge variant={getBadgeVariant(status)}>
                        {getStatusLabel(status)}
                    </Badge>
                )
            },
        },
        {
            header: "Actions",
            cell: (row: Invoice) => {
                const isDownloading = downloadingInvoiceId === row.id
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewInvoice(row.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => handleDownloadInvoice(row)}
                                disabled={isDownloading}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {isDownloading ? "Downloading..." : "Download"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    return (
        <div className="mt-4 w-full">
            <CustomTable
                columns={columns}
                data={invoices}
                enableSorting={true}
                usePagination={true}
                page={pagination.page}
                onPageChange={(page: number) => {
                    invoiceStore.setPage(page)
                    invoiceStore.fetchAllInvoices({ page, limit: pagination.limit })
                }}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={(limit: number) => {
                    invoiceStore.setPageLimit(limit)
                    invoiceStore.fetchAllInvoices({ page: 1, limit })
                }}
                totalRows={pagination.total}
                hasExport={true}
                exportOptions={{
                    title: "Invoices Report",
                    file_name: "invoices",
                    header_title: "All Invoices",
                    exportFormat: "excel-only",
                }}
                emptyContent={
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No invoices found.</p>
                    </div>
                }
            />
        </div>
    )
})

