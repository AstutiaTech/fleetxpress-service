"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react"
import { CalculateShippingPriceRequest, CalculateShippingPriceResponse } from "@/types/weightBasedPricingTypes"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { CreateCustomerShipmentPayload, ShipmentParcelInput } from "@/types/financialsTypes"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PaymentMode, Shipment, WhoPaysShippingFee } from "@/types/shipmentTypes"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { useCallback, useEffect, useMemo, useState } from "react"

import { ApiService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Country } from "@/types/geoTypes"
import { DashboardHeader } from "@/components/dashboard-header"
import { GooglePlacesInput } from "@/components/google-places-input"
import { Input } from "@/components/ui/input"
import { InsideCity } from "@/types/insideCityTypes"
import { Label } from "@/components/ui/label"
import { OutsideCity } from "@/types/outsideCityTypes"
import { PageTransition } from "@/providers/page-transition"
import { Recipient } from "@/types/recipientTypes"
import { RecipientForm } from "@/components/recipient/recipient-form"
import { RecipientSelector } from "@/components/recipient/recipient-selector"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { formatPrice } from "@/handlers/formatters"
import useDebounce from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"
import { useStore } from "@/providers/store.provider"

interface ParcelFormValue {
    quantity: string
    isRushHour: boolean
    declaredValue: string // Will be converted to number (monetary amount)
}

interface InvoiceMessageCardProps {
    whoPaysShippingFee?: WhoPaysShippingFee
    recipient?: Recipient | null
}

