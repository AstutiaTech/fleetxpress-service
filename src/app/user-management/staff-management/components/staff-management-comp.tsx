"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Eye, MoreHorizontal, Plus, X } from "lucide-react"
import { StaffUser } from "@/types/staffTypes"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { StaffModal } from "./staff-modal"

export const StaffManagementComp = observer(() => {
    const [staff, setStaff] = useState<StaffUser[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<StaffUser | null>(null)

    useEffect(() => {
        loadStaff()
    }, [])

    const loadStaff = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllStaff({ limit: 1000 })
            if (response.status && response.data) {
                setStaff(response.data)
            }
        } catch {
            toastUtils.error("Failed to Load", "Unable to fetch staff.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleView = (item: StaffUser) => {
        // TODO: Implement view page/modal
        const name = `${item.profile?.firstName || ""} ${item.profile?.lastName || ""}`.trim() || "N/A"
        toastUtils.info("View", `Viewing staff: ${name}`)
    }

    const handleEdit = (item: StaffUser) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleDisable = async (item: StaffUser) => {
        if (confirm(`Are you sure you want to ${item.status === 1 ? 'disable' : 'enable'} this staff member?`)) {
            try {
                // TODO: Add updateStaff API method
                toastUtils.error("Not Implemented", "Update API not yet implemented. Please contact support.")
            } catch {
                toastUtils.error("Update Failed", "An error occurred while updating the staff member.")
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
        loadStaff()
        handleModalClose()
    }

    const columns: CustomTableColumn<StaffUser>[] = [
        {
            header: "Name",
            cell: (row) => `${row.profile?.firstName || ""} ${row.profile?.lastName || ""}`.trim() || "N/A",
            className: "font-medium",
        },
        {
            header: "Email",
            accessor: "email" as keyof StaffUser,
        },
        {
            header: "Phone",
            cell: (row) => row.profile?.phone || "N/A",
        },
        {
            header: "Role",
            cell: (row) => row.staff?.role || "N/A",
        },
        {
            header: "Location",
            cell: (row) => {
                const city = row.profile?.city || ""
                const state = row.profile?.state || ""
                return city && state ? `${city}, ${state}` : city || state || "N/A"
            },
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
            header: "Email Verified",
            cell: (row) => (
                <span className={row.isEmailVerified ? "text-green-600" : "text-gray-500"}>
                    {row.isEmailVerified ? "Yes" : "No"}
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
                    title="Staff Management" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={handleAdd}
                        >
                            <Plus className="w-4 h-4" /> Add Staff
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={staff}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No staff found
                                </div>
                            }
                        />
                    </div>
                </section>
                
                <StaffModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={selectedItem}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default StaffManagementComp

