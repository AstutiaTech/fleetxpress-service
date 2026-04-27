"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { CreateAccountPayload, Account, AccountType, AccountCategory, UpdateAccountPayload } from "@/types/financialsTypes"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface AccountModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: Account | null
    onSuccess?: () => void
}

const ACCOUNT_TYPES: AccountType[] = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]
const ACCOUNT_CATEGORIES: AccountCategory[] = [
    "CURRENT_ASSET",
    "FIXED_ASSET",
    "CURRENT_LIABILITY",
    "LONG_TERM_LIABILITY",
    "EQUITY",
    "REVENUE",
    "EXPENSE",
]

export function AccountModal({ open, onOpenChange, item, onSuccess }: AccountModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [accounts, setAccounts] = useState<Account[]>([])

    const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<CreateAccountPayload>({
        defaultValues: {
            accountCode: "",
            accountName: "",
            accountType: "ASSET",
            accountCategory: "CURRENT_ASSET",
            parentAccountId: null,
            description: "",
            status: 1,
            openingBalance: "0.00",
        },
    })

    const watchedType = watch("accountType")

    useEffect(() => {
        if (open) {
            loadAccounts()
            if (item) {
                reset({
                    accountCode: item.accountCode,
                    accountName: item.accountName,
                    accountType: item.accountType,
                    accountCategory: item.accountCategory,
                    parentAccountId: item.parentAccountId || null,
                    description: item.description || "",
                    status: item.status,
                    openingBalance: item.openingBalance || "0.00",
                })
            } else {
                reset({
                    accountCode: "",
                    accountName: "",
                    accountType: "ASSET",
                    accountCategory: "CURRENT_ASSET",
                    parentAccountId: null,
                    description: "",
                    status: 1,
                    openingBalance: "0.00",
                })
            }
        }
    }, [item, open, reset])

    const loadAccounts = async () => {
        try {
            const response = await ApiService.getAllAccounts()
            if (response.status && response.data) {
                setAccounts(response.data)
            }
        } catch (error) {
            console.error("Failed to load accounts:", error)
        }
    }

    const onSubmit = async (values: CreateAccountPayload) => {
        setIsSubmitting(true)
        try {
            let response
            if (item) {
                const updatePayload: UpdateAccountPayload = {
                    ...values,
                    parentAccountId: values.parentAccountId || undefined,
                }
                response = await ApiService.updateAccount(item.id, updatePayload)
            } else {
                response = await ApiService.createAccount(values)
            }
            if (response.status && response.data) {
                toastUtils.success(item ? "Updated" : "Created", `Account ${item ? "updated" : "created"} successfully.`)
                onSuccess?.()
            }
        } catch (error) {
            console.error("Failed to save account:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Account" : "Create Account"}</DialogTitle>
                    <DialogDescription>
                        {item ? "Update the account information." : "Create a new account in the chart of accounts."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Account Code *</Label>
                            <Controller
                                control={control}
                                name="accountCode"
                                rules={{ required: "Account code is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="1000" />
                                        {errors.accountCode && (
                                            <p className="text-sm text-destructive">{errors.accountCode.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Name *</Label>
                            <Controller
                                control={control}
                                name="accountName"
                                rules={{ required: "Account name is required" }}
                                render={({ field }) => (
                                    <>
                                        <Input {...field} placeholder="Cash" />
                                        {errors.accountName && (
                                            <p className="text-sm text-destructive">{errors.accountName.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Type *</Label>
                            <Controller
                                control={control}
                                name="accountType"
                                rules={{ required: "Account type is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ACCOUNT_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.accountType && (
                                            <p className="text-sm text-destructive">{errors.accountType.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Category *</Label>
                            <Controller
                                control={control}
                                name="accountCategory"
                                rules={{ required: "Category is required" }}
                                render={({ field }) => (
                                    <>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ACCOUNT_CATEGORIES.map((category) => (
                                                    <SelectItem key={category} value={category}>
                                                        {category.replace(/_/g, " ")}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.accountCategory && (
                                            <p className="text-sm text-destructive">{errors.accountCategory.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Opening Balance</Label>
                            <Controller
                                control={control}
                                name="openingBalance"
                                render={({ field }) => (
                                    <Input {...field} type="number" step="0.01" placeholder="0.00" />
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Parent Account (Optional)</Label>
                            <Controller
                                control={control}
                                name="parentAccountId"
                                render={({ field }) => (
                                    <Select 
                                        value={field.value || "none"} 
                                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select parent account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {accounts
                                                .filter(a => a.id !== item?.id)
                                                .map((a) => (
                                                    <SelectItem key={a.id} value={a.id}>
                                                        {a.accountCode} - {a.accountName}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Controller
                                control={control}
                                name="status"
                                render={({ field }) => (
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={field.value === 1}
                                            onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                        />
                                        <span className="text-sm text-muted-foreground">
                                            {field.value === 1 ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Controller
                            control={control}
                            name="description"
                            render={({ field }) => (
                                <Textarea {...field} placeholder="Account description..." rows={3} />
                            )}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {item ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

