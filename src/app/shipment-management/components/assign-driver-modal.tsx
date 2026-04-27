"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2, UserMinus, UserPlus } from "lucide-react"
import { Driver } from "@/types/driverTypes"
import { Shipment } from "@/types/shipmentTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface AssignDriverModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shipment: Shipment
    onSuccess: () => void
}

export function AssignDriverModal({ open, onOpenChange, shipment, onSuccess }: AssignDriverModalProps) {
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [selectedDriverId, setSelectedDriverId] = useState<string>(shipment.driverId || "")
    const [loading, setLoading] = useState(false)
    const [fetchingDrivers, setFetchingDrivers] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchDrivers()
            setSelectedDriverId(shipment.driverId || "")
        } else {
            // Reset when modal closes
            setSelectedDriverId("")
            setError(null)
        }
    }, [open, shipment.driverId])

    const fetchDrivers = async () => {
        setFetchingDrivers(true)
        setError(null)
        try {
            const response = await ApiService.getAllDrivers()
            if (response.status && response.data) {
                // Filter active drivers (status === 1)
                const activeDrivers = response.data.filter(driver => driver.status === 1)
                setDrivers(activeDrivers)
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch drivers")
            toastUtils.error("Failed to Load Drivers", "Unable to fetch drivers. Please try again.")
        } finally {
            setFetchingDrivers(false)
        }
    }

    const handleAssign = async () => {
        if (!selectedDriverId) {
            setError("Please select a driver")
            return
        }

        // If same driver is selected, just close
        if (shipment.driverId && shipment.driverId === selectedDriverId) {
            onOpenChange(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            // If there's a current driver, unassign first
            if (shipment.driverId) {
                await ApiService.unassignShipmentFromDriver(shipment.id)
            }

            // Assign new driver
            await ApiService.assignShipmentToDriver(shipment.id, selectedDriverId)
            toastUtils.success("Driver Assigned", "Shipment has been assigned to driver successfully.")
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            setError(err.message || "Failed to assign driver")
            toastUtils.error("Assignment Failed", err.message || "Failed to assign driver. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleUnassign = async () => {
        if (!shipment.driverId) return

        setLoading(true)
        setError(null)

        try {
            await ApiService.unassignShipmentFromDriver(shipment.id)
            toastUtils.success("Driver Unassigned", "Shipment has been unassigned from driver successfully.")
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            setError(err.message || "Failed to unassign driver")
            toastUtils.error("Unassignment Failed", err.message || "Failed to unassign driver. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const currentDriver = drivers.find(d => d.id === shipment.driverId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {shipment.driverId ? "Change Driver Assignment" : "Assign Driver"}
                    </DialogTitle>
                    <DialogDescription>
                        {shipment.driverId 
                            ? "Select a different driver or unassign the current driver."
                            : "Select a driver to assign this shipment to."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {shipment.driverId && currentDriver && (
                        <div className="rounded-md border p-3 bg-muted/50">
                            <Label className="text-sm text-muted-foreground">Current Driver</Label>
                            <div className="mt-1">
                                <Badge variant="default" className="mr-2">
                                    {currentDriver.name}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    {currentDriver.vehicleType?.name} - {currentDriver.warehouse?.name}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Select Driver</Label>
                        {fetchingDrivers ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <Select
                                value={selectedDriverId || undefined}
                                onValueChange={setSelectedDriverId}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a driver" />
                                </SelectTrigger>
                                <SelectContent>
                                    {drivers.map((driver) => (
                                        <SelectItem key={driver.id} value={driver.id}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{driver.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {driver.vehicleType?.name} - {driver.warehouse?.name}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {drivers.length === 0 && !fetchingDrivers && (
                            <p className="text-sm text-muted-foreground">No active drivers available.</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    {shipment.driverId && (
                        <Button
                            variant="destructive"
                            onClick={handleUnassign}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <UserMinus className="mr-2 h-4 w-4" />
                            )}
                            Unassign
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={loading || !selectedDriverId || fetchingDrivers}
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        {shipment.driverId ? "Change Assignment" : "Assign"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

