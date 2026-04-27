import { Copy, Edit, Eye, FileText, FileX, Link as LinkIcon, Loader2, MoreVertical, RefreshCw, UserPlus } from "lucide-react"
import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { getApiErrorMessage, getErrorMessage } from "@/utils/toast-utils"
import { useCallback, useEffect, useMemo, useState } from "react"

import { ApiService } from "@/lib/api"
import { AssignDriverModal } from "./assign-driver-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { CreatePaystackPaymentLinkPayload } from "@/types/financialsTypes"
import { DataTable } from "@/components/data-table"
import { Shipment } from "@/types/shipmentTypes"
import { ShipmentInvoiceModal } from "@/app/invoices/components/shipment-invoice-modal"
import { UpdateStatusModal } from "./update-status-modal"
import { format } from "date-fns"
import { observer } from "mobx-react-lite"
import { toJS } from "mobx"
import { toastUtils } from "@/utils/toast-utils"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useStore } from "@/providers/store.provider"

export const ShipmentsTable = observer(() => {
    const { shipmentStore } = useStore()
    const router = useRouter()
    const { hasRole } = useAuth()
    const [statusModalOpen, setStatusModalOpen] = useState(false)
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
    const [assignDriverModalOpen, setAssignDriverModalOpen] = useState(false)
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
    const [creatingPaymentLinkFor, setCreatingPaymentLinkFor] = useState<string | null>(null)
    const [selectedTab, setSelectedTab] = useState<string>("activeShipments")
    useEffect(() => {
        // Use existing filters from store
        shipmentStore.fetchAllShipments({
            page: shipmentStore.pagination.page,
            limit: shipmentStore.pagination.limit,
            ...shipmentStore.filters
        })
    }, [shipmentStore])

    // Access shipments directly in render to ensure MobX tracks it
    const shipments = shipmentStore.shipments
    const disabledShipments = shipmentStore.disabledShipments
    const isLoading = shipmentStore.isLoading
    const pagination = shipmentStore.pagination

    useEffect(() => {
        console.log("Shipments in component:", toJS(shipments))
        console.log("Disabled Shipments in component:", toJS(disabledShipments))
        console.log("Shipments length:", shipments.length)
        console.log("Disabled Shipments length:", disabledShipments.length)
        console.log("Is loading:", isLoading)
    }, [shipments, disabledShipments, isLoading])

    // Role-based permission checks
    const canView = useCallback(() => true, []) // Everyone can view
    const canEdit = useCallback(() => hasRole("superadmin", "admin", "manager"), [hasRole])
    const canUpdateStatuses = useCallback(() => hasRole("superadmin", "admin", "agent"), [hasRole])
    const canDisable = useCallback(() => hasRole("superadmin", "admin"), [hasRole])
    const canAssignDriver = useCallback(() => hasRole("superadmin", "admin", "manager", "agent"), [hasRole])

    const getStatusBadge = useCallback((status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            pending: "outline",
            processing: "default",
            assigned: "default",
            failed: "destructive",
            null: "outline",
        }
        return (
            <Badge variant={variants[status] || "outline"}>
                {status.toUpperCase()}
            </Badge>
        )
    }, [])

    const getDeliveryStatusBadge = useCallback((status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            "picked-up": "default",
            "in-transit": "default",
            "at-warehouse": "default",
            "out-for-delivery": "default",
            delivered: "default",
            "failed-delivery": "destructive",
            returned: "outline",
            cancelled: "destructive",
            null: "outline",
        }
        return (
            <Badge variant={variants[status] || "outline"}>
                {status?.replace(/-/g, " ").toUpperCase() || "N/A"}
            </Badge>
        )
    }, [])

    const getPaymentStatusBadge = useCallback((status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            paid: "default",
            unpaid: "destructive",
            processing: "outline",
            null: "outline",
        }
        return (
            <Badge variant={variants[status] || "outline"}>
                {status.toUpperCase()}
            </Badge>
        )
    }, [])

    const handleViewClick = useCallback((id: string) => {
        router.push(`/shipment-management/shipments/${id}`)
    }, [router])

    const handleEditClick = useCallback((id: string) => {
        router.push(`/shipment-management/shipments/${id}/edit`)
    }, [router])

    const handleUpdateStatusClick = useCallback((shipment: Shipment) => {
        setSelectedShipment(shipment)
        setStatusModalOpen(true)
    }, [])

    const handleDisableClick = useCallback(async (shipment: Shipment) => {
        if (confirm(`Are you sure you want to disable shipment ${shipment.trackingCode}?`)) {
            const result = await shipmentStore.disableShipment(shipment.id)
            if (result.status) {
                toastUtils.success("Shipment Disabled", "The shipment has been disabled successfully.")
                shipmentStore.fetchAllShipments({
                    page: pagination.page,
                    limit: pagination.limit,
                    ...shipmentStore.filters
                })
            } else {
                toastUtils.error("Failed to disable shipment", result.error || "Failed to disable shipment")
            }
        }
    }, [shipmentStore, pagination])

    const handleInvoiceClick = useCallback((shipment: Shipment) => {
        setSelectedShipment(shipment)
        setInvoiceModalOpen(true)
    }, [])

    const handleAssignDriverClick = useCallback((shipment: Shipment) => {
        setSelectedShipment(shipment)
        setAssignDriverModalOpen(true)
    }, [])

    const handleCreatePaymentLink = useCallback(async (shipment: Shipment) => {
        setCreatingPaymentLinkFor(shipment.id)
        try {
            const plainShipment = toJS(shipment) as Shipment
            const amount = plainShipment.costing?.amount

            // Get logo image URL
            const logoUrl = typeof window !== "undefined"
                ? `${window.location.origin}/images/logo_full.png`
                : ""

            // Include metadata with shipment information
            const metadata: Record<string, any> = {
                logoImage: logoUrl,
                shipmentCode: plainShipment.trackingCode,
                shipmentId: plainShipment.id,
                trackingCode: plainShipment.trackingCode,
                senderName: plainShipment.sender?.profile
                    ? `${plainShipment.sender.profile.firstName} ${plainShipment.sender.profile.lastName}`
                    : "",
                recipientName: plainShipment.recipient
                    ? `${plainShipment.recipient.firstName} ${plainShipment.recipient.lastName}`
                    : plainShipment.recipientFirstName && plainShipment.recipientLastName
                        ? `${plainShipment.recipientFirstName} ${plainShipment.recipientLastName}`
                        : "",
                deliveryAddress: plainShipment.deliveryAddress || "",
                amount: amount || 0,
            }

            const payload: CreatePaystackPaymentLinkPayload = {
                ...(amount ? { amount } : {}),
                successMessage: "Payment successful!",
                description: "Payment for shipment " + plainShipment.trackingCode,
                name: plainShipment.trackingCode,
                metadata,
            }

            const response = await ApiService.createPaystackPaymentLink(shipment.id, payload)

            if (response.status && response.data) {
                const paymentUrl = response.data.paymentUrl
                // Copy to clipboard
                try {
                    await navigator.clipboard.writeText(paymentUrl)
                    toastUtils.success("Payment Link Created", "Payment link has been created and copied to clipboard!")
                } catch (clipboardError) {
                    // If clipboard fails, show the link in a toast or alert
                    toastUtils.success("Payment Link Created", `Payment link: ${paymentUrl}`)
                }
            } else {
                const errorMessage = getApiErrorMessage(response as any) || response.message || "Failed to create payment link"
                throw new Error(errorMessage)
            }
        } catch (error) {
            console.error("Failed to create payment link:", error)
            const errorMessage = getErrorMessage(error, "Failed to create payment link")
            toastUtils.error("Failed", errorMessage)
        } finally {
            setCreatingPaymentLinkFor(null)
        }
    }, [])

    const canEditShipment = useCallback((shipment: Shipment) => {
        // If payment status is paid and shipment is not pending and not disabled, cannot edit
        if (shipment.paymentStatus === "paid" && shipment.status !== "pending" && !shipment.deletedAt) {
            return false
        }
        return true
    }, [])

    const columns: CustomTableColumn<Shipment>[] = useMemo(() => [
        {
            header: "Tracking Code",
            accessor: "trackingCode",
            sortable: true,
            className: "font-medium",
        },
        {
            header: "Sender",
            cell: (row: Shipment) => {
                // Convert MobX observable to plain object for safe access
                const plainRow = toJS(row) as Shipment
                return (
                    <div>
                        <div className="font-medium">{plainRow.sender?.profile?.firstName} {plainRow.sender?.profile?.lastName || "N/A"}</div>
                        <div className="text-sm text-muted-foreground">{plainRow.sender?.email || ""}</div>
                    </div>
                )
            },
        },
        {
            header: "Recipient",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return (
                    <div>
                        <div className="font-medium">
                            {plainRow.recipientFirstName} {plainRow.recipientLastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{plainRow.recipientPhoneNumber}</div>
                    </div>
                )
            },
        },
        {
            header: "Destination",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return (
                    <div>
                        <div className="font-medium">
                            {plainRow.destinationCity?.name}, {plainRow.destinationState?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">{plainRow.destinationCountry?.name}</div>
                    </div>
                )
            },
        },
        {
            header: "Status",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return getStatusBadge(plainRow.status)
            },
            sortable: true,
        },
        {
            header: "Delivery Status",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return getDeliveryStatusBadge(plainRow.deliveryStatus)
            },
            sortable: true,
        },
        {
            header: "Payment Status",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return getPaymentStatusBadge(plainRow.paymentStatus)
            },
            sortable: true,
        },
        ...(canAssignDriver() ? [{
            header: "Assigned Driver",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                if (plainRow.driver) {
                    return (
                        <div>
                            <Badge variant="default" className="mb-1">
                                {plainRow.driver.name}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                                {plainRow.driver.vehicleType?.name} - {plainRow.driver.warehouse?.name}
                            </div>
                        </div>
                    )
                }
                return (
                    <Badge variant="outline">Unassigned</Badge>
                )
            },
        }] : []),
        {
            header: "Amount",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return (
                    <div className="font-medium">
                        ₦{plainRow.costing?.amount?.toLocaleString() || "0.00"}
                    </div>
                )
            },
            sortable: true,
            sortFn: (a: Shipment, b: Shipment) => {
                const plainA = toJS(a) as Shipment
                const plainB = toJS(b) as Shipment
                return (plainA.costing?.amount || 0) - (plainB.costing?.amount || 0)
            },
        },
        {
            header: "Created At",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return format(new Date(plainRow.createdAt), "MMM dd, yyyy")
            },
            sortable: true,
            sortFn: (a: Shipment, b: Shipment) => {
                const plainA = toJS(a) as Shipment
                const plainB = toJS(b) as Shipment
                return new Date(plainA.createdAt).getTime() - new Date(plainB.createdAt).getTime()
            },
        },
        {
            header: "Actions",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                const shipmentEditable = canEditShipment(plainRow)

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewClick(plainRow.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                            </DropdownMenuItem>
                            {canEdit() && shipmentEditable && (
                                <DropdownMenuItem onClick={() => handleEditClick(plainRow.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                            {canUpdateStatuses() && (
                                <DropdownMenuItem onClick={() => handleUpdateStatusClick(plainRow)}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Update Statuses
                                </DropdownMenuItem>
                            )}
                            {canAssignDriver() && plainRow.deliveryStatus !== "delivered" && (
                                <DropdownMenuItem onClick={() => handleAssignDriverClick(plainRow)}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {plainRow.driverId ? "Change Driver" : "Assign Driver"}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleInvoiceClick(plainRow)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Invoice
                            </DropdownMenuItem>
                            {plainRow.paymentStatus !== "paid" && (
                                <DropdownMenuItem
                                    onClick={() => handleCreatePaymentLink(plainRow)}
                                    disabled={creatingPaymentLinkFor === plainRow.id}
                                >
                                    {creatingPaymentLinkFor === plainRow.id ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon className="h-4 w-4 mr-2" />
                                            Create Payment Link
                                        </>
                                    )}
                                </DropdownMenuItem>
                            )}
                            {canDisable() && plainRow.deliveryStatus !== "delivered" && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => handleDisableClick(plainRow)}
                                        className="text-destructive"
                                    >
                                        <FileX className="h-4 w-4 mr-2" />
                                        Disable
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [getStatusBadge, getDeliveryStatusBadge, getPaymentStatusBadge, handleViewClick, handleEditClick, handleUpdateStatusClick, handleDisableClick, handleInvoiceClick, handleAssignDriverClick, canEdit, canUpdateStatuses, canDisable, canAssignDriver, canEditShipment])

    const disabledColumns: CustomTableColumn<Shipment>[] = useMemo(() => [
        {
            header: "Tracking Code",
            accessor: "trackingCode",
            sortable: true,
            className: "font-medium",
        },
        {
            header: "Sender",
            cell: (row: Shipment) => {
                // Convert MobX observable to plain object for safe access
                const plainRow = toJS(row) as Shipment
                return (
                    <div>
                        <div className="font-medium">{plainRow.sender?.profile?.firstName} {plainRow.sender?.profile?.lastName || "N/A"}</div>
                        <div className="text-sm text-muted-foreground">{plainRow.sender?.email || ""}</div>
                    </div>
                )
            },
        },
        {
            header: "Recipient",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return (
                    <div>
                        <div className="font-medium">
                            {plainRow.recipientFirstName} {plainRow.recipientLastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{plainRow.recipientPhoneNumber}</div>
                    </div>
                )
            },
        },
        {
            header: "Destination",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return (
                    <div>
                        <div className="font-medium">
                            {plainRow.destinationCity?.name}, {plainRow.destinationState?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">{plainRow.destinationCountry?.name}</div>
                    </div>
                )
            },
        },
        {
            header: "Status",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return getStatusBadge(plainRow.status)
            },
            sortable: true,
        },
        {
            header: "Delivery Status",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return getDeliveryStatusBadge(plainRow.deliveryStatus)
            },
            sortable: true,
        },
        {
            header: "Payment Status",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return getPaymentStatusBadge(plainRow.paymentStatus)
            },
            sortable: true,
        },
        ...(canAssignDriver() ? [{
            header: "Assigned Driver",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                if (plainRow.driver) {
                    return (
                        <div>
                            <Badge variant="default" className="mb-1">
                                {plainRow.driver.name}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                                {plainRow.driver.vehicleType?.name} - {plainRow.driver.warehouse?.name}
                            </div>
                        </div>
                    )
                }
                return (
                    <Badge variant="outline">Unassigned</Badge>
                )
            },
        }] : []),
        {
            header: "Amount",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return (
                    <div className="font-medium">
                        ₦{plainRow.costing?.amount?.toLocaleString() || "0.00"}
                    </div>
                )
            },
            sortable: true,
            sortFn: (a: Shipment, b: Shipment) => {
                const plainA = toJS(a) as Shipment
                const plainB = toJS(b) as Shipment
                return (plainA.costing?.amount || 0) - (plainB.costing?.amount || 0)
            },
        },
        {
            header: "Created At",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                return format(new Date(plainRow.createdAt), "MMM dd, yyyy")
            },
            sortable: true,
            sortFn: (a: Shipment, b: Shipment) => {
                const plainA = toJS(a) as Shipment
                const plainB = toJS(b) as Shipment
                return new Date(plainA.createdAt).getTime() - new Date(plainB.createdAt).getTime()
            },
        },
        {
            header: "Actions",
            cell: (row: Shipment) => {
                const plainRow = toJS(row) as Shipment
                const shipmentEditable = canEditShipment(plainRow)

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewClick(plainRow.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [getStatusBadge, getDeliveryStatusBadge, getPaymentStatusBadge, handleViewClick, handleEditClick, handleUpdateStatusClick, handleDisableClick, handleInvoiceClick, handleAssignDriverClick, canEdit, canUpdateStatuses, canDisable, canAssignDriver, canEditShipment])

    const AllActiveShipments = useCallback(() => (
        <div className="mt-4 w-full">
            <CustomTable
                columns={columns}
                data={shipments}
                enableSorting={true}
                usePagination={true}
                page={pagination.page}
                onPageChange={(page: number) => {
                    shipmentStore.setPage(page)
                    shipmentStore.fetchAllShipments({
                        page,
                        limit: pagination.limit,
                        ...shipmentStore.filters
                    })
                }}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={(limit: number) => {
                    shipmentStore.setPageLimit(limit)
                    shipmentStore.fetchAllShipments({
                        page: 1,
                        limit,
                        ...shipmentStore.filters
                    })
                }}
                totalRows={pagination.total}
                hasExport={true}
                exportOptions={{
                    title: "Shipments Report",
                    file_name: "shipments",
                    header_title: "All Shipments",
                    exportFormat: "excel-only",
                }}
                emptyContent={
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No shipments found.</p>
                    </div>
                }
            />
        </div>
    ), [columns, pagination.limit, pagination.page, pagination.total, shipmentStore, shipments])
    const AllDisabledShipments = useCallback(() => (
        <div className="mt-4 w-full">
            <CustomTable
                columns={disabledColumns}
                data={disabledShipments}
                enableSorting={true}
                usePagination={true}
                page={pagination.page}
                onPageChange={(page: number) => {
                    shipmentStore.setPage(page)
                    shipmentStore.fetchAllDisabledShipments({
                        page,
                        limit: pagination.limit,
                        ...shipmentStore.filters
                    })
                }}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={(limit: number) => {
                    shipmentStore.setPageLimit(limit)
                    shipmentStore.fetchAllDisabledShipments({
                        page: 1,
                        limit,
                        ...shipmentStore.filters
                    })
                }}
                totalRows={pagination.total}
                hasExport={true}
                exportOptions={{
                    title: "Disabled Shipments Report",
                    file_name: "disabled-shipments",
                    header_title: "All Disabled Shipments",
                    exportFormat: "excel-only",
                }}
                emptyContent={
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No disabled shipments found.</p>
                    </div>
                }
            />
        </div>
    ), [disabledColumns, pagination.limit, pagination.page, pagination.total, shipmentStore, disabledShipments])
    
    const TabbedShipments = useCallback(() => (
        <div className="flex w-full flex-col gap-6">
            <Tabs defaultValue="activeShipments" value={selectedTab} onValueChange={(value: string) => {
                setSelectedTab(value)
                if (value === "activeShipments") {
                    shipmentStore.fetchAllShipments({
                        page: pagination.page,
                        limit: pagination.limit,
                        ...shipmentStore.filters
                    })
                }
                if (value === "disabledShipments") {
                    shipmentStore.fetchAllDisabledShipments({
                        page: pagination.page,
                        limit: pagination.limit,
                        ...shipmentStore.filters
                    })
                }
            }}>
                <TabsList>
                    <TabsTrigger value="activeShipments">Active Shipments</TabsTrigger>
                    <TabsTrigger value="disabledShipments">Disabled Shipments</TabsTrigger>
                </TabsList>
                <TabsContent value="activeShipments">
                    <AllActiveShipments />
                </TabsContent>
                <TabsContent value="disabledShipments">
                    <AllDisabledShipments />
                </TabsContent>
            </Tabs>
        </div>
    ), [AllActiveShipments, AllDisabledShipments, pagination.limit, pagination.page, selectedTab, shipmentStore])

    return (
        <>
        {canEdit() ? <TabbedShipments /> : <AllActiveShipments />}
            {selectedShipment && (
                <>
                    <UpdateStatusModal
                        open={statusModalOpen}
                        onOpenChange={setStatusModalOpen}
                        shipment={selectedShipment}
                        onSuccess={() => {
                            shipmentStore.fetchAllShipments({
                                page: pagination.page,
                                limit: pagination.limit,
                                ...shipmentStore.filters
                            })
                        }}
                    />
                    <ShipmentInvoiceModal
                        open={invoiceModalOpen}
                        onOpenChange={setInvoiceModalOpen}
                        shipment={selectedShipment}
                        onSuccess={() => {
                            // Optionally refresh data or show success message
                        }}
                    />
                    {canAssignDriver() && (
                        <AssignDriverModal
                            open={assignDriverModalOpen}
                            onOpenChange={setAssignDriverModalOpen}
                            shipment={selectedShipment}
                            onSuccess={() => {
                                shipmentStore.fetchAllShipments({
                                    page: pagination.page,
                                    limit: pagination.limit,
                                    ...shipmentStore.filters
                                })
                            }}
                        />
                    )}
                </>
            )}
        </>
    )
})