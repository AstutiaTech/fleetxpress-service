"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { CreateInvoicePayload, InvoiceItem } from "@/types/invoiceTypes"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEffect, useMemo, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { CustomerUser } from "@/types/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/providers/page-transition"
import { Search } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { toastUtils } from "@/utils/toast-utils"
import useDebounce from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"
import { useStore } from "@/providers/store.provider"

interface CreateInvoiceFormValues {
    customerId: string | null
    shipmentId: string | null
    dueDate: string
    tax: number
    discount: number
    items: InvoiceItem[]
    notes: string
    terms: string
}

const defaultItem: InvoiceItem = {
    description: "",
    quantity: 1,
    unitPrice: 0,
    tax: 0,
    discount: 0,
}

export default function CreateInvoiceForm() {
    const router = useRouter()
    const { userStore } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customers, setCustomers] = useState<CustomerUser[]>([])
    const [customersLoading, setCustomersLoading] = useState(false)
    const [customerSearch, setCustomerSearch] = useState("")
    const debouncedCustomerSearch = useDebounce(customerSearch, 400)
    const [customerOpen, setCustomerOpen] = useState(false)

    // Invoice date is current date (read-only)
    const invoiceDate = format(new Date(), "yyyy-MM-dd")
    
    // Default due date is 15 days from today
    const defaultDueDate = format(
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
    )

    const { control, handleSubmit, formState: { errors }, watch } = useForm<CreateInvoiceFormValues>({
        defaultValues: {
            customerId: null,
            shipmentId: null,
            dueDate: defaultDueDate,
            tax: 0,
            discount: 0,
            items: [defaultItem],
            notes: "Payment terms: Net 15",
            terms: "Payment due within 15 days",
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    })

    const items = watch("items")
    const tax = watch("tax")
    const discount = watch("discount")
    const customerId = watch("customerId")

    // Load customers
    const loadCustomers = async (page = 1, searchTerm?: string) => {
        setCustomersLoading(true)
        try {
            const response = await userStore.fetchCustomers({
                page,
                search: searchTerm,
            })
            setCustomers(response.data || [])
        } catch (error) {
            console.error(error)
            toastUtils.error("Failed to Fetch Customers", "Unable to retrieve customers list.")
        } finally {
            setCustomersLoading(false)
        }
    }

    // Load customers on mount
    useEffect(() => {
        loadCustomers(1, undefined)
    }, [])

    // Load customers when search changes
    useEffect(() => {
        if (debouncedCustomerSearch !== undefined) {
            loadCustomers(1, debouncedCustomerSearch || undefined)
        }
    }, [debouncedCustomerSearch])

    const selectedCustomer = customers.find((c) => c.id === customerId)

    // Calculate totals
    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const itemTotal = item.quantity * item.unitPrice
            const itemTax = item.tax || 0
            const itemDiscount = item.discount || 0
            return sum + itemTotal + itemTax - itemDiscount
        }, 0)
    }, [items])

    const total = useMemo(() => {
        return subtotal + (tax || 0) - (discount || 0)
    }, [subtotal, tax, discount])

    const onSubmit = async (values: CreateInvoiceFormValues) => {
        if (!values.customerId) {
            toastUtils.error("Customer Required", "Please select a customer.")
            return
        }

        if (!values.items.length || values.items.some(item => !item.description || item.unitPrice <= 0)) {
            toastUtils.error("Invalid Items", "Please ensure all items have a description and valid unit price.")
            return
        }

        setIsSubmitting(true)
        try {
            const payload: CreateInvoicePayload = {
                customerId: values.customerId,
                shipmentId: values.shipmentId || undefined,
                invoiceDate: invoiceDate,
                dueDate: values.dueDate,
                tax: values.tax || 0,
                discount: values.discount || 0,
                items: values.items,
                notes: values.notes || undefined,
                terms: values.terms || undefined,
            }

            const response = await ApiService.createInvoice(payload)
            
            if (response.status && response.data) {
                toastUtils.success("Invoice Created", "The invoice has been created successfully.")
                router.push("/invoices")
            } else {
                toastUtils.error("Creation Failed", response.message || "Failed to create invoice.")
            }
        } catch (error) {
            toastUtils.error("Creation Failed", "An error occurred while creating the invoice.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-6 pb-14">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <DashboardHeader title="Create Invoice" />
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Information</CardTitle>
                            <CardDescription>Basic invoice details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Invoice Date</Label>
                                    <Input type="date" value={invoiceDate} disabled />
                                    <p className="text-xs text-muted-foreground">Set to current date</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date *</Label>
                                    <Controller
                                        control={control}
                                        name="dueDate"
                                        rules={{ required: "Due date is required" }}
                                        render={({ field }) => (
                                            <>
                                                <Input type="date" {...field} />
                                                {errors.dueDate && (
                                                    <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Customer *</Label>
                                <Controller
                                    control={control}
                                    name="customerId"
                                    rules={{ required: "Customer selection is required" }}
                                    render={({ field }) => (
                                        <>
                                            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn("w-full justify-between", !selectedCustomer && "text-muted-foreground")}
                                                    >
                                                        {selectedCustomer ? (
                                                            <div className="text-left">
                                                                <p className="font-medium">
                                                                    {selectedCustomer.profile?.firstName} {selectedCustomer.profile?.lastName}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                                                            </div>
                                                        ) : (
                                                            "Select customer"
                                                        )}
                                                        <Search className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-0">
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search customers..."
                                                            value={customerSearch}
                                                            onValueChange={setCustomerSearch}
                                                        />
                                                        <CommandList>
                                                            {customersLoading && <CommandEmpty>Loading customers...</CommandEmpty>}
                                                            {!customersLoading && customers.length === 0 && <CommandEmpty>No customers found.</CommandEmpty>}
                                                            <CommandGroup>
                                                                {customers.map((customer) => (
                                                                    <CommandItem
                                                                        key={customer.id}
                                                                        onSelect={() => {
                                                                            field.onChange(customer.id)
                                                                            setCustomerOpen(false)
                                                                        }}
                                                                    >
                                                                        <div className="space-y-0.5">
                                                                            <p className="font-medium">
                                                                                {customer.profile?.firstName} {customer.profile?.lastName}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {errors.customerId && (
                                                <p className="text-sm text-destructive">{errors.customerId.message}</p>
                                            )}
                                        </>
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Shipment ID (Optional)</Label>
                                <Controller
                                    control={control}
                                    name="shipmentId"
                                    render={({ field }) => (
                                        <Input {...field} placeholder="Enter shipment ID if applicable" />
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Items</CardTitle>
                            <CardDescription>Add items to the invoice</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Item {index + 1}</Label>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => remove(index)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="md:col-span-2 space-y-2">
                                            <Label>Description *</Label>
                                            <Controller
                                                control={control}
                                                name={`items.${index}.description`}
                                                rules={{ required: "Description is required" }}
                                                render={({ field }) => (
                                                    <>
                                                        <Input {...field} placeholder="Item description" />
                                                        {errors.items?.[index]?.description && (
                                                            <p className="text-sm text-destructive">
                                                                {errors.items[index]?.description?.message}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Quantity *</Label>
                                            <Controller
                                                control={control}
                                                name={`items.${index}.quantity`}
                                                rules={{ 
                                                    required: "Quantity is required",
                                                    min: { value: 1, message: "Quantity must be at least 1" }
                                                }}
                                                render={({ field }) => (
                                                    <>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            {...field}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                        {errors.items?.[index]?.quantity && (
                                                            <p className="text-sm text-destructive">
                                                                {errors.items[index]?.quantity?.message}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Unit Price (₦) *</Label>
                                            <Controller
                                                control={control}
                                                name={`items.${index}.unitPrice`}
                                                rules={{ 
                                                    required: "Unit price is required",
                                                    min: { value: 0, message: "Unit price must be 0 or greater" }
                                                }}
                                                render={({ field }) => (
                                                    <>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min={0}
                                                            {...field}
                                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                                        />
                                                        {errors.items?.[index]?.unitPrice && (
                                                            <p className="text-sm text-destructive">
                                                                {errors.items[index]?.unitPrice?.message}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Tax (₦)</Label>
                                            <Controller
                                                control={control}
                                                name={`items.${index}.tax`}
                                                rules={{ min: { value: 0, message: "Tax must be 0 or greater" } }}
                                                render={({ field }) => (
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min={0}
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Discount (₦)</Label>
                                            <Controller
                                                control={control}
                                                name={`items.${index}.discount`}
                                                rules={{ min: { value: 0, message: "Discount must be 0 or greater" } }}
                                                render={({ field }) => (
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min={0}
                                                        {...field}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <div className="text-sm text-muted-foreground">
                                                Item Total: {formatPrice(
                                                    (items[index]?.quantity || 0) * (items[index]?.unitPrice || 0) +
                                                    (items[index]?.tax || 0) -
                                                    (items[index]?.discount || 0)
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => append(defaultItem)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Totals</CardTitle>
                            <CardDescription>Invoice totals and adjustments</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Tax (₦)</Label>
                                    <Controller
                                        control={control}
                                        name="tax"
                                        rules={{ min: { value: 0, message: "Tax must be 0 or greater" } }}
                                        render={({ field }) => (
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                {...field}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                        )}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Discount (₦)</Label>
                                    <Controller
                                        control={control}
                                        name="discount"
                                        rules={{ min: { value: 0, message: "Discount must be 0 or greater" } }}
                                        render={({ field }) => (
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                {...field}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal:</span>
                                    <span className="font-medium">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax:</span>
                                    <span className="font-medium">{formatPrice(tax || 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Discount:</span>
                                    <span className="font-medium">{formatPrice(discount || 0)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                    <span>Total:</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Information</CardTitle>
                            <CardDescription>Notes and terms</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Controller
                                    control={control}
                                    name="notes"
                                    render={({ field }) => (
                                        <Textarea {...field} rows={3} placeholder="Additional notes" />
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Terms</Label>
                                <Controller
                                    control={control}
                                    name="terms"
                                    render={({ field }) => (
                                        <Textarea {...field} rows={3} placeholder="Payment terms" />
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Review all information before creating the invoice.
                        </p>
                        <Button type="submit" disabled={isSubmitting} className="min-w-[180px]">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Invoice
                        </Button>
                    </div>
                </form>
            </div>
        </PageTransition>
    )
}

