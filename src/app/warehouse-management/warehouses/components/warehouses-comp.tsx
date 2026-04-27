"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Eye, MoreHorizontal, Plus, X } from "lucide-react"
import { WareHouse } from "@/types/warehousesType"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { WarehouseModal } from "./warehouse-modal"

export const WarehousesComp = observer(() => {
    const [warehouses, setWarehouses] = useState<WareHouse[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<WareHouse | null>(null)

    useEffect(() => {
        loadWarehouses()
    }, [])

    const loadWarehouses = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllWarehouses()
            if (response.status && response.data) {
                setWarehouses(response.data)
            }
        } catch {
            toastUtils.error("Failed to Load", "Unable to fetch warehouses.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleView = (item: WareHouse) => {
        // TODO: Implement view page/modal
        toastUtils.info("View", `Viewing warehouse: ${item.name}`)
    }

    const handleEdit = (item: WareHouse) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleDisable = async (item: WareHouse) => {
        if (confirm(`Are you sure you want to ${item.status === 1 ? 'disable' : 'enable'} warehouse "${item.name}"?`)) {
            try {
                const response = await ApiService.updateWarehouse(item.id, {
                    name: item.name,
                    capacity: item.capacity,
                    spaceUsed: item.spaceUsed,
                    city: item.city,
                    state: item.state,
                    lga: item.lga,
                    hubTypeId: item.hubTypeId,
                    phoneNumber: item.phoneNumber,
                    managerId: item.managerId,
                    longitude: item.longitude,
                    latitude: item.latitude,
                    emailAddress: item.emailAddress,
                    status: item.status === 1 ? 0 : 1,
                })
                if (response.status && response.data) {
                    toastUtils.success("Updated", `Warehouse ${item.status === 1 ? 'disabled' : 'enabled'} successfully.`)
                    loadWarehouses()
                } else {
                    toastUtils.error("Update Failed", response.message || "Failed to update warehouse.")
                }
            } catch {
                toastUtils.error("Update Failed", "An error occurred while updating the warehouse.")
            }
        }
    }

    const handleAdd = () => {
        setSelectedItem(null)
        setIsModalOpen(true)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedItem(null)
    }

    const handleSuccess = () => {
        loadWarehouses()
        handleModalClose()
    }

    const columns: CustomTableColumn<WareHouse>[] = [
        {
            header: "Name",
            accessor: "name" as keyof WareHouse,
            className: "font-medium",
        },
        {
            header: "Type",
            cell: (row) => row.hubType?.name || "N/A",
        },
        {
            header: "Location",
            cell: (row) => `${row.city}, ${row.state}`,
        },
        {
            header: "Capacity",
            cell: (row) => `${row.spaceUsed} / ${row.capacity}`,
        },
        {
            header: "Manager",
            cell: (row) => row.manager?.id ? "Assigned" : "Not Assigned",
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
                        <DropdownMenuItem onClick={() => handleView(row)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                        </DropdownMenuItem>
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
                    title="Warehouses" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={handleAdd}
                        >
                            <Plus className="w-4 h-4" /> Add Warehouse
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={warehouses}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No warehouses found
                                </div>
                            }
                        />
                    </div>
                </section>
                
                <WarehouseModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={selectedItem}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default WarehousesComp

