"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeliveryStatus, PaymentStatus, ShipmentFilters, ShipmentStatus } from "@/types/shipmentTypes"
import { Filter, Mail, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Driver } from "@/types/driverTypes"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface ShipmentFiltersComponentProps {
    filters: ShipmentFilters
    onFiltersChange: (filters: ShipmentFilters) => void
    onReset: () => void
    onApply: () => void
}

export function ShipmentFiltersComponent({
    filters,
    onFiltersChange,
    onReset,
    onApply,
}: ShipmentFiltersComponentProps) {
    const [localFilters, setLocalFilters] = useState<ShipmentFilters>(filters)
    const [email, setEmail] = useState<string>("")
    const [drivers, setDrivers] = useState<Driver[]>([])

    const loadDrivers = async () => {
        try {
            const response = await ApiService.getAllDrivers()
            if (response.status && response.data) {
                setDrivers(response.data.filter(d => d.status === 1))
            }
        } catch (error) {
            console.error("Failed to load drivers:", error)
        }
    }

    useEffect(() => {
        setLocalFilters(filters)
    }, [filters])

    useEffect(() => {
        loadDrivers()
    }, [])

    const handleFilterChange = (key: keyof ShipmentFilters, value: string | undefined) => {
        const updated = { ...localFilters, [key]: value || undefined }
        setLocalFilters(updated)
        onFiltersChange(updated)
    }

    const handleEmailChange = (value: string) => {
        setEmail(value)
        // Use search field for email filtering
        handleFilterChange("search", value || undefined)
    }

    const getActiveFilterCount = () => {
        let count = 0
        if (localFilters.status) count++
        if (localFilters.deliveryStatus) count++
        if (localFilters.paymentStatus) count++
        if (localFilters.driverId) count++
        if (localFilters.trackingCode) count++
        if (localFilters.search) count++
        return count
    }

    const activeCount = getActiveFilterCount()

    const shipmentStatusOptions: ShipmentStatus[] = ["pending", "processing", "assigned", "failed"]
    const deliveryStatusOptions: DeliveryStatus[] = [
        "picked-up",
        "in-transit",
        "at-warehouse",
        "out-for-delivery",
        "delivered",
        "failed-delivery",
        "returned",
        "cancelled",
    ]
    const paymentStatusOptions: PaymentStatus[] = ["unpaid", "processing", "paid"]

    return (
        <Card className="mb-4">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        <CardTitle className="text-lg">Filters</CardTitle>
                        {activeCount > 0 && (
                            <Badge variant="default" className="ml-2">
                                {activeCount}
                            </Badge>
                        )}
                    </div>
                    {activeCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={onReset}>
                            <X className="h-4 w-4 mr-1" />
                            Clear All
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Filter Fields - 5 column grid with wrapping */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {/* Shipment Status */}
                    <div className="space-y-2">
                        <Label>Shipment Status</Label>
                        <Select
                            value={localFilters.status || undefined}
                            onValueChange={(value) => handleFilterChange("status", value === "all" ? undefined : value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {shipmentStatusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Delivery Status */}
                    <div className="space-y-2">
                        <Label>Delivery Status</Label>
                        <Select
                            value={localFilters.deliveryStatus || undefined}
                            onValueChange={(value) => handleFilterChange("deliveryStatus", value === "all" ? undefined : value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All delivery statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {deliveryStatusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Status */}
                    <div className="space-y-2">
                        <Label>Payment Status</Label>
                        <Select
                            value={localFilters.paymentStatus || undefined}
                            onValueChange={(value) => handleFilterChange("paymentStatus", value === "all" ? undefined : value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All payment statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {paymentStatusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Driver/Rider */}
                    <div className="space-y-2">
                        <Label>Driver/Rider</Label>
                        <Select
                            value={localFilters.driverId || undefined}
                            onValueChange={(value) => handleFilterChange("driverId", value === "all" ? undefined : value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All drivers" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Drivers</SelectItem>
                                {drivers.map((driver) => (
                                    <SelectItem key={driver.id} value={driver.id}>
                                        {driver.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tracking Code */}
                    <div className="space-y-2">
                        <Label>Tracking Code</Label>
                        <Input
                            placeholder="Enter tracking code"
                            value={localFilters.trackingCode || ""}
                            onChange={(e) => handleFilterChange("trackingCode", e.target.value || undefined)}
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            placeholder="Enter email"
                            value={email}
                            className="pl-10"
                            onChange={(e) => handleEmailChange(e.target.value)}
                            leftIcon={<Mail className="h-4 w-4" />}
                        />
                    </div>
                </div>

                {/* Active Filters Display */}
                {activeCount > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Active Filters:</Label>
                            <div className="flex flex-wrap gap-2">
                                {localFilters.status && (
                                    <Badge variant="secondary" className="gap-1">
                                        Status: {localFilters.status}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => handleFilterChange("status", undefined)}
                                        />
                                    </Badge>
                                )}
                                {localFilters.deliveryStatus && (
                                    <Badge variant="secondary" className="gap-1">
                                        Delivery: {localFilters.deliveryStatus}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => handleFilterChange("deliveryStatus", undefined)}
                                        />
                                    </Badge>
                                )}
                                {localFilters.paymentStatus && (
                                    <Badge variant="secondary" className="gap-1">
                                        Payment: {localFilters.paymentStatus}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => handleFilterChange("paymentStatus", undefined)}
                                        />
                                    </Badge>
                                )}
                                {localFilters.driverId && (
                                    <Badge variant="secondary" className="gap-1">
                                        Driver: {drivers.find((d) => d.id === localFilters.driverId)?.name || "Selected"}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => handleFilterChange("driverId", undefined)}
                                        />
                                    </Badge>
                                )}
                                {localFilters.trackingCode && (
                                    <Badge variant="secondary" className="gap-1">
                                        Tracking: {localFilters.trackingCode}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => handleFilterChange("trackingCode", undefined)}
                                        />
                                    </Badge>
                                )}
                                {localFilters.search && (
                                    <Badge variant="secondary" className="gap-1">
                                        Email: {localFilters.search}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() => {
                                                setEmail("")
                                                handleFilterChange("search", undefined)
                                            }}
                                        />
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-end pt-2">
                    <Button onClick={onApply} size="sm">
                        Apply Filters
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
