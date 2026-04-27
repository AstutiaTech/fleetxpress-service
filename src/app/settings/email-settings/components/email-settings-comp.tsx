 "use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DashboardHeader } from "@/components/dashboard-header"
import { Switch } from "@/components/ui/switch"
import { Edit, Plus } from "lucide-react"
import { EmailSettings } from "@/types/emailTypes"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { EmailSettingsModal } from "./email-settings-modal"
import { EmailNotificationPreferences } from "@/types/emailNotificationTypes"

const SHIPMENT_TRIGGERS = [
  { value: "on_creation", label: "On Creation" },
  { value: "on_pickup", label: "On Pickup" },
  { value: "on_in_transit", label: "In Transit" },
  { value: "on_delivered", label: "On Delivered" },
  { value: "on_cancelled", label: "On Cancelled" },
  { value: "on_payment_received", label: "Payment Received" },
  { value: "on_payment_pending", label: "Payment Pending" },
] as const

const SHIPMENT_RECEIVERS = [
  { value: "superadmin", label: "Superadmin" },
  { value: "admin", label: "Admin" },
  { value: "customer", label: "Customer" },
] as const

export const EmailSettingsComp = observer(() => {
    const [emailSettings, setEmailSettings] = useState<EmailSettings[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<EmailSettings | null>(null)

    const [preferences, setPreferences] = useState<EmailNotificationPreferences | null>(null)
    const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
    const [isSavingPreferences, setIsSavingPreferences] = useState(false)

    useEffect(() => {
        loadEmailSettings()
        loadEmailNotificationPreferences()
    }, [])

    const loadEmailSettings = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllEmailSettings()
            if (response.status && response.data) {
                setEmailSettings(response.data)
            }
        } catch (error) {
            toastUtils.error("Failed to Load", "Unable to fetch email settings.")
        } finally {
            setIsLoading(false)
        }
    }

    const loadEmailNotificationPreferences = async () => {
        setIsLoadingPreferences(true)
        try {
            const response = await ApiService.getEmailNotificationPreferences()
            if (response.status && response.data) {
                setPreferences(response.data)
            } else {
                toastUtils.error("Failed to Load", response.message || "Unable to fetch email notification preferences.")
            }
        } catch (error) {
            toastUtils.error("Failed to Load", "Unable to fetch email notification preferences.")
        } finally {
            setIsLoadingPreferences(false)
        }
    }

    const handleEdit = (item: EmailSettings) => {
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
        loadEmailSettings()
        handleModalClose()
    }

    const toggleTrigger = (trigger: string) => {
        if (!preferences) return

        const currentTriggers = preferences.shipmentTriggers || []
        const newTriggers = currentTriggers.includes(trigger)
            ? currentTriggers.filter((t) => t !== trigger)
            : [...currentTriggers, trigger]

        setPreferences({
            ...preferences,
            shipmentTriggers: newTriggers,
        })
    }

    const toggleReceiver = (receiver: string) => {
        if (!preferences) return

        const currentReceivers = preferences.shipmentReceivers || []
        const newReceivers = currentReceivers.includes(receiver)
            ? currentReceivers.filter((r) => r !== receiver)
            : [...currentReceivers, receiver]

        setPreferences({
            ...preferences,
            shipmentReceivers: newReceivers,
        })
    }

    const toggleBoolean = (
        field: "staffAccountCreation" | "customerAccountCreation" | "accountDisabled" | "accountReEnabled"
    ) => {
        if (!preferences) return

        const newValue = preferences[field] === 1 ? 0 : 1
        setPreferences({
            ...preferences,
            [field]: newValue,
        })
    }

    const applyPreferences = async () => {
        if (!preferences) return

        try {
            setIsSavingPreferences(true)
            const {
                shipmentTriggers,
                shipmentReceivers,
                staffAccountCreation,
                customerAccountCreation,
                accountDisabled,
                accountReEnabled,
            } = preferences

            const response = await ApiService.updateEmailNotificationPreferences({
                shipmentTriggers,
                shipmentReceivers,
                staffAccountCreation,
                customerAccountCreation,
                accountDisabled,
                accountReEnabled,
            })

            if (response.status && response.data) {
                setPreferences(response.data)
                toastUtils.success("Updated", "Email notification preferences updated successfully.")
            } else {
                toastUtils.error("Failed to Update", response.message || "Unable to update email notification preferences.")
            }
        } catch (error) {
            toastUtils.error("Failed to Update", "Unable to update email notification preferences.")
        } finally {
            setIsSavingPreferences(false)
        }
    }

    const columns: CustomTableColumn<EmailSettings>[] = [
        {
            header: "Provider",
            accessor: "provider" as keyof EmailSettings,
            className: "font-medium",
        },
        {
            header: "From Name",
            accessor: "mailFromName" as keyof EmailSettings,
        },
        {
            header: "From Email",
            accessor: "mailFromEmail" as keyof EmailSettings,
        },
        {
            header: "Mail Host",
            accessor: "mailHost" as keyof EmailSettings,
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
            <div className="flex flex-1 flex-col gap-6 w-full max-w-full min-h-screen pb-14">
                <DashboardHeader 
                    title="Email Settings" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={handleAdd}
                        >
                            <Plus className="w-4 h-4" /> Add Email Setting
                        </Button>
                    ]} 
                />

                {/* Email transport/settings table */}
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={emailSettings}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No email settings found
                                </div>
                            }
                        />
                    </div>
                </section>

                {/* Email Notification Preferences */}
                <section className="w-full max-w-3xl">
                    <div className="rounded-xl border bg-card shadow-sm p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold">Email Notification Preferences</h2>
                            <p className="text-sm text-muted-foreground">
                                Configure when and to whom shipment and account emails should be sent.
                            </p>
                        </div>

                        {isLoadingPreferences && (
                            <div className="text-sm text-muted-foreground">
                                Loading email notification preferences...
                            </div>
                        )}

                        {!isLoadingPreferences && !preferences && (
                            <div className="text-sm text-destructive">
                                Unable to load email notification preferences.
                            </div>
                        )}

                        {preferences && (
                            <div className="space-y-8">
                                {/* Shipment Triggers */}
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Shipment Triggers</h3>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Choose when shipment emails should be sent.
                                    </p>
                                    <div className="space-y-2">
                                        {SHIPMENT_TRIGGERS.map((trigger) => (
                                            <label
                                                key={trigger.value}
                                                className="flex items-center space-x-2 text-sm"
                                            >
                                                <Checkbox
                                                    checked={preferences.shipmentTriggers?.includes(trigger.value) || false}
                                                    onCheckedChange={() => toggleTrigger(trigger.value)}
                                                    disabled={isSavingPreferences}
                                                />
                                                <span>{trigger.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Shipment Receivers */}
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Shipment Receivers</h3>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Choose who should receive shipment-related emails.
                                    </p>
                                    <div className="space-y-2">
                                        {SHIPMENT_RECEIVERS.map((receiver) => (
                                            <label
                                                key={receiver.value}
                                                className="flex items-center space-x-2 text-sm"
                                            >
                                                <Checkbox
                                                    checked={preferences.shipmentReceivers?.includes(receiver.value) || false}
                                                    onCheckedChange={() => toggleReceiver(receiver.value)}
                                                    disabled={isSavingPreferences}
                                                />
                                                <span>{receiver.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Account Creation */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Account Creation</h3>

                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Staff Account Creation</p>
                                            <p className="text-xs text-muted-foreground">
                                                Send email when a staff account is created.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.staffAccountCreation === 1}
                                            onCheckedChange={() => toggleBoolean("staffAccountCreation")}
                                            disabled={isSavingPreferences}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Customer Account Creation</p>
                                            <p className="text-xs text-muted-foreground">
                                                Send email when a customer account is created.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.customerAccountCreation === 1}
                                            onCheckedChange={() => toggleBoolean("customerAccountCreation")}
                                            disabled={isSavingPreferences}
                                        />
                                    </div>
                                </div>

                                {/* Account Updates */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Account Updates</h3>

                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Account Disabled</p>
                                            <p className="text-xs text-muted-foreground">
                                                Send email when an account is disabled.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.accountDisabled === 1}
                                            onCheckedChange={() => toggleBoolean("accountDisabled")}
                                            disabled={isSavingPreferences}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Account Re-enabled</p>
                                            <p className="text-xs text-muted-foreground">
                                                Send email when an account is re-enabled.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.accountReEnabled === 1}
                                            onCheckedChange={() => toggleBoolean("accountReEnabled")}
                                            disabled={isSavingPreferences}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    {isSavingPreferences && (
                                        <p className="text-xs text-muted-foreground">Saving changes...</p>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={applyPreferences}
                                        disabled={isSavingPreferences}
                                    >
                                        Apply Changes
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
                
                <EmailSettingsModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={selectedItem}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default EmailSettingsComp

