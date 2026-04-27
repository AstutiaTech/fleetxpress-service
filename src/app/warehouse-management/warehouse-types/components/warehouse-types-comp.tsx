"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Eye, MoreHorizontal, Plus, X } from "lucide-react"
import { WarehouseType } from "@/types/warehouseTypeTypes"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { WarehouseTypeModal } from "./warehouse-type-modal"

export const WarehouseTypesComp = observer(() => {
    const [warehouseTypes, setWarehouseTypes] = useState<WarehouseType[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<WarehouseType | null>(null)

    useEffect(() => {
        loadWarehouseTypes()
    }, [])

    const loadWarehouseTypes = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllWarehouseTypes()
            if (response.status && response.data) {
                setWarehouseTypes(response.data)
            }
        } catch {
            toastUtils.error("Failed to Load", "Unable to fetch warehouse types.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleView = (item: WarehouseType) => {
        // TODO: Implement view page/modal
        toastUtils.info("View", `Viewing warehouse type: ${item.name}`)
    }

    const handleEdit = (item: WarehouseType) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleDisable = async (item: WarehouseType) => {
        if (confirm(`Are you sure you want to ${item.status === 1 ? 'disable' : 'enable'} warehouse type "${item.name}"?`)) {
            try {
                const response = await ApiService.updateWarehouseType(item.id, {
                    name: item.name,
                    status: item.status === 1 ? 0 : 1,
                })
                if (response.status && response.data) {
                    toastUtils.success("Updated", `Warehouse type ${item.status === 1 ? 'disabled' : 'enabled'} successfully.`)
                    loadWarehouseTypes()
                } else {
                    toastUtils.error("Update Failed", response.message || "Failed to update warehouse type.")
                }
            } catch {
                toastUtils.error("Update Failed", "An error occurred while updating the warehouse type.")
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
        loadWarehouseTypes()
        handleModalClose()
    }

    const columns: CustomTableColumn<WarehouseType>[] = [
        {
            header: "Name",
            accessor: "name" as keyof WarehouseType,
            className: "font-medium",
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
                    title="Warehouse Types" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={handleAdd}
                        >
                            <Plus className="w-4 h-4" /> Add Warehouse Type
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={warehouseTypes}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No warehouse types found
                                </div>
                            }
                        />
                    </div>
                </section>
                
                <WarehouseTypeModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={selectedItem}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default WarehouseTypesComp

