"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { Edit, Plus } from "lucide-react"
import { SmsSettings } from "@/types/smsTypes"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { SmsSettingsModal } from "./sms-settings-modal"

export const SmsSettingsComp = observer(() => {
    const [smsSettings, setSmsSettings] = useState<SmsSettings[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<SmsSettings | null>(null)

    useEffect(() => {
        loadSmsSettings()
    }, [])

    const loadSmsSettings = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllSmsSettings()
            if (response.status && response.data) {
                setSmsSettings(response.data)
            }
        } catch (error) {
            toastUtils.error("Failed to Load", "Unable to fetch SMS settings.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (item: SmsSettings) => {
        setSelectedItem(item)
        setIsModalOpen(true)
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
        loadSmsSettings()
        handleModalClose()
    }

    const columns: CustomTableColumn<SmsSettings>[] = [
        {
            header: "Provider",
            accessor: "provider" as keyof SmsSettings,
            className: "font-medium",
        },
        {
            header: "API URL",
            accessor: "apiUrl" as keyof SmsSettings,
        },
        {
            header: "Application ID",
            accessor: "applicationId" as keyof SmsSettings,
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
                <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                </Button>
            ),
        },
    ]

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
                <DashboardHeader 
                    title="SMS Settings" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={handleAdd}
                        >
                            <Plus className="w-4 h-4" /> Add SMS Setting
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={smsSettings}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No SMS settings found
                                </div>
                            }
                        />
                    </div>
                </section>
                
                <SmsSettingsModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={selectedItem}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default SmsSettingsComp

