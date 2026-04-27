"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Plus, X } from "lucide-react"
import { Driver } from "@/types/driverTypes"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useRouter } from "next/navigation"
import { UpdateDriverModal } from "./update-driver-modal"

export const DriversComp = observer(() => {
    const router = useRouter()
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [updateModalOpen, setUpdateModalOpen] = useState(false)
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)

    useEffect(() => {
        loadDrivers()
    }, [])

    const loadDrivers = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllDrivers()
            if (response.status && response.data) {
                setDrivers(response.data)
            }
        } catch {
            toastUtils.error("Failed to Load", "Unable to fetch drivers.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (item: Driver) => {
        setSelectedDriver(item)
        setUpdateModalOpen(true)
    }

    const handleDisable = async (item: Driver) => {
        const newStatus = item.status === 1 ? 0 : 1
        if (confirm(`Are you sure you want to ${item.status === 1 ? 'disable' : 'enable'} driver "${item.name}"?`)) {
            try {
                const response = await ApiService.updateDriver(item.id, { status: newStatus })
                if (response.status && response.data) {
                    toastUtils.success("Updated", `Driver ${item.status === 1 ? 'disabled' : 'enabled'} successfully.`)
                    loadDrivers()
                } else {
                    toastUtils.error("Update Failed", response.message || "Failed to update driver.")
                }
            } catch {
                toastUtils.error("Update Failed", "An error occurred while updating the driver.")
            }
        }
    }

    const handleCreate = () => {
        router.push("/courier-management/drivers/create")
    }

    const columns: CustomTableColumn<Driver>[] = [
        {
            header: "Name",
            accessor: "name" as keyof Driver,
            className: "font-medium",
        },
        {
            header: "Email",
            accessor: "email" as keyof Driver,
        },
        {
            header: "Phone",
            accessor: "phoneNumber1" as keyof Driver,
        },
        {
            header: "Vehicle Type",
            cell: (row) => row.vehicleType?.name || "N/A",
        },
        {
            header: "Warehouse",
            cell: (row) => row.warehouse?.name || "N/A",
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
                    title="Drivers" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={handleCreate}
                        >
                            <Plus className="w-4 h-4" /> Add Driver
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={drivers}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No drivers found
                                </div>
                            }
                        />
                    </div>
                </section>
            </div>
            <UpdateDriverModal
                open={updateModalOpen}
                onOpenChange={setUpdateModalOpen}
                driver={selectedDriver}
                onSuccess={() => {
                    loadDrivers()
                    setSelectedDriver(null)
                }}
            />
        </PageTransition>
    )
})

export default DriversComp

