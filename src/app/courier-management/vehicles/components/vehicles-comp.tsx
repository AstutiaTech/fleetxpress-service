"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Plus, X } from "lucide-react"
import { Vehicle } from "@/types/vehicleTypes"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useRouter } from "next/navigation"
import { UpdateVehicleModal } from "./update-vehicle-modal"

export const VehiclesComp = observer(() => {
    const router = useRouter()
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [updateModalOpen, setUpdateModalOpen] = useState(false)
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

    useEffect(() => {
        loadVehicles()
    }, [])

    const loadVehicles = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllVehicles()
            if (response.status && response.data) {
                setVehicles(response.data)
            }
        } catch {
            toastUtils.error("Failed to Load", "Unable to fetch vehicles.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (item: Vehicle) => {
        setSelectedVehicle(item)
        setUpdateModalOpen(true)
    }

    const handleDisable = async (item: Vehicle) => {
        const newStatus = item.status === 1 ? 0 : 1
        if (confirm(`Are you sure you want to ${item.status === 1 ? 'disable' : 'enable'} vehicle "${item.registrationNumber}"?`)) {
            try {
                const response = await ApiService.updateVehicle(item.id, { status: newStatus })
                if (response.status && response.data) {
                    toastUtils.success("Updated", `Vehicle ${item.status === 1 ? 'disabled' : 'enabled'} successfully.`)
                    loadVehicles()
                } else {
                    toastUtils.error("Update Failed", response.message || "Failed to update vehicle.")
                }
            } catch {
                toastUtils.error("Update Failed", "An error occurred while updating the vehicle.")
            }
        }
    }

    const handleCreate = () => {
        router.push("/courier-management/vehicles/create")
    }

    const columns: CustomTableColumn<Vehicle>[] = [
        {
            header: "Registration Number",
            accessor: "registrationNumber" as keyof Vehicle,
            className: "font-medium",
        },
        {
            header: "Vehicle Type",
            cell: (row) => row.vehicleType?.name || "N/A",
        },
        {
            header: "Driver",
            cell: (row) => row.driver?.name || "N/A",
        },
        {
            header: "Capacity",
            accessor: "capacity" as keyof Vehicle,
        },
        {
            header: "Base Location",
            accessor: "baseLocation" as keyof Vehicle,
        },
        {
            header: "Status",
            cell: (row) => (
                <span className={row.status === 1 ? "text-green-600" : "text-gray-500"}>
                    {row.status === 1 ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            header: "Actions",
            cell: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(row)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDisable(row)}>
                            <X className="h-4 w-4 mr-2" />
                            {row.status === 1 ? "Disable" : "Enable"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader 
                    title="Vehicles" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={handleCreate}
                        >
                            <Plus className="w-4 h-4" /> Add Vehicle
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={vehicles}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No vehicles found
                                </div>
                            }
                        />
                    </div>
                </section>
            </div>
            <UpdateVehicleModal
                open={updateModalOpen}
                onOpenChange={setUpdateModalOpen}
                vehicle={selectedVehicle}
                onSuccess={() => {
                    loadVehicles()
                    setSelectedVehicle(null)
                }}
            />
        </PageTransition>
    )
})

export default VehiclesComp