const InvoiceMessageCard = ({ whoPaysShippingFee, recipient }: InvoiceMessageCardProps) => {
    const recipientName = recipient ? `${recipient.firstName} ${recipient.lastName}` : "the recipient"

    let payer: string
    if (whoPaysShippingFee === "sender") {
        payer = "you (sender)"
    } else if (whoPaysShippingFee === "recipient" && recipient) {
        payer = recipientName
    } else {
        payer = "the recipient"
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert>
                    <AlertDescription>
                        {whoPaysShippingFee && recipient && (
                            <>
                                An invoice for payment will be sent to <strong>{payer}</strong> for shipment based on your selection of who pays for shipping.
                            </>
                        )}
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
}

export default function CreateCustomerShipmentForm() {
    const router = useRouter()
    const { shipmentStore, settingsStore, recipientStore, addressStore } = useStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [shipmentCreated, setShipmentCreated] = useState<Shipment | null>(null)
    const [totalAmount, setTotalAmount] = useState(0)
    const [countries, setCountries] = useState<Country[]>([])
    const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])
    const [insideCityRoutes, setInsideCityRoutes] = useState<InsideCity[]>([])
    const [outsideCityRoutes, setOutsideCityRoutes] = useState<OutsideCity[]>([])
    const [chargeCategory, setChargeCategory] = useState<"inside" | "outside">("inside")
    const [insideChargeId, setInsideChargeId] = useState<number | null>(null)
    const [outsideChargeId, setOutsideChargeId] = useState<number | null>(null)
    const [recipients, setRecipients] = useState<Recipient[]>([])
    const [recipientsLoading, setRecipientsLoading] = useState(false)
    const [recipientSearch, setRecipientSearch] = useState("")
    const [createRecipientDialogOpen, setCreateRecipientDialogOpen] = useState(false)
    const [deliveryLat, setDeliveryLat] = useState<number | null>(null)
    const [deliveryLng, setDeliveryLng] = useState<number | null>(null)

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateCustomerShipmentPayload & { parcels: ParcelFormValue[]; insideCityCharge?: number | null; outsideCityCharge?: number | null; recipientId?: string | null; destinationCountryId?: number }>({
        defaultValues: {
            recipientId: undefined,
            deliveryAddress: "",
            destinationCountryId: 0,
            postalCode: "",
            deliveryOption: "home",
            isDoorPickup: true,
            pickupPointId: "",
            parcels: [{
                quantity: "",
                isRushHour: false,
                declaredValue: "",
            }],
            whoPaysShippingFee: "sender" as WhoPaysShippingFee,
            note: "",
            isScheduled: false,
            scheduledDate: "",
            insideCityCharge: null,
            outsideCityCharge: null,
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "parcels",
    })

    const watchedParcels = watch("parcels")
    const watchedInsideCharge = watch("insideCityCharge")
    const watchedOutsideCharge = watch("outsideCityCharge")
    const watchedRecipientId = watch("recipientId")

    const parseNumber = (value: string | undefined | null): number => {
        if (!value || value === "") return 0
        const parsed = parseFloat(String(value))
        return isNaN(parsed) ? 0 : parsed
    }

    const debouncedRecipientSearch = useDebounce(recipientSearch, 500)

    const loadRecipients = useCallback(async (email: string) => {
        if (!email || !email.includes("@")) {
            setRecipients([])
            return
        }
        setRecipientsLoading(true)
        try {
            // Use ApiService directly to search recipients by email
            const response = await ApiService.getAllRecipients({ search: email, limit: 10 })

            // Handle the API response structure
            if (response && response.status && Array.isArray(response.data)) {
                // Filter duplicates by email (case-insensitive) and id
                const uniqueRecipients = response.data.filter((recipient, index, self) => {
                    // Remove duplicates by id
                    const idIndex = self.findIndex(r => r.id === recipient.id)
                    if (idIndex !== index) return false

                    // Remove duplicates by email (case-insensitive)
                    if (recipient.email) {
                        const emailIndex = self.findIndex(
                            r => r.email && r.email.toLowerCase() === recipient.email?.toLowerCase()
                        )
                        return emailIndex === index
                    }

                    return true
                })

                setRecipients(uniqueRecipients)
            } else {
                console.warn("Unexpected response structure:", response)
                setRecipients([])
            }
        } catch (error) {
            console.error("Failed to load recipients:", error)
            const errorMessage = getErrorMessage(error, "Failed to load recipients")
            toastUtils.error("Error", errorMessage)
            setRecipients([])
        } finally {
            setRecipientsLoading(false)
        }
    }, [])

    const loadInitialData = async () => {
        try {
            const [countriesRes, warehousesRes, insideRoutesRes, outsideRoutesRes] = await Promise.all([
                shipmentStore.fetchCountries({ limit: 200 }),
                ApiService.getAllWarehouses(),
                ApiService.getAllInsideCity(),
                ApiService.getAllOutsideCity(),
            ])
            setCountries(countriesRes)
            if (warehousesRes.status && warehousesRes.data) {
                setWarehouses(warehousesRes.data.map(w => ({ id: w.id, name: w.name })))
            }
            if (insideRoutesRes.status && insideRoutesRes.data) {
                setInsideCityRoutes(insideRoutesRes.data)
            }
            if (outsideRoutesRes.status && outsideRoutesRes.data) {
                setOutsideCityRoutes(outsideRoutesRes.data)
            }
        } catch (error) {
            console.error("Failed to load initial data:", error)
            const errorMessage = getErrorMessage(error, "Failed to load form data")
            toastUtils.error("Error", errorMessage)
        }
    }

    useEffect(() => {
        loadInitialData()
    }, [])

    useEffect(() => {
        if (debouncedRecipientSearch && debouncedRecipientSearch.includes("@")) {
            loadRecipients(debouncedRecipientSearch)
        } else {
            setRecipients([])
        }
    }, [debouncedRecipientSearch, loadRecipients])

    useEffect(() => {
        if (watchedInsideCharge) {
            setInsideChargeId(watchedInsideCharge)
            setChargeCategory("inside")
        }
    }, [watchedInsideCharge])

    useEffect(() => {
        if (watchedOutsideCharge) {
            setOutsideChargeId(watchedOutsideCharge)
            setChargeCategory("outside")
        }
    }, [watchedOutsideCharge])

    const onSubmit = async (values: CreateCustomerShipmentPayload & { parcels: ParcelFormValue[]; insideCityCharge?: number | null; outsideCityCharge?: number | null; recipientId?: string | null }) => {
        setIsSubmitting(true)
        try {
            if (!values.recipientId) {
                toastUtils.error("Recipient Required", "Please select a recipient.")
                setIsSubmitting(false)
                return
            }

            // Convert parcels to the correct format
            const parcels: ShipmentParcelInput[] = values.parcels.map((p: ParcelFormValue) => ({
                quantity: parseNumber(p.quantity) || 1,
                isRushHour: p.isRushHour,
                extraCost: 0,
                ...(p.declaredValue ? { declaredValue: Number(p.declaredValue) || null } : {}),
            }))

            const payload: CreateCustomerShipmentPayload = {
                recipientId: values.recipientId as string,
                destinationCountryId: values.destinationCountryId || 0,
                deliveryAddress: values.deliveryAddress,
                ...(values.postalCode ? { postalCode: values.postalCode } : {}),
                ...(deliveryLat !== null && deliveryLng !== null ? {
                    deliveryLat,
                    deliveryLng,
                } : {}),
                deliveryOption: values.deliveryOption,
                isDoorPickup: true, // Always true
                pickupPointId: values.pickupPointId,
                parcels,
                whoPaysShippingFee: values.whoPaysShippingFee,
                paymentMode: "postpaid" as PaymentMode, // Always postpaid
                ...(values.note ? { note: values.note } : {}),
                isScheduled: values.isScheduled || false,
                ...(values.scheduledDate ? { scheduledDate: values.scheduledDate } : {}),
            }

            const response = await ApiService.createCustomerShipment(payload)
            if (response.status && response.data) {
                setShipmentCreated(response.data.shipment)
                setTotalAmount(response.data.costing?.amount || 0)
                toastUtils.success("Shipment Created", "Your shipment has been created successfully.")
            } else {
                const errorMessage = getErrorMessage(response, "Failed to create shipment")
                toastUtils.error("Failed", errorMessage)
            }
        } catch (error) {
            console.error("Failed to create shipment:", error)
            const errorMessage = getErrorMessage(error, "An error occurred while creating the shipment")
            toastUtils.error("Failed", errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }


    if (shipmentCreated) {
        return (
            <PageTransition>
                <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                    <DashboardHeader title="Shipment Created" />
                    <section className="w-full max-w-full">
                        <Card className="max-w-2xl mx-auto">
                            <CardHeader>
                                <CardTitle>Shipment Created Successfully</CardTitle>
                                <CardDescription>
                                    Your shipment has been created. Payment will be collected on delivery.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tracking Code</Label>
                                    <Input value={shipmentCreated.trackingCode} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>Estimated Amount</Label>
                                    <Input value={formatPrice(totalAmount)} disabled className="text-2xl font-bold" />
                                </div>
                                <Button
                                    onClick={() => router.push(`/shipment-management/shipments/${shipmentCreated.id}`)}
                                    className="w-full"
                                    size="lg"
                                >
                                    View Shipment Details
                                </Button>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
                <DashboardHeader title="Create Shipment" />
                <section className="w-full max-w-full">
                    <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start max-w-7xl mx-auto">
                        <div className="lg:sticky lg:top-24 h-fit">
                            <InvoiceMessageCard
                                whoPaysShippingFee={watch("whoPaysShippingFee")}
                                recipient={recipients.find(r => r.id === watch("recipientId")) || null}
                            />
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recipient Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Recipient *</Label>
                                        <div className="flex gap-2">
                                            <Controller
                                                control={control}
                                                name="recipientId"
                                                rules={{ required: "Recipient is required" }}
                                                render={({ field }) => (
                                                    <div className="flex-1">
                                                        <RecipientSelector
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            options={recipients}
                                                            isLoading={recipientsLoading}
                                                            onSearch={setRecipientSearch}
                                                            onCreateNew={() => setCreateRecipientDialogOpen(true)}
                                                            placeholder="Search recipient by email"
                                                        />
                                                    </div>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCreateRecipientDialogOpen(true)}
                                                title="Create new recipient"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            {createRecipientDialogOpen && (
                                <Dialog open={createRecipientDialogOpen} onOpenChange={setCreateRecipientDialogOpen}>
                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Create New Recipient</DialogTitle>
                                            <DialogDescription>
                                                Create a new recipient that can be reused for future shipments.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <RecipientForm
                                            onSubmit={async (data) => {
                                                // Only accept CreateRecipientPayload, not UpdateRecipientPayload
                                                if ('id' in data) {
                                                    return { success: false }
                                                }
                                                const result = await recipientStore.createRecipient(data)
                                                if (result.status && result.data) {
                                                    setValue("recipientId", result.data.id)
                                                    setRecipients([result.data])
                                                    setCreateRecipientDialogOpen(false)
                                                    toastUtils.success("Recipient Created", "The recipient has been created successfully.")
                                                    return { success: true }
                                                }
                                                return { success: false }
                                            }}
                                            onCancel={() => setCreateRecipientDialogOpen(false)}
                                            addressStore={addressStore}
                                            shipmentStore={shipmentStore}
                                            countries={countries}
                                            countriesLoading={false}
                                        />
                                    </DialogContent>
                                </Dialog>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle>Delivery Address</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Delivery Address *</Label>
                                        <Controller
                                            control={control}
                                            name="deliveryAddress"
                                            rules={{ required: "Delivery address is required" }}
                                            render={({ field }) => (
                                                <GooglePlacesInput
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    onPlaceResolved={({ address, lat, lng }) => {
                                                        field.onChange(address)
                                                        setDeliveryLat(lat)
                                                        setDeliveryLng(lng)
                                                    }}
                                                    onCoordinatesCleared={() => {
                                                        setDeliveryLat(null)
                                                        setDeliveryLng(null)
                                                    }}
                                                    error={errors.deliveryAddress?.message}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Delivery Country *</Label>
                                        <Controller
                                            control={control}
                                            name="destinationCountryId"
                                            rules={{ required: "Delivery country is required", validate: (value) => (value && value > 0) || "Please select a country" }}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value?.toString() || ""}
                                                    onValueChange={(val) => field.onChange(parseInt(val))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select delivery country" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {countries.map((country) => (
                                                            <SelectItem key={country.id} value={country.id.toString()}>
                                                                {country.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.destinationCountryId && (
                                            <p className="text-sm text-destructive">{errors.destinationCountryId.message}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Delivery Options</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Shipping Route *</Label>
                                        <Controller
                                            control={control}
                                            name={chargeCategory === "inside" ? "insideCityCharge" : "outsideCityCharge"}
                                            rules={{ required: "Shipping route is required" }}
                                            render={({ field }) => (
                                                <RadioGroup
                                                    value={chargeCategory}
                                                    onValueChange={(value) => {
                                                        setChargeCategory(value as "inside" | "outside")
                                                        if (value === "inside") {
                                                            setValue("outsideCityCharge", null)
                                                            setOutsideChargeId(null)
                                                        } else {
                                                            setValue("insideCityCharge", null)
                                                            setInsideChargeId(null)
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="inside" id="inside" />
                                                        <Label htmlFor="inside">Inside City</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="outside" id="outside" />
                                                        <Label htmlFor="outside">Outside City</Label>
                                                    </div>
                                                </RadioGroup>
                                            )}
                                        />
                                    </div>
                                    {chargeCategory === "inside" && (
                                        <div className="space-y-2">
                                            <Label>Inside City Route *</Label>
                                            <Controller
                                                control={control}
                                                name="insideCityCharge"
                                                rules={{ required: "Inside city route is required" }}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value?.toString() || ""}
                                                        onValueChange={(val) => {
                                                            const id = parseInt(val)
                                                            field.onChange(id)
                                                            setInsideChargeId(id)
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select inside city route" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {insideCityRoutes.map((route) => (
                                                                <SelectItem key={route.id} value={route.id.toString()}>
                                                                    {route.title}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                    )}
                                    {chargeCategory === "outside" && (
                                        <div className="space-y-2">
                                            <Label>Outside City Route *</Label>
                                            <Controller
                                                control={control}
                                                name="outsideCityCharge"
                                                rules={{ required: "Outside city route is required" }}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value?.toString() || ""}
                                                        onValueChange={(val) => {
                                                            const id = parseInt(val)
                                                            field.onChange(id)
                                                            setOutsideChargeId(id)
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select outside city route" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {outsideCityRoutes.map((route) => (
                                                                <SelectItem key={route.id} value={route.id.toString()}>
                                                                    {route.title}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label>Delivery Option *</Label>
                                        <Controller
                                            control={control}
                                            name="deliveryOption"
                                            render={({ field }) => (
                                                <RadioGroup value={field.value} onValueChange={field.onChange}>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="home" id="home" />
                                                        <Label htmlFor="home">Home Delivery</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="pickup" id="pickup" />
                                                        <Label htmlFor="pickup">Pickup Point</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="same-day" id="same-day" />
                                                        <Label htmlFor="same-day">Same Day</Label>
                                                    </div>
                                                </RadioGroup>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pickup Point *</Label>
                                        <Controller
                                            control={control}
                                            name="pickupPointId"
                                            rules={{ required: "Pickup point is required" }}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select pickup point" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {warehouses.map((w) => (
                                                            <SelectItem key={w.id} value={w.id}>
                                                                {w.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="rounded-md bg-muted p-3">
                                        <p className="text-sm text-muted-foreground">
                                            Door pickup is enabled by default for customer shipments.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Parcel Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="border p-4 rounded-lg space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium">Parcel {index + 1}</h4>
                                                {fields.length > 1 && (
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label>Quantity *</Label>
                                                    <Controller
                                                        control={control}
                                                        name={`parcels.${index}.quantity`}
                                                        rules={{ required: "Quantity is required" }}
                                                        render={({ field }) => <Input type="number" {...field} value={field.value || ""} min="1" />}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Declared Value (₦) *</Label>
                                                    <Controller
                                                        control={control}
                                                        name={`parcels.${index}.declaredValue`}
                                                        rules={{
                                                            required: "Declared value is required.",
                                                            min: {
                                                                value: 0,
                                                                message: "Declared value must be positive.",
                                                            },
                                                        }}
                                                        render={({ field }) => (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="Enter value of goods"
                                                                {...field}
                                                                value={field.value || ""}
                                                                onChange={(e) => field.onChange(e.target.value)}
                                                            />
                                                        )}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Monetary value of goods being shipped
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Controller
                                                        control={control}
                                                        name={`parcels.${index}.isRushHour`}
                                                        render={({ field }) => (
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        )}
                                                    />
                                                    <Label>Send parcels Quickly</Label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => append({
                                            quantity: "1",
                                            isRushHour: false,
                                            declaredValue: "",
                                        })}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Parcel
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment & Shipping</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-md bg-muted p-3">
                                        <p className="text-sm text-muted-foreground">
                                            Payment mode is set to Postpaid (Pay on Delivery) by default for customer shipments.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Who Pays Shipping Fee *</Label>
                                        <Controller
                                            control={control}
                                            name="whoPaysShippingFee"
                                            render={({ field }) => (
                                                <RadioGroup value={field.value} onValueChange={field.onChange}>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="sender" id="sender" />
                                                        <Label htmlFor="sender">Sender</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="recipient" id="recipient" />
                                                        <Label htmlFor="recipient">Recipient</Label>
                                                    </div>
                                                </RadioGroup>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notes</Label>
                                        <Controller
                                            control={control}
                                            name="note"
                                            render={({ field }) => <Textarea {...field} rows={3} />}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-4">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Shipment
                                </Button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </PageTransition>
    )
}

