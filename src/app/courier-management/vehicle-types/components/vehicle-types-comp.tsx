"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Plus, X } from "lucide-react"
import { VehicleType } from "@/types/vehicleTypeTypes"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useRouter } from "next/navigation"
import { UpdateVehicleTypeModal } from "./update-vehicle-type-modal"

export const VehicleTypesComp = observer(() => {
    const router = useRouter()
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [updateModalOpen, setUpdateModalOpen] = useState(false)
    const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | null>(null)

    useEffect(() => {
        loadVehicleTypes()
    }, [])

    const loadVehicleTypes = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllVehicleTypes()
            if (response.status && response.data) {
                setVehicleTypes(response.data)
            }
        } catch {
            toastUtils.error("Failed to Load", "Unable to fetch vehicle types.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (item: VehicleType) => {
        setSelectedVehicleType(item)
        setUpdateModalOpen(true)
    }

    const handleDisable = async (item: VehicleType) => {
        const newStatus = item.status === 1 ? 0 : 1
        if (confirm(`Are you sure you want to ${item.status === 1 ? 'disable' : 'enable'} vehicle type "${item.name}"?`)) {
            try {
                const response = await ApiService.updateVehicleType(item.id, { status: newStatus })
                if (response.status && response.data) {
                    toastUtils.success("Updated", `Vehicle type ${item.status === 1 ? 'disabled' : 'enabled'} successfully.`)
                    loadVehicleTypes()
                } else {
                    toastUtils.error("Update Failed", response.message || "Failed to update vehicle type.")
                }
            } catch {
                toastUtils.error("Update Failed", "An error occurred while updating the vehicle type.")
            }
        }
    }

    const handleCreate = () => {
        router.push("/courier-management/vehicle-types/create")
    }

    const columns: CustomTableColumn<VehicleType>[] = [
        {
            header: "Name",
            accessor: "name" as keyof VehicleType,
            className: "font-medium",
        },
        {
            header: "Size",
            accessor: "size" as keyof VehicleType,
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
            header: "Created At",
            cell: (row) => new Date(row.createdAt).toLocaleDateString(),
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
                    title="Vehicle Types" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={handleCreate}
                        >
                            <Plus className="w-4 h-4" /> Add Vehicle Type
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={vehicleTypes}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No vehicle types found
                                </div>
                            }
                        />
                    </div>
                </section>
            </div>
            <UpdateVehicleTypeModal
                open={updateModalOpen}
                onOpenChange={setUpdateModalOpen}
                vehicleType={selectedVehicleType}
                onSuccess={() => {
                    loadVehicleTypes()
                    setSelectedVehicleType(null)
                }}
            />
        </PageTransition>
    )
})

export default VehicleTypesComp

