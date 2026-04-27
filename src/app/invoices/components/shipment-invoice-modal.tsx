"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Controller, useForm } from "react-hook-form"
import { CreateInvoicePayload, InvoiceItem } from "@/types/invoiceTypes"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Loader2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shipment } from "@/types/shipmentTypes"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { jsPDF } from "jspdf"
import { toastUtils } from "@/utils/toast-utils"
import { useStore } from "@/providers/store.provider"

// Extend jsPDF type to include lastAutoTable
declare module "jspdf" {
    interface jsPDF {
        lastAutoTable?: {
            finalY: number
        }
    }
}

interface InvoiceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shipment: Shipment
    onSuccess?: () => void
}

interface InvoiceFormValues {
    dueDate: string
}

export function ShipmentInvoiceModal({ open, onOpenChange, shipment, onSuccess }: InvoiceModalProps) {
    const { shipmentStore } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingParcels, setIsLoadingParcels] = useState(false)
    const [parcels, setParcels] = useState(shipment.parcels || [])

    const loadParcels = useCallback(async () => {
        setIsLoadingParcels(true)
        try {
            const result = await shipmentStore.fetchShipmentParcels(shipment.id)
            if (result.success) {
                setParcels(shipmentStore.shipmentParcels)
            }
        } catch (error) {
            console.error("Failed to load parcels:", error)
        } finally {
            setIsLoadingParcels(false)
        }
    }, [shipment.id, shipmentStore])

    // Load parcels if not already loaded
    useEffect(() => {
        if (open && shipment.id && (!shipment.parcels || shipment.parcels.length === 0)) {
            loadParcels()
        } else if (open && shipment.parcels) {
            setParcels(shipment.parcels)
        }
    }, [open, shipment.id, shipment.parcels, loadParcels])

    // Auto-generate invoice items from parcels and costing
    const invoiceItems = useMemo<InvoiceItem[]>(() => {
        const items: InvoiceItem[] = []

        // Add items from parcels
        if (parcels && parcels.length > 0) {
            parcels.forEach((parcel) => {
                const packagingName = parcel.packaging?.name || "Packaging"
                const declaredValueFormatted = parcel.declaredValue 
                    ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(Number(parcel.declaredValue))
                    : "Parcel"
                const description = `${packagingName} - ${declaredValueFormatted} (${parcel.length}×${parcel.width}×${parcel.height}cm, ${parcel.weight || "N/A"}kg)`
                
                items.push({
                    description,
                    quantity: parcel.quantity,
                    unitPrice: parcel.packaging?.price ? Number(parcel.packaging.price) : 0,
                    tax: 0,
                    discount: 0,
                })

                // Add rush hour charge if applicable
                if (parcel.isRushHour && parcel.extraCost > 0) {
                    items.push({
                        description: `Rush Hour Charge - ${packagingName}`,
                        quantity: parcel.quantity,
                        unitPrice: parcel.extraCost,
                        tax: 0,
                        discount: 0,
                    })
                }
            })
        }

        // Add delivery charge from costing
        if (shipment.costing?.deliveryCharge) {
            items.push({
                description: `Delivery Charge - ${shipment.deliveryOption === "home" ? "Home Delivery" : shipment.deliveryOption === "pickup" ? "Pickup" : "Same Day Delivery"}`,
                quantity: 1,
                unitPrice: shipment.costing.deliveryCharge,
                tax: 0,
                discount: 0,
            })
        }

        // Add packaging charge from costing
        if (shipment.costing?.packagingCharge) {
            items.push({
                description: "Packaging Charge",
                quantity: 1,
                unitPrice: shipment.costing.packagingCharge,
                tax: 0,
                discount: 0,
            })
        }

        // Add extra cost from costing
        if (shipment.costing?.extraCost && shipment.costing.extraCost > 0) {
            items.push({
                description: "Additional Charges",
                quantity: 1,
                unitPrice: shipment.costing.extraCost,
                tax: 0,
                discount: 0,
            })
        }

        // Add extra volume from costing
        if (shipment.costing?.extraVolume && shipment.costing.extraVolume > 0) {
            items.push({
                description: "Volume Surcharge",
                quantity: 1,
                unitPrice: shipment.costing.extraVolume,
                tax: 0,
                discount: 0,
            })
        }

        return items
    }, [parcels, shipment.costing, shipment.deliveryOption])

    // Calculate totals
    const subtotal = useMemo(() => {
        return invoiceItems.reduce((sum, item) => {
            const itemTotal = item.quantity * item.unitPrice
            return sum + itemTotal
        }, 0)
    }, [invoiceItems])

    const tax = shipment.costing?.vat || 0
    const total = useMemo(() => {
        return subtotal + Number(tax)
    }, [subtotal, tax])

    // Invoice date is shipment created date
    const invoiceDate = shipment.createdAt ? format(new Date(shipment.createdAt), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
    
    // Default due date is 15 days from invoice date
    const defaultDueDate = format(
        new Date(new Date(shipment.createdAt || new Date()).getTime() + 15 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
    )

    const { control, handleSubmit, formState: { errors } } = useForm<InvoiceFormValues>({
        defaultValues: {
            dueDate: defaultDueDate,
        },
    })

    const generatePDF = (invoiceData: CreateInvoicePayload) => {
        const doc = new jsPDF()
        
        // Header
        doc.setFontSize(20)
        doc.text("INVOICE", 105, 20, { align: "center" })
        
        // Invoice details
        doc.setFontSize(10)
        let yPos = 35
        
        doc.text(`Invoice Date: ${format(new Date(invoiceData.invoiceDate), "MMM dd, yyyy")}`, 14, yPos)
        doc.text(`Due Date: ${format(new Date(invoiceData.dueDate), "MMM dd, yyyy")}`, 14, yPos + 5)
        doc.text(`Shipment: ${shipment.trackingCode}`, 14, yPos + 10)
        
        // Customer info
        yPos = 35
        doc.text(`Customer: ${shipment.sender?.profile?.firstName || ""} ${shipment.sender?.profile?.lastName || ""}`, 105, yPos, { align: "right" })
        doc.text(`Email: ${shipment.sender?.email || ""}`, 105, yPos + 5, { align: "right" })
        
        // Items table
        const tableData = invoiceData.items.map((item) => [
            item.description,
            item.quantity.toString(),
            formatPrice(item.unitPrice, "", 2),
            formatPrice(item.quantity * item.unitPrice, "", 2),
        ])
        
        autoTable(doc, {
            startY: yPos + 20,
            head: [["Description", "Qty", "Unit Price", "Total"]],
            body: tableData,
            theme: "striped",
            headStyles: { fillColor: [66, 66, 66] },
        })
        
        // Totals
        const finalY = (doc.lastAutoTable?.finalY || 100) + 10
        doc.setFontSize(10)
        doc.text(`Subtotal: ${formatPrice(subtotal, "", 2)}`, 150, finalY, { align: "right" })
        doc.text(`VAT: ${formatPrice(tax, "", 2)}`, 150, finalY + 5, { align: "right" })
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text(`Total: ${formatPrice(total, "", 2)}`, 150, finalY + 12, { align: "right" })
        
        // Notes
        if (invoiceData.notes) {
            doc.setFont("helvetica", "normal")
            doc.setFontSize(9)
            doc.text(`Notes: ${invoiceData.notes}`, 14, finalY + 20, { maxWidth: 180 })
        }
        
        return doc
    }

    const onSubmit = async (values: InvoiceFormValues, shouldDownload: boolean = false) => {
        setIsSubmitting(true)
        try {
            const payload: CreateInvoicePayload = {
                customerId: shipment.senderId,
                shipmentId: shipment.id,
                invoiceDate: invoiceDate,
                dueDate: values.dueDate,
                tax: tax,
                discount: 0,
                items: invoiceItems,
                notes: shipment.note || "Payment terms: Net 15",
                terms: "Payment due within 15 days",
            }

            const response = await ApiService.createInvoice(payload)
            
            if (response.status && response.data) {
                toastUtils.success("Invoice Created", "The invoice has been created successfully.")
                
                // Generate and download PDF if requested
                if (shouldDownload) {
                    const pdf = generatePDF(payload)
                    pdf.save(`invoice-${shipment.trackingCode}-${format(new Date(), "yyyy-MM-dd")}.pdf`)
                }
                
                onOpenChange(false)
                onSuccess?.()
            } else {
                toastUtils.error("Creation Failed", response.message || "Failed to create invoice.")
            }
        } catch {
            toastUtils.error("Creation Failed", "An error occurred while creating the invoice.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Review Invoice</DialogTitle>
                    <DialogDescription>
                        Review the invoice details for shipment {shipment.trackingCode}. All information is automatically generated from the shipment data.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit((values) => onSubmit(values, false))} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Invoice Date</Label>
                            <Input type="date" value={invoiceDate} disabled />
                            <p className="text-xs text-muted-foreground">Set to shipment creation date</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Due Date *</Label>
                            <Controller
                                control={control}
                                name="dueDate"
                                rules={{ required: "Due date is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input type="date" {...field} />
                                        {errors.dueDate && (
                                            <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-base">Invoice Items</Label>
                        {isLoadingParcels ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : invoiceItems.length === 0 ? (
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No items found. Please ensure the shipment has parcels and costing information.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {invoiceItems.map((item, index) => (
                                    <Card key={index}>
                                        <CardContent className="pt-4">
                                            <div className="grid gap-3 md:grid-cols-4 text-sm">
                                                <div className="md:col-span-2">
                                                    <p className="font-medium">{item.description}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">
                                                        {formatPrice(item.quantity * item.unitPrice)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatPrice(item.unitPrice)} each
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span className="font-medium">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">VAT:</span>
                                    <span className="font-medium">{formatPrice(tax)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                    <span>Total:</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSubmit((values) => onSubmit(values, true))}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto"
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Download className="mr-2 h-4 w-4" />
                            Generate and Download
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Invoice
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

