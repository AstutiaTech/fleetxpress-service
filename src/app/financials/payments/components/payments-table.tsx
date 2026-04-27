"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Eye, Filter, MoreVertical, X } from "lucide-react"
import { PaymentMethod, PaymentStatus, PaymentTransaction, PaymentType } from "@/types/financialsTypes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PaymentMethodBadge } from "@/components/payments/payment-method-badge"
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge"
import { PaymentTypeBadge } from "@/components/payments/payment-type-badge"
import { UpdatePaymentStatusModal } from "./update-payment-status-modal"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { observer } from "mobx-react-lite"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useStore } from "@/providers/store.provider"

export const PaymentsTable = observer(() => {
    const { paymentsStore } = useStore()
    const router = useRouter()
    const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null)
    const [filters, setFilters] = useState({
        paymentType: "",
        status: "",
        paymentMethod: "",
        startDate: "",
        endDate: "",
        search: "",
    })

    const payments = paymentsStore.payments
    const pagination = paymentsStore.pagination

    const applyFilters = () => {
        const filterParams: any = { page: 1, limit: pagination.limit }
        if (filters.paymentType) filterParams.paymentType = filters.paymentType
        if (filters.status) filterParams.status = filters.status
        if (filters.paymentMethod) filterParams.paymentMethod = filters.paymentMethod
        if (filters.startDate) filterParams.startDate = filters.startDate
        if (filters.endDate) filterParams.endDate = filters.endDate
        if (filters.search) filterParams.search = filters.search

        paymentsStore.setPage(1)
        paymentsStore.fetchAllPayments(filterParams)
    }

    const handleView = (payment: PaymentTransaction) => {
        router.push(`/financials/payments/${payment.id}`)
    }

    const handleUpdateStatus = (payment: PaymentTransaction) => {
        setSelectedPayment(payment)
        setUpdateStatusModalOpen(true)
    }

    const columns: CustomTableColumn<PaymentTransaction>[] = [
        {
            header: "Reference",
            accessor: "transactionReference" as keyof PaymentTransaction,
            sortable: true,
            className: "font-medium",
        },
        {
            header: "Type",
            cell: (row: PaymentTransaction) => <PaymentTypeBadge type={row.paymentType} />,
        },
        {
            header: "Linked Invoice/Bill",
            cell: (row: PaymentTransaction) => {
                if (row.receivable) {
                    return (
                        <div 
                            className="font-medium cursor-pointer hover:underline text-primary"
                            onClick={() => router.push(`/financials/receivables/${row.receivable?.id}`)}
                        >
                            {row.receivable.invoiceNumber}
                        </div>
                    )
                }
                if (row.payable) {
                    return (
                        <div 
                            className="font-medium cursor-pointer hover:underline text-primary"
                            onClick={() => router.push(`/financials/payables/${row.payable?.id}`)}
                        >
                            {row.payable.billNumber}
                        </div>
                    )
                }
                return <div className="text-muted-foreground">N/A</div>
            },
        },
        {
            header: "Customer/Driver",
            cell: (row: PaymentTransaction) => {
                if (row.receivable?.customer) {
                    return <div>{row.receivable.customer.firstName} {row.receivable.customer.lastName}</div>
                }
                if (row.payable?.driver) {
                    return <div>{row.payable.driver.name}</div>
                }
                if (row.payable?.vendor) {
                    return <div>{row.payable.vendor.name}</div>
                }
                return <div className="text-muted-foreground">-</div>
            },
        },
        {
            header: "Amount",
            cell: (row: PaymentTransaction) => (
                <span className={row.amount >= 0 ? "font-medium" : "font-medium text-destructive"}>
                    {formatPrice(row.amount)}
                </span>
            ),
            sortable: true,
        },
        {
            header: "Payment Method",
            cell: (row: PaymentTransaction) => <PaymentMethodBadge method={row.paymentMethod} />,
        },
        {
            header: "Status",
            cell: (row: PaymentTransaction) => <PaymentStatusBadge status={row.status} />,
        },
        {
            header: "Payment Date",
            cell: (row: PaymentTransaction) => format(new Date(row.paymentDate), "MMM dd, yyyy"),
            sortable: true,
        },
        {
            header: "External Reference",
            cell: (row: PaymentTransaction) => (
                <span className="font-mono text-sm">{row.externalReference || "-"}</span>
            ),
        },
        {
            header: "Actions",
            cell: (row: PaymentTransaction) => (
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
                        {(row.status === "PENDING" || row.status === "PROCESSING") && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(row)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Update Status
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    const hasActiveFilters = Boolean(
        filters.paymentType || filters.status || filters.paymentMethod || 
        filters.startDate || filters.endDate || filters.search
    )

    const clearFilters = () => {
        setFilters({
            paymentType: "",
            status: "",
            paymentMethod: "",
            startDate: "",
            endDate: "",
            search: "",
        })
        paymentsStore.setPage(1)
        paymentsStore.fetchAllPayments({ page: 1, limit: pagination.limit })
    }

    return (
        <div className="space-y-4 w-full">
            {/* Filters */}
            <Card className="p-4 w-full">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span className="font-medium">Filters</span>
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                Active
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                                <X className="h-4 w-4 mr-1" />
                                Clear Filters
                            </Button>
                        )}
                        <Button onClick={applyFilters} size="sm">
                            Apply Filters
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-5 gap-4">
                    <div className="space-y-2">
                        <Label>Payment Type</Label>
                        <Select
                            value={filters.paymentType || undefined}
                            onValueChange={(value) => setFilters({ ...filters, paymentType: value || "" })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RECEIVABLE">Receivable</SelectItem>
                                <SelectItem value="PAYABLE">Payable</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={filters.status || undefined}
                            onValueChange={(value) => setFilters({ ...filters, status: value || "" })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="PROCESSING">Processing</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select
                            value={filters.paymentMethod || undefined}
                            onValueChange={(value) => setFilters({ ...filters, paymentMethod: value || "" })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Methods" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                <SelectItem value="PAYSTACK">Paystack</SelectItem>
                                <SelectItem value="CARD">Card</SelectItem>
                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Search</Label>
                        <Input
                            placeholder="Reference, invoice number..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full"
                        />
                    </div>
                </div>
            </Card>

            <CustomTable
                columns={columns}
                data={payments}
                usePagination={true}
                page={pagination.page}
                onPageChange={(page) => {
                    paymentsStore.setPage(page)
                    const filterParams: any = { page, limit: pagination.limit }
                    if (filters.paymentType) filterParams.paymentType = filters.paymentType
                    if (filters.status) filterParams.status = filters.status
                    if (filters.paymentMethod) filterParams.paymentMethod = filters.paymentMethod
                    if (filters.startDate) filterParams.startDate = filters.startDate
                    if (filters.endDate) filterParams.endDate = filters.endDate
                    if (filters.search) filterParams.search = filters.search
                    paymentsStore.fetchAllPayments(filterParams)
                }}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={(limit) => {
                    paymentsStore.setPageLimit(limit)
                    const filterParams: any = { page: 1, limit }
                    if (filters.paymentType) filterParams.paymentType = filters.paymentType
                    if (filters.status) filterParams.status = filters.status
                    if (filters.paymentMethod) filterParams.paymentMethod = filters.paymentMethod
                    if (filters.startDate) filterParams.startDate = filters.startDate
                    if (filters.endDate) filterParams.endDate = filters.endDate
                    if (filters.search) filterParams.search = filters.search
                    paymentsStore.fetchAllPayments(filterParams)
                }}
                totalRows={pagination.total}
                exportOptions={{
                    title: "Payments",
                    file_name: "payments",
                }}
                hasExport={true}
            />

            {selectedPayment && (
                <UpdatePaymentStatusModal
                    open={updateStatusModalOpen}
                    onOpenChange={setUpdateStatusModalOpen}
                    payment={selectedPayment}
                    onSuccess={() => {
                        const filterParams: any = { page: pagination.page, limit: pagination.limit }
                        if (filters.paymentType) filterParams.paymentType = filters.paymentType
                        if (filters.status) filterParams.status = filters.status
                        if (filters.paymentMethod) filterParams.paymentMethod = filters.paymentMethod
                        if (filters.startDate) filterParams.startDate = filters.startDate
                        if (filters.endDate) filterParams.endDate = filters.endDate
                        if (filters.search) filterParams.search = filters.search
                        paymentsStore.fetchAllPayments(filterParams)
                        setSelectedPayment(null)
                    }}
                />
            )}
        </div>
    )
})

