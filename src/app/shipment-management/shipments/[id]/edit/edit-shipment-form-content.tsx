"use client"

import { Address, CreateAddressPayload } from "@/types/addressTypes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalculateShippingPriceRequest, CalculateShippingPriceResponse } from "@/types/weightBasedPricingTypes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { City, Country, LGA, State } from "@/types/geoTypes"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { Copy, Link as LinkIcon, Loader2, Plus, Trash2 } from "lucide-react"
import { CreateRecipientPayload, Recipient } from "@/types/recipientTypes"
import { CreateShipmentPayload, Shipment, ShipmentParcelInput } from "@/types/shipmentTypes"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { useCallback, useEffect, useMemo, useState } from "react"

import { AddressForm } from "@/components/address/address-form"
import { AddressSelector } from "@/components/address/address-selector"
import { AlertTriangle } from "lucide-react"
import { ApiService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CostingRate } from "@/types/costingTypes"
import { CreatePaystackPaymentLinkPayload } from "@/types/financialsTypes"
import { CustomerModal } from "@/app/users-management/customers/components/customer-modal"
import { CustomerUser } from "@/types/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { Input } from "@/components/ui/input"
import { InsideCity } from "@/types/insideCityTypes"
import { Label } from "@/components/ui/label"
import { OutsideCity } from "@/types/outsideCityTypes"
import { Packaging } from "@/types/packagingType"
import { PageTransition } from "@/providers/page-transition"
import { RecipientForm } from "@/components/recipient/recipient-form"
import { RecipientSelector } from "@/components/recipient/recipient-selector"
import { Search } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { UpdateParcelPayload } from "@/types/parcelTypes"
import { WareHouse } from "@/types/warehousesType"
import { cn } from "@/lib/utils"
import { observer } from "mobx-react-lite"
import useDebounce from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"
import { useStore } from "@/providers/store.provider"

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const amountFormatter = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatCurrency = (value: number) => currencyFormatter.format(isNaN(value) ? 0 : value)

const formatNumber = (value: number) => amountFormatter.format(isNaN(value) ? 0 : value)

const formatDeliveryOption = (value: EditShipmentFormValues["deliveryOption"]) => {
  if (value === "same-day") {
    return "Same Day"
  }
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const calculateDistanceKm = (from?: { lat: number; lng: number }, to?: { lat: number; lng: number }) => {
  if (!from || !to) return null
  const earthRadius = 6371 // km
  const toRad = (val: number) => (val * Math.PI) / 180
  const dLat = toRad(to.lat - from.lat)
  const dLon = toRad(to.lng - from.lng)
  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = earthRadius * c
  return Number.isFinite(distance) ? distance : null
}

interface SummaryBreakdown {
  amount: number
  baseCharge: number
  packagingCharge: number
  parcelExtra: number
  rushHourCharge: number
  vat: number
  tax: number
  insurance: number
  totalShippingFee: number
  volumetricWeight: number
  shippingType: string
  distanceKm: number | null
  insuranceThreshold?: number
  isInsuranceApplicable?: boolean
}

interface SummaryCardProps {
  breakdown: SummaryBreakdown
  calculatingPrice?: boolean
  priceCalculationError?: string | null
  priceDetails?: CalculateShippingPriceResponse | null
}

const SummaryCard = ({ breakdown, calculatingPrice, priceCalculationError, priceDetails }: SummaryCardProps) => {
  const {
    amount,
    volumetricWeight,
    shippingType,
    distanceKm,
    baseCharge,
    packagingCharge,
    parcelExtra,
    rushHourCharge,
    vat,
    tax,
    insurance,
    totalShippingFee,
    insuranceThreshold,
    isInsuranceApplicable,
  } = breakdown

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipment Summary</CardTitle>
        <CardDescription>Automatically updated as you fill the form</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {calculatingPrice && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Calculating shipping price...</AlertDescription>
          </Alert>
        )}
        {priceCalculationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{priceCalculationError}</AlertDescription>
          </Alert>
        )}
        {priceDetails && !calculatingPrice && (
          <Alert>
            <AlertDescription className="text-xs space-y-1">
              <div className="font-medium">Price Calculation Details:</div>
              <div>Weight Used: {priceDetails.appliedKg}kg
                {priceDetails.actualWeightKg && priceDetails.actualWeightKg !== priceDetails.appliedKg && (
                  <span className="text-muted-foreground ml-1">
                    (from {priceDetails.actualWeightKg}kg)
                  </span>
                )}
              </div>
              {priceDetails.volumetricWeightKg && (
                <div>Volumetric Weight: {priceDetails.volumetricWeightKg}kg</div>
              )}
              <div>Pricing Basis: {priceDetails.pricingBasis === "volumetricOverride" ? "Volumetric Override" : "Weight Tier"}</div>
              {priceDetails.usedFallback && (
                <div className="text-yellow-600 dark:text-yellow-400">⚠ Fallback policy was used</div>
              )}
            </AlertDescription>
          </Alert>
        )}
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="text-2xl font-semibold">{formatCurrency(amount)}</p>
        </div>
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Volumetric Weight</span>
            <span className="font-medium">{formatNumber(volumetricWeight)} kg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Shipping Type</span>
            <Badge variant="outline">{shippingType}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Distance</span>
            <span className="font-medium">
              {distanceKm ? `${formatNumber(distanceKm)} km` : "Pending selection"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Base Charge</span>
            {calculatingPrice ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Calculating...</span>
              </div>
            ) : (
              <span className="font-medium">{formatCurrency(baseCharge)}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Packaging Charge</span>
            <span className="font-medium">{formatCurrency(packagingCharge)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Parcel Extras</span>
            <span className="font-medium">{formatCurrency(parcelExtra)}</span>
          </div>
          {rushHourCharge > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rush Hour Charge</span>
              <span className="font-medium">{formatCurrency(rushHourCharge)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">VAT</span>
            <span className="font-medium">{formatCurrency(vat)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Insurance
              {insuranceThreshold !== undefined && insuranceThreshold !== null && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {isInsuranceApplicable
                    ? `(Applied - threshold: ${formatCurrency(insuranceThreshold)})`
                    : `(Not applied - below threshold: ${formatCurrency(insuranceThreshold)})`}
                </span>
              )}
            </span>
            <span className="font-medium">{formatCurrency(insurance)}</span>
          </div>
          {!isInsuranceApplicable && insuranceThreshold !== undefined && insuranceThreshold !== null && (
            <Alert className="mt-2">
              <AlertDescription className="text-xs">
                Insurance is not applied because the shipment value ({formatCurrency(amount)}) is below the threshold of {formatCurrency(insuranceThreshold)}.
              </AlertDescription>
            </Alert>
          )}
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between font-semibold">
              <span>Total Shipping Fee</span>
              <span>{formatCurrency(totalShippingFee)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type ParcelFormValue = {
  packagingId: number | null
  length: string
  width: string
  height: string
  weight: string | null // Optional if dimensions are provided
  quantity: string
  isRushHour: boolean
  extraCost: string
  declaredValue: string // Will be converted to number (monetary amount)
}

interface EditShipmentFormValues {
  recipientId: string | null
  recipientOption: "existing" | "new"
  senderAddressId: string | null
  destinationAddressId: string | null
  destinationCountryId: number | null
  destinationStateId: number | null
  destinationCityId: number | null
  destinationLgaId: number | null
  senderCountryId: number | null
  senderStateId: number | null
  senderCityId: number | null
  senderLgaId: number | null
  recipientFirstName: string
  recipientLastName: string
  recipientPhoneNumber: string
  recipientEmail: string
  recipientAddress: string
  senderId: string | null
  deliveryOption: "home" | "pickup" | "same-day"
  isDoorPickup: boolean
  pickupPointId: string | null
  deliveryAddress: string
  deliveryLat: number | null
  deliveryLng: number | null
  insideCityCharge: number | null
  outsideCityCharge: number | null
  parcels: ParcelFormValue[]
  whoPaysShippingFee: "sender" | "recipient"
  paymentType: "cash" | "card" | "transfer"
  paymentMode: "prepaid" | "postpaid"
  note: string
  isScheduled: boolean
  scheduledDate: string | null
  countryId: number | null
  applyInsurance: boolean
  customInsuranceAmount: string
  externalPaymentReference: string
}

const parseNumber = (value: number | string | null | undefined) => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value ?? 0
  return Number.isFinite(numericValue) ? numericValue : 0
}

interface EditShipmentFormContentProps {
  shipmentId: string
  shipment: Shipment
}

export const EditShipmentFormContent = observer(({ shipmentId, shipment }: EditShipmentFormContentProps) => {
  const router = useRouter()
  const { shipmentStore, recipientStore, addressStore, userStore, settingsStore } = useStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [lgas, setLgas] = useState<LGA[]>([])
  const [senderStates, setSenderStates] = useState<State[]>([])
  const [senderCities, setSenderCities] = useState<City[]>([])
  const [senderLgas, setSenderLgas] = useState<LGA[]>([])
  const [packagings, setPackagings] = useState<Packaging[]>([])
  const [warehouses, setWarehouses] = useState<WareHouse[]>([])
  const [insideCityRoutes, setInsideCityRoutes] = useState<InsideCity[]>([])
  const [outsideCityRoutes, setOutsideCityRoutes] = useState<OutsideCity[]>([])
  const [customers, setCustomers] = useState<CustomerUser[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState("")
  const [createRecipientDialogOpen, setCreateRecipientDialogOpen] = useState(false)
  const [createAddressDialogOpen, setCreateAddressDialogOpen] = useState(false)
  const [createCustomerDialogOpen, setCreateCustomerDialogOpen] = useState(false)
  const [senderSearch, setSenderSearch] = useState("")
  const [sendersLoading, setSendersLoading] = useState(false)
  const [userAddresses, setUserAddresses] = useState<Address[]>([])
  const [userAddressesLoading, setUserAddressesLoading] = useState(false)
  const [chargeCategory, setChargeCategory] = useState<"inside" | "outside">("inside")
  const [loading, setLoading] = useState(true)
  
  // Price calculation state
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
  const [priceDetails, setPriceDetails] = useState<CalculateShippingPriceResponse | null>(null)
  const [calculatingPrice, setCalculatingPrice] = useState(false)
  const [priceCalculationError, setPriceCalculationError] = useState<string | null>(null)
  const [costings, setCostings] = useState<CostingRate[]>([])
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState(false)

  const debouncedRecipientSearch = useDebounce(recipientSearch, 500)
  const debouncedSenderSearch = useDebounce(senderSearch, 400)

  // SenderSelect component
  interface SenderSelectProps {
    value: string | null
    onChange: (id: string) => void
    options: CustomerUser[]
    isLoading: boolean
    onSearch: (term: string) => void
  }

  const SenderSelect = ({ value, onChange, options, isLoading, onSearch }: SenderSelectProps) => {
    const [open, setOpen] = useState(false)
    const selected = options.find((option) => option.id === value)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn("w-full justify-between", !selected && "text-muted-foreground")}
          >
            {selected ? (
              <div className="text-left">
                <p className="font-medium">
                  {selected.profile?.firstName} {selected.profile?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{selected.email}</p>
              </div>
            ) : (
              "Select sender"
            )}
            <Search className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search customers..." onValueChange={onSearch} />
            <CommandList>
              {isLoading && <CommandEmpty>Loading customers...</CommandEmpty>}
              {!isLoading && options.length === 0 && <CommandEmpty>No customers found.</CommandEmpty>}
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    onSelect={() => {
                      onChange(option.id)
                      setOpen(false)
                    }}
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium">
                        {option.profile?.firstName} {option.profile?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{option.email}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  const loadRecipients = useCallback(async (email: string) => {
    if (!email || !email.includes("@")) {
      setRecipients([])
      return
    }
    setRecipientsLoading(true)
    try {
      const response = await ApiService.getAllRecipients({ search: email, limit: 10 })
      if (response && response.status && Array.isArray(response.data)) {
        // Filter duplicates
        const uniqueRecipients = response.data.filter((recipient, index, self) => {
          const idIndex = self.findIndex(r => r.id === recipient.id)
          if (idIndex !== index) return false
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
        setRecipients([])
      }
    } catch (error) {
      console.error("Failed to load recipients:", error)
      setRecipients([])
    } finally {
      setRecipientsLoading(false)
    }
  }, [])

  // Load recipients when searching
  useEffect(() => {
    if (debouncedRecipientSearch && debouncedRecipientSearch.includes("@")) {
      loadRecipients(debouncedRecipientSearch)
    } else {
      setRecipients([])
    }
  }, [debouncedRecipientSearch, loadRecipients])

  // Load senders when searching
  const handleLoadSenders = useCallback(async (page: number = 1, search?: string) => {
    setSendersLoading(true)
    try {
      const response = await userStore.fetchCustomers({
        page,
        limit: 20,
        search,
      })
      if (response.status && response.data) {
        setCustomers(response.data)
      }
    } catch (error) {
      console.error("Failed to load senders:", error)
    } finally {
      setSendersLoading(false)
    }
  }, [userStore])

  useEffect(() => {
    handleLoadSenders(1, undefined)
  }, [])

  useEffect(() => {
    handleLoadSenders(1, debouncedSenderSearch || undefined)
  }, [debouncedSenderSearch, handleLoadSenders])

  // Load user addresses when sender is selected and not door pickup
  const handleLoadUserAddresses = useCallback(async (userId: string) => {
    if (!userId) return
    setUserAddressesLoading(true)
    try {
      const response = await addressStore.fetchUserAddresses(userId)
      if (response.status && response.data) {
        setUserAddresses(response.data)
      }
    } catch (error) {
      console.error("Failed to load user addresses:", error)
    } finally {
      setUserAddressesLoading(false)
    }
  }, [addressStore])

  // Pre-fill form with shipment data
  const defaultValues = useMemo<EditShipmentFormValues>(() => {
    const parcels = shipment.parcels?.map((p) => ({
      packagingId: p.packagingId || null,
      length: p.length?.toString() || "",
      width: p.width?.toString() || "",
      height: p.height?.toString() || "",
      weight: p.weight?.toString() || "",
      quantity: p.quantity?.toString() || "",
      isRushHour: p.isRushHour || false,
      extraCost: p.extraCost?.toString() || "",
      declaredValue: p.declaredValue?.toString() || "",
    })) || []

    return {
      recipientId: shipment.recipientId || null,
      recipientOption: shipment.recipientId ? "existing" : "new",
      senderAddressId: shipment.senderAddressId || null,
      destinationAddressId: shipment.destinationAddressId || null,
      destinationCountryId: shipment.destinationCountryId || shipment.destinationCountry?.id || null,
      destinationStateId: shipment.destinationStateId || shipment.destinationState?.id || null,
      destinationCityId: shipment.destinationCityId || shipment.destinationCity?.id || null,
      destinationLgaId: shipment.destinationLgaId || shipment.destinationLga?.id || null,
      senderCountryId: shipment.senderCountryId || null,
      senderStateId: shipment.senderStateId || null,
      senderCityId: shipment.senderCityId || null,
      senderLgaId: shipment.senderLgaId || null,
      recipientFirstName: shipment.recipientFirstName || shipment.recipient?.firstName || "",
      recipientLastName: shipment.recipientLastName || shipment.recipient?.lastName || "",
      recipientPhoneNumber: shipment.recipientPhoneNumber || shipment.recipient?.phoneNumber || "",
      recipientEmail: shipment.recipientEmail || shipment.recipient?.email || "",
      recipientAddress: shipment.recipientAddress || shipment.recipient?.address?.street || "",
      senderId: shipment.senderId || null,
      deliveryOption: shipment.deliveryOption || "home",
      isDoorPickup: shipment.isDoorPickup ?? true,
      pickupPointId: shipment.pickupPointId || null,
      deliveryAddress: shipment.deliveryAddress || "",
      deliveryLat: shipment.deliveryLat || null,
      deliveryLng: shipment.deliveryLng || null,
      insideCityCharge: shipment.insideCityCharge || null,
      outsideCityCharge: shipment.outsideCityCharge || null,
      parcels: parcels.length > 0 ? parcels : [{
        packagingId: null,
        length: "",
        width: "",
        height: "",
        weight: "",
        quantity: "",
        isRushHour: false,
        extraCost: "",
        declaredValue: "",
      }],
      whoPaysShippingFee: shipment.whoPaysShippingFee || "sender",
      paymentType: shipment.paymentType || "cash",
      paymentMode: shipment.paymentMode || "postpaid",
      note: shipment.note || "",
      isScheduled: shipment.isScheduled || false,
      scheduledDate: shipment.scheduledDate || null,
      countryId: shipment.countryId || shipment.country?.id || null,
      applyInsurance: false,
      customInsuranceAmount: "",
      externalPaymentReference: (shipment as any).externalPaymentReference || "",
    }
  }, [shipment])

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<EditShipmentFormValues>({
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "parcels",
  })

  // Watch form values for sender and door pickup
  const watchedSenderId = watch("senderId")
  const watchedIsDoorPickup = watch("isDoorPickup")

  // Load user addresses when sender is selected and not door pickup
  useEffect(() => {
    if (watchedSenderId && !watchedIsDoorPickup) {
      handleLoadUserAddresses(watchedSenderId)
    }
  }, [watchedSenderId, watchedIsDoorPickup, handleLoadUserAddresses])

  // Load current recipient if exists
  useEffect(() => {
    if (shipment?.recipientId && shipment.recipient) {
      setRecipients([shipment.recipient])
    }
  }, [shipment])

  // Load current sender address if exists
  useEffect(() => {
    if (shipment?.senderAddressId && shipment.senderAddress) {
      setUserAddresses([shipment.senderAddress])
    }
  }, [shipment])

  // Reset form when shipment data is loaded
  useEffect(() => {
    if (shipment && Object.keys(defaultValues).length > 0) {
      reset(defaultValues)
      // Set charge category based on which charge is present
      if (shipment.insideCityCharge) {
        setChargeCategory("inside")
      } else if (shipment.outsideCityCharge) {
        setChargeCategory("outside")
      }
      setLoading(false)
    }
  }, [shipment, defaultValues, reset])

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Watch form values (must be before early return)
  const selectedInsideCharge = insideCityRoutes.find(r => r.id === watch("insideCityCharge"))
  const selectedOutsideCharge = outsideCityRoutes.find(r => r.id === watch("outsideCityCharge"))
  const insideChargeId = watch("insideCityCharge")
  const outsideChargeId = watch("outsideCityCharge")
  const parcels = watch("parcels")
  const deliveryOption = watch("deliveryOption")
  const deliveryLat = watch("deliveryLat")
  const deliveryLng = watch("deliveryLng")
  const pickupPointId = watch("pickupPointId")

  const rushHourPricing = useMemo(
    () => costings.find((rate) => rate.slug === "rush-hour") || null,
    [costings]
  )

  const selectedWarehouse = useMemo(() => {
    if (!pickupPointId) return null
    return warehouses.find((warehouse) => warehouse.id === pickupPointId) || null
  }, [pickupPointId, warehouses])

  const deliveryCoords = useMemo(() => {
    if (deliveryLat == null || deliveryLng == null) return null
    return { lat: deliveryLat, lng: deliveryLng }
  }, [deliveryLat, deliveryLng])

  // Calculate shipping price function
  const calculateShippingPrice = useCallback(async () => {
    if (!chargeCategory || parcels.length === 0) {
      setCalculatedPrice(null)
      setPriceDetails(null)
      setPriceCalculationError(null)
      return
    }

    const hasRoute = chargeCategory === "inside" 
      ? insideChargeId != null 
      : outsideChargeId != null

    if (!hasRoute) {
      setCalculatedPrice(null)
      setPriceDetails(null)
      setPriceCalculationError(null)
      return
    }

    const totalWeight = parcels.reduce((sum, parcel) => {
      const weight = parseNumber(parcel.weight) || 0
      const quantity = parseNumber(parcel.quantity) || 1
      return sum + weight * quantity
    }, 0)

    if (totalWeight <= 0) {
      setCalculatedPrice(null)
      setPriceDetails(null)
      setPriceCalculationError(null)
      return
    }

    const firstParcel = parcels[0]
    const hasDimensions = 
      firstParcel.length && 
      firstParcel.width && 
      firstParcel.height &&
      parseNumber(firstParcel.length) > 0 &&
      parseNumber(firstParcel.width) > 0 &&
      parseNumber(firstParcel.height) > 0

    try {
      setCalculatingPrice(true)
      setPriceCalculationError(null)

      // Get category from selected route
      const selectedRoute = chargeCategory === "inside" ? selectedInsideCharge : selectedOutsideCharge
      if (!selectedRoute || !selectedRoute.category) {
        throw new Error("Route category is required")
      }

      const request: CalculateShippingPriceRequest = {
        cityType: chargeCategory === "inside" ? "inside_city" : "outside_city",
        category: selectedRoute.category,
        weightKg: totalWeight,
      }

      if (hasDimensions) {
        request.lengthCm = parseNumber(firstParcel.length) || undefined
        request.widthCm = parseNumber(firstParcel.width) || undefined
        request.heightCm = parseNumber(firstParcel.height) || undefined
      }

      const response = await ApiService.calculateShippingPrice(request)
      
      if (response.status && response.data) {
        setCalculatedPrice(response.data.appliedPrice)
        setPriceDetails(response.data)
      } else {
        throw new Error(response.message || "Failed to calculate price")
      }
    } catch (error: any) {
      console.error("Failed to calculate shipping price:", error)
      const errorMessage = error?.response?.message || error?.message || "Failed to calculate shipping price"
      setPriceCalculationError(errorMessage)
      setCalculatedPrice(null)
      setPriceDetails(null)
    } finally {
      setCalculatingPrice(false)
    }
  }, [chargeCategory, insideChargeId, outsideChargeId, selectedInsideCharge, selectedOutsideCharge, parcels])

  // Watch parcel weights and dimensions directly for immediate updates
  const watchedParcels = watch("parcels")
  
  // Create a key from parcel weights and dimensions for debouncing
  const parcelWeightKey = useMemo(() => {
    if (!watchedParcels || watchedParcels.length === 0) return ""
    return watchedParcels.map(p => {
      const weight = p.weight ? parseFloat(String(p.weight)) || 0 : 0
      const quantity = p.quantity ? parseFloat(String(p.quantity)) || 1 : 1
      const length = p.length ? parseFloat(String(p.length)) || 0 : 0
      const width = p.width ? parseFloat(String(p.width)) || 0 : 0
      const height = p.height ? parseFloat(String(p.height)) || 0 : 0
      return `${weight}-${quantity}-${length}-${width}-${height}`
    }).join('|')
  }, [watchedParcels])

  // Debounce the weight key for 1 second (reduced from 2 seconds for better UX)
  const debouncedParcelWeightKey = useDebounce(parcelWeightKey, 1000)

  // Get category from selected routes for stable dependency
  const selectedCategory = useMemo(() => {
    const selectedRoute = chargeCategory === "inside" ? selectedInsideCharge : selectedOutsideCharge
    return selectedRoute?.category || null
  }, [chargeCategory, selectedInsideCharge, selectedOutsideCharge])

  // Trigger price calculation immediately when route or city type changes
  useEffect(() => {
    if (chargeCategory && (insideChargeId || outsideChargeId) && selectedCategory) {
      calculateShippingPrice()
    }
  }, [chargeCategory, insideChargeId, outsideChargeId, selectedCategory, calculateShippingPrice])

  // Trigger price calculation with debounce when weight/dimensions change
  useEffect(() => {
    // Only trigger if we have parcels, a route selected, and valid weight/dimensions
    if (
      watchedParcels && 
      watchedParcels.length > 0 && 
      (insideChargeId || outsideChargeId) && 
      selectedCategory &&
      debouncedParcelWeightKey && 
      debouncedParcelWeightKey !== '0-1-0-0-0'
    ) {
      // Check if at least one parcel has weight or dimensions
      const hasValidData = watchedParcels.some(p => {
        const weight = p.weight ? parseFloat(String(p.weight)) : 0
        const length = p.length ? parseFloat(String(p.length)) : 0
        const width = p.width ? parseFloat(String(p.width)) : 0
        const height = p.height ? parseFloat(String(p.height)) : 0
        return weight > 0 || (length > 0 && width > 0 && height > 0)
      })
      
      if (hasValidData) {
        calculateShippingPrice()
      }
    }
  }, [debouncedParcelWeightKey, insideChargeId, outsideChargeId, selectedCategory, watchedParcels, calculateShippingPrice])

  const vatRate = (settingsStore.generalSettings?.vat || 0) / 100
  const taxRate = (settingsStore.generalSettings?.tax || 0) / 100
  const insuranceRate = (settingsStore.generalSettings?.insurance || 0) / 100

  const summaryBreakdown: SummaryBreakdown = useMemo(() => {
    const baseAmount = calculatedPrice || 0

    const packagingCharge = parcels.reduce((sum, parcel) => {
      if (!parcel.packagingId) return sum
      const packagingIdNum = typeof parcel.packagingId === "string" ? Number(parcel.packagingId) : parcel.packagingId
      const packaging = packagings.find((option) => Number(option.id) === packagingIdNum)
      if (!packaging) return sum
      const qty = parseNumber(parcel.quantity) || 0
      const price = parseNumber(packaging.price) || 0
      return sum + price * qty
    }, 0)

    const parcelExtra = parcels.reduce((sum, parcel) => {
      const quantity = parseNumber(parcel.quantity) || 1
      const extraCost = parseNumber(parcel.extraCost) || 0
      return sum + extraCost * quantity
    }, 0)

    const rushHourUnits = parcels.reduce((sum, parcel) => {
      if (!parcel.isRushHour) return sum
      return sum + (Number(parcel.quantity) || 1)
    }, 0)
    const rushHourUnitCharge =
      rushHourPricing != null
        ? chargeCategory === "inside"
          ? parseNumber(rushHourPricing.insideCharge)
          : parseNumber(rushHourPricing.outsideCharge)
        : 0
    const rushHourCharge = rushHourUnits * rushHourUnitCharge

    const volumetricWeight = parcels.reduce((sum, parcel) => {
      const length = Number(parcel.length) || 0
      const width = Number(parcel.width) || 0
      const height = Number(parcel.height) || 0
      const quantity = Number(parcel.quantity) || 1
      if (!length || !width || !height) return sum
      const volumetric = (length * width * height) / 5000
      return sum + volumetric * quantity
    }, 0)

    const amountBeforeTaxes = baseAmount + packagingCharge + parcelExtra + rushHourCharge
    const vat = amountBeforeTaxes * vatRate
    const tax = amountBeforeTaxes * taxRate
    const insuranceThreshold = settingsStore.generalSettings?.insuranceThreshold || 0
    const isInsuranceApplicable = amountBeforeTaxes >= insuranceThreshold
    const insurance = isInsuranceApplicable ? amountBeforeTaxes * insuranceRate : 0
    const total = amountBeforeTaxes + vat + tax + insurance

    const warehouseCoords =
      selectedWarehouse && selectedWarehouse.latitude != null && selectedWarehouse.longitude != null
        ? {
            lat: Number(selectedWarehouse.latitude),
            lng: Number(selectedWarehouse.longitude),
          }
        : null

    const distanceKm = calculateDistanceKm(warehouseCoords || undefined, deliveryCoords || undefined)

    return {
      amount: amountBeforeTaxes,
      baseCharge: baseAmount,
      packagingCharge,
      parcelExtra,
      rushHourCharge,
      vat,
      tax,
      insurance,
      totalShippingFee: total,
      volumetricWeight,
      shippingType: formatDeliveryOption(deliveryOption),
      distanceKm,
      insuranceThreshold,
      isInsuranceApplicable,
    }
  }, [
    calculatedPrice,
    parcels,
    packagings,
    rushHourPricing,
    chargeCategory,
    vatRate,
    taxRate,
    insuranceRate,
    settingsStore.generalSettings?.insuranceThreshold,
    selectedWarehouse,
    deliveryCoords,
    deliveryOption,
  ])

  const loadInitialData = async () => {
    try {
      const [
        countriesRes,
        packagingsRes,
        warehousesRes,
        insideRoutesRes,
        outsideRoutesRes,
        costingsRes,
      ] = await Promise.all([
        shipmentStore.fetchCountries({ limit: 200 }),
        ApiService.getPackagingOptions(),
        ApiService.getAllWarehouses(),
        ApiService.getAllInsideCity(),
        ApiService.getAllOutsideCity(),
        shipmentStore.fetchCostings(),
      ])

      setCountries(countriesRes)
      if (packagingsRes.status && packagingsRes.data) {
        setPackagings(packagingsRes.data)
      }
      if (warehousesRes.status && warehousesRes.data) {
        setWarehouses(warehousesRes.data)
      }
      if (insideRoutesRes.status && insideRoutesRes.data) {
        setInsideCityRoutes(insideRoutesRes.data)
      }
      if (outsideRoutesRes.status && outsideRoutesRes.data) {
        setOutsideCityRoutes(outsideRoutesRes.data)
      }
      if (costingsRes) {
        setCostings(costingsRes)
      }
      // Customers are loaded separately via handleLoadSenders
    } catch (error) {
      console.error("Failed to load initial data:", error)
      toastUtils.error("Error", "Failed to load form data")
    }
  }

  const onSubmit = async (values: EditShipmentFormValues) => {
    setIsSubmitting(true)
    try {
      // Get original values from shipment
      const originalValues = defaultValues

      // Helper function to check if value changed
      const hasChanged = (key: keyof EditShipmentFormValues) => {
        const current = values[key]
        const original = originalValues[key]
        if (current === null && original === null) return false
        if (current === undefined && original === undefined) return false
        if (current === "" && original === "") return false
        return JSON.stringify(current) !== JSON.stringify(original)
      }

      // Build payload with only changed fields
      const payload: Partial<CreateShipmentPayload> = {}

      // Check each field and only include if changed
      if (hasChanged("recipientId")) {
        payload.recipientId = values.recipientId || undefined
      }
      if (hasChanged("senderAddressId")) {
        payload.senderAddressId = values.senderAddressId || undefined
      }
      if (hasChanged("destinationAddressId")) {
        payload.destinationAddressId = values.destinationAddressId || undefined
      }
      if (hasChanged("senderId")) {
        payload.senderId = values.senderId || undefined
      }
      if (hasChanged("deliveryOption")) {
        payload.deliveryOption = values.deliveryOption
      }
      if (hasChanged("isDoorPickup")) {
        payload.isDoorPickup = values.isDoorPickup
      }
      if (hasChanged("pickupPointId")) {
        payload.pickupPointId = values.pickupPointId || undefined
      }
      if (hasChanged("deliveryAddress")) {
        payload.deliveryAddress = values.deliveryAddress
      }
      if (hasChanged("deliveryLat")) {
        payload.deliveryLat = values.deliveryLat || undefined
      }
      if (hasChanged("deliveryLng")) {
        payload.deliveryLng = values.deliveryLng || undefined
      }
      if (hasChanged("insideCityCharge")) {
        payload.insideCityCharge = values.insideCityCharge
      }
      if (hasChanged("outsideCityCharge")) {
        payload.outsideCityCharge = values.outsideCityCharge
      }
      if (hasChanged("whoPaysShippingFee")) {
        payload.whoPaysShippingFee = values.whoPaysShippingFee
      }
      if (hasChanged("paymentType")) {
        payload.paymentType = values.paymentType
      }
      if (hasChanged("paymentMode")) {
        payload.paymentMode = values.paymentMode
      }
      if (hasChanged("note")) {
        payload.note = values.note || undefined
      }
      if (hasChanged("isScheduled")) {
        payload.isScheduled = values.isScheduled
      }
      if (hasChanged("scheduledDate")) {
        payload.scheduledDate = values.scheduledDate || undefined
      }
      if (hasChanged("countryId")) {
        payload.countryId = values.countryId || undefined
      }
      if (hasChanged("externalPaymentReference")) {
        (payload as any).externalPaymentReference = values.externalPaymentReference || undefined
      }

      // Handle parcel updates separately using the update parcel endpoint
      const originalParcels = shipment.parcels || []
      const parcelsToUpdate: Array<{ parcelId: string; payload: UpdateParcelPayload }> = []

      // Compare each parcel and collect updates
      values.parcels.forEach((currentParcel, index) => {
        const originalParcel = originalParcels[index]
        
        // Only update if parcel has an ID (existing parcel)
        if (originalParcel?.id) {
          const parcelPayload: UpdateParcelPayload = {}
          let hasChanges = false

          if (currentParcel.packagingId !== originalParcel.packagingId) {
            parcelPayload.packagingId = currentParcel.packagingId || null
            hasChanges = true
          }
          if (parseNumber(currentParcel.length) !== originalParcel.length) {
            parcelPayload.length = parseNumber(currentParcel.length)
            hasChanges = true
          }
          if (parseNumber(currentParcel.width) !== originalParcel.width) {
            parcelPayload.width = parseNumber(currentParcel.width)
            hasChanges = true
          }
          if (parseNumber(currentParcel.height) !== originalParcel.height) {
            parcelPayload.height = parseNumber(currentParcel.height)
            hasChanges = true
          }
          const hasDimensions = 
            currentParcel.length && currentParcel.width && currentParcel.height &&
            parseNumber(currentParcel.length) > 0 &&
            parseNumber(currentParcel.width) > 0 &&
            parseNumber(currentParcel.height) > 0
          
          const currentWeight = currentParcel.weight ? parseNumber(currentParcel.weight) : null
          if (currentWeight !== originalParcel.weight) {
            parcelPayload.weight = hasDimensions ? currentWeight : (currentWeight || 0)
            hasChanges = true
          }
          if ((parseNumber(currentParcel.quantity) || 1) !== originalParcel.quantity) {
            parcelPayload.quantity = parseNumber(currentParcel.quantity) || 1
            hasChanges = true
          }
          if (currentParcel.isRushHour !== originalParcel.isRushHour) {
            parcelPayload.isRushHour = currentParcel.isRushHour
            hasChanges = true
          }
          if (parseNumber(currentParcel.extraCost) !== originalParcel.extraCost) {
            parcelPayload.extraCost = parseNumber(currentParcel.extraCost)
            hasChanges = true
          }
          const currentDeclaredValue = currentParcel.declaredValue ? parseNumber(currentParcel.declaredValue) : null
          if (currentDeclaredValue !== originalParcel.declaredValue) {
            parcelPayload.declaredValue = currentDeclaredValue
            hasChanges = true
          }

          if (hasChanges) {
            parcelsToUpdate.push({
              parcelId: originalParcel.id,
              payload: parcelPayload,
            })
          }
        }
      })

      // Legacy fields for backward compatibility
      if (hasChanged("destinationCountryId")) {
        payload.destinationCountryId = values.destinationCountryId || undefined
      }
      if (hasChanged("destinationStateId")) {
        payload.destinationStateId = values.destinationStateId || undefined
      }
      if (hasChanged("destinationCityId")) {
        payload.destinationCityId = values.destinationCityId || undefined
      }
      if (hasChanged("destinationLgaId")) {
        payload.destinationLgaId = values.destinationLgaId || undefined
      }
      if (hasChanged("recipientFirstName")) {
        payload.recipientFirstName = values.recipientFirstName || undefined
      }
      if (hasChanged("recipientLastName")) {
        payload.recipientLastName = values.recipientLastName || undefined
      }
      if (hasChanged("recipientPhoneNumber")) {
        payload.recipientPhoneNumber = values.recipientPhoneNumber || undefined
      }
      if (hasChanged("recipientEmail")) {
        payload.recipientEmail = values.recipientEmail || undefined
      }
      if (hasChanged("recipientAddress")) {
        payload.recipientAddress = values.recipientAddress || undefined
      }

      // Update shipment (excluding parcels)
      const response = await ApiService.updateShipment(shipmentId, payload)
      if (!response.status || !response.data) {
        const errorMessage = getErrorMessage(response, "Failed to update shipment")
        toastUtils.error("Failed", errorMessage)
        return
      }

      // Update parcels separately if there are any changes
      if (parcelsToUpdate.length > 0) {
        try {
          const parcelUpdatePromises = parcelsToUpdate.map(({ parcelId, payload: parcelPayload }) =>
            ApiService.updateParcel(parcelId, parcelPayload)
          )
          
          const parcelResults = await Promise.all(parcelUpdatePromises)
          const failedParcels = parcelResults.filter(result => !result.status)
          
          if (failedParcels.length > 0) {
            toastUtils.error("Partial Update", "Shipment updated but some parcels failed to update")
            console.error("Failed parcel updates:", failedParcels)
          }
        } catch (error) {
          console.error("Failed to update parcels:", error)
          toastUtils.error("Partial Update", "Shipment updated but parcel updates failed")
        }
      }

      toastUtils.success("Shipment Updated", "The shipment has been updated successfully.")
      router.push(`/shipment-management/shipments/${shipmentId}`)
    } catch (error) {
      console.error("Failed to update shipment:", error)
      const errorMessage = getErrorMessage(error, "An error occurred while updating the shipment")
      toastUtils.error("Failed", errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
      <div className="lg:sticky lg:top-24 h-fit">
        <SummaryCard 
          breakdown={summaryBreakdown}
          calculatingPrice={calculatingPrice}
          priceCalculationError={priceCalculationError}
          priceDetails={priceDetails}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Sender Information */}
      <Card>
        <CardHeader>
          <CardTitle>Sender Details</CardTitle>
          <CardDescription>Select a customer and specify sender location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Sender *</Label>
            <div className="flex gap-2">
              <Controller
                control={control}
                name="senderId"
                rules={{ required: "Sender selection is required." }}
                render={({ field }) => (
                  <>
                    <div className="flex-1">
                      <SenderSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={customers}
                        isLoading={sendersLoading}
                        onSearch={setSenderSearch}
                      />
                      {errors.senderId && <p className="text-sm text-destructive">{errors.senderId.message}</p>}
                    </div>
                  </>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setCreateCustomerDialogOpen(true)}
                title="Create new customer"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Alert>
              <AlertDescription>
                Only a subset of customers is shown. Use the search box to find other customers or click the plus button to create a new one.
              </AlertDescription>
            </Alert>
          </div>
          <CustomerModal
            open={createCustomerDialogOpen}
            onOpenChange={setCreateCustomerDialogOpen}
            onCustomerCreated={(customerId) => {
              setValue("senderId", customerId, { shouldDirty: true, shouldValidate: false })
            }}
            userStore={userStore}
            onRefresh={() => handleLoadSenders(1, debouncedSenderSearch || undefined)}
          />

          {!watchedIsDoorPickup && watchedSenderId && (
            <div className="space-y-2">
              <Label>Sender Address *</Label>
              <Controller
                control={control}
                name="senderAddressId"
                rules={{
                  required: !watchedIsDoorPickup ? "Sender address is required when not using door pickup." : false,
                }}
                render={({ field }) => (
                  <>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <AddressSelector
                          value={field.value}
                          onChange={field.onChange}
                          options={userAddresses}
                          isLoading={userAddressesLoading}
                          onCreateNew={() => {
                            setCreateAddressDialogOpen(true)
                          }}
                          placeholder="Select sender address"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setCreateAddressDialogOpen(true)
                        }}
                        title="Create new address"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {errors.senderAddressId && (
                      <p className="text-sm text-destructive">{errors.senderAddressId.message}</p>
                    )}
                    {watch("senderAddressId") && (() => {
                      const selectedAddress = userAddresses.find(a => a.id === watch("senderAddressId")) || shipment.senderAddress
                      return selectedAddress ? (
                        <div className="mt-2 p-3 rounded-lg border bg-muted/30">
                          <p className="text-sm font-medium">Selected Sender Address:</p>
                          <p className="text-xs text-muted-foreground">{selectedAddress.street}</p>
                          {selectedAddress.addressLine && (
                            <p className="text-xs text-muted-foreground">{selectedAddress.addressLine}</p>
                          )}
                          {selectedAddress.city && (
                            <p className="text-xs text-muted-foreground">
                              {selectedAddress.city.name}, {selectedAddress.state?.name}, {selectedAddress.country?.name}
                            </p>
                          )}
                        </div>
                      ) : null
                    })()}
                  </>
                )}
              />
              <Dialog open={createAddressDialogOpen} onOpenChange={setCreateAddressDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Address</DialogTitle>
                    <DialogDescription>
                      Create a new address for the sender. This address will be saved and can be reused.
                    </DialogDescription>
                  </DialogHeader>
                  <AddressForm
                    onSubmit={async (data) => {
                      if (!data.street || !data.countryId) {
                        return { success: false }
                      }
                      const payload: CreateAddressPayload = {
                        street: data.street,
                        addressLine: data.addressLine,
                        cityId: data.cityId,
                        stateId: data.stateId,
                        lgaId: data.lgaId,
                        countryId: data.countryId,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        postalCode: data.postalCode,
                        addressType: data.addressType,
                        isDefault: data.isDefault,
                        userId: watchedSenderId || undefined,
                      }
                      const result = await addressStore.createAddress(payload)
                      if (result.status && result.data) {
                        setUserAddresses([...userAddresses, result.data])
                        setValue("senderAddressId", result.data.id)
                        setCreateAddressDialogOpen(false)
                        return { success: true }
                      }
                      return { success: false }
                    }}
                    onCancel={() => setCreateAddressDialogOpen(false)}
                    shipmentStore={shipmentStore}
                    countries={countries}
                    countriesLoading={false}
                    userId={watchedSenderId || undefined}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Recipient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Recipient Option *</Label>
            <Controller
              control={control}
              name="recipientOption"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="existing" />
                    <Label htmlFor="existing">Use Existing Recipient</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new">Create New Recipient</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          {watch("recipientOption") === "existing" ? (
            <div className="space-y-2">
              <Label>Recipient *</Label>
              <Controller
                control={control}
                name="recipientId"
                rules={{ required: "Recipient is required" }}
                render={({ field }) => (
                  <>
                    <RecipientSelector
                      value={field.value}
                      onChange={field.onChange}
                      options={recipients}
                      isLoading={recipientsLoading}
                      onSearch={setRecipientSearch}
                      onCreateNew={() => setCreateRecipientDialogOpen(true)}
                      placeholder="Search recipient by email"
                    />
                    {field.value && (() => {
                      const selectedRecipient = recipients.find(r => r.id === field.value) || shipment.recipient
                      return selectedRecipient ? (
                        <div className="mt-2 p-3 rounded-lg border bg-muted/30">
                          <p className="text-sm font-medium">
                            Selected Recipient: {selectedRecipient.firstName} {selectedRecipient.lastName}
                          </p>
                          {selectedRecipient.email && (
                            <p className="text-xs text-muted-foreground">{selectedRecipient.email}</p>
                          )}
                          {selectedRecipient.phoneNumber && (
                            <p className="text-xs text-muted-foreground">{selectedRecipient.phoneNumber}</p>
                          )}
                        </div>
                      ) : null
                    })()}
                  </>
                )}
              />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Controller
                  control={control}
                  name="recipientFirstName"
                  rules={{ required: "First name is required" }}
                  render={({ field }) => <Input {...field} />}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Controller
                  control={control}
                  name="recipientLastName"
                  rules={{ required: "Last name is required" }}
                  render={({ field }) => <Input {...field} />}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Controller
                  control={control}
                  name="recipientPhoneNumber"
                  rules={{ required: "Phone number is required" }}
                  render={({ field }) => <Input {...field} />}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Controller
                  control={control}
                  name="recipientEmail"
                  render={({ field }) => <Input type="email" {...field} />}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address *</Label>
                <Controller
                  control={control}
                  name="recipientAddress"
                  rules={{ required: "Address is required" }}
                  render={({ field }) => <Input {...field} />}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Address */}
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
                <Input
                  {...field}
                  disabled
                  readOnly
                />
              )}
            />
          </div>
          {watch("deliveryLat") && watch("deliveryLng") && (
            <div className="text-sm text-muted-foreground">
              Coordinates: {Number(watch("deliveryLat"))?.toFixed(4)}, {Number(watch("deliveryLng"))?.toFixed(4)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parcels */}
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
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} disabled>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Packaging</Label>
                  <Controller
                    control={control}
                    name={`parcels.${index}.packagingId`}
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))}
                        disabled
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select packaging" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (No Packaging)</SelectItem>
                          {packagings.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id.toString()}>
                              {pkg.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Length (cm) *</Label>
                  <Controller
                    control={control}
                    name={`parcels.${index}.length`}
                    rules={{ 
                      required: "Length is required",
                      validate: (value) => {
                        if (value && isNaN(parseFloat(String(value)))) {
                          return "Length must be a valid number."
                        }
                        if (value && parseFloat(String(value)) < 0) {
                          return "Length cannot be negative."
                        }
                        return true
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = e.target.value
                          // Allow empty, numbers, and decimals
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            field.onChange(val)
                          }
                        }}
                        onBlur={field.onBlur}
                        placeholder="0.00"
                        disabled
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Width (cm) *</Label>
                  <Controller
                    control={control}
                    name={`parcels.${index}.width`}
                    rules={{ 
                      required: "Width is required",
                      validate: (value) => {
                        if (value && isNaN(parseFloat(String(value)))) {
                          return "Width must be a valid number."
                        }
                        if (value && parseFloat(String(value)) < 0) {
                          return "Width cannot be negative."
                        }
                        return true
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = e.target.value
                          // Allow empty, numbers, and decimals
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            field.onChange(val)
                          }
                        }}
                        onBlur={field.onBlur}
                        placeholder="0.00"
                        disabled
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm) *</Label>
                  <Controller
                    control={control}
                    name={`parcels.${index}.height`}
                    rules={{ 
                      required: "Height is required",
                      validate: (value) => {
                        if (value && isNaN(parseFloat(String(value)))) {
                          return "Height must be a valid number."
                        }
                        if (value && parseFloat(String(value)) < 0) {
                          return "Height cannot be negative."
                        }
                        return true
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = e.target.value
                          // Allow empty, numbers, and decimals
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            field.onChange(val)
                          }
                        }}
                        onBlur={field.onBlur}
                        placeholder="0.00"
                        disabled
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Weight (kg){" "}
                    {watch(`parcels.${index}.length`) && watch(`parcels.${index}.width`) && watch(`parcels.${index}.height`)
                      ? ""
                      : "*"}
                  </Label>
                  <Controller
                    control={control}
                    name={`parcels.${index}.weight`}
                    rules={{
                      validate: (value) => {
                        const length = watch(`parcels.${index}.length`)
                        const width = watch(`parcels.${index}.width`)
                        const height = watch(`parcels.${index}.height`)
                        const hasDimensions = length && width && height && 
                          parseFloat(String(length)) > 0 && 
                          parseFloat(String(width)) > 0 && 
                          parseFloat(String(height)) > 0
                        if (!hasDimensions && (!value || value === "" || parseFloat(String(value)) <= 0)) {
                          return "Weight is required when dimensions are not provided."
                        }
                        if (value && isNaN(parseFloat(String(value)))) {
                          return "Weight must be a valid number."
                        }
                        if (value && parseFloat(String(value)) < 0) {
                          return "Weight cannot be negative."
                        }
                        return true
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = e.target.value
                          // Allow empty, numbers, and decimals
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            field.onChange(val === "" ? null : val)
                          }
                        }}
                        onBlur={field.onBlur}
                        placeholder="0.00"
                        disabled
                      />
                    )}
                  />
                  {watch(`parcels.${index}.length`) && watch(`parcels.${index}.width`) && watch(`parcels.${index}.height`) && (
                    <p className="text-xs text-muted-foreground">
                      Optional when dimensions are provided
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Controller
                    control={control}
                    name={`parcels.${index}.quantity`}
                    rules={{ required: "Quantity is required" }}
                    render={({ field }) => <Input type="number" {...field} value={field.value || ""} min="1" disabled />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Extra Cost</Label>
                  <Controller
                    control={control}
                    name={`parcels.${index}.extraCost`}
                    render={({ field }) => <Input type="number" {...field} step="0.01" min="0" disabled />}
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
                        disabled
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
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled />
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
              packagingId: null,
              length: "",
              width: "",
              height: "",
              weight: null,
              quantity: "",
              isRushHour: false,
              extraCost: "",
              declaredValue: "",
            })}
            disabled
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Parcel
          </Button>
        </CardContent>
      </Card>

      {/* Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Charges</CardTitle>
          <CardDescription>Select applicable inside or outside city charges</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Charge Type *</Label>
            <RadioGroup
              value={chargeCategory}
              onValueChange={(value: "inside" | "outside") => {
                setChargeCategory(value)
                if (value === "inside") {
                  setValue("outsideCityCharge", null, { shouldDirty: true })
                } else {
                  setValue("insideCityCharge", null, { shouldDirty: true })
                }
              }}
              disabled
              className="grid w-full gap-3 md:w-fit md:grid-cols-2"
            >
              <div>
                <RadioGroupItem value="inside" id="charge-inside" className="sr-only" />
                <Label
                  htmlFor="charge-inside"
                  className={`cursor-pointer rounded-md border px-4 py-3 text-sm font-medium transition ${
                    chargeCategory === "inside" ? "bg-primary text-primary-foreground" : "bg-muted/40"
                  }`}
                >
                  Inside City
                </Label>
              </div>
              <div>
                <RadioGroupItem value="outside" id="charge-outside" className="sr-only" />
                <Label
                  htmlFor="charge-outside"
                  className={`cursor-pointer rounded-md border px-4 py-3 text-sm font-medium transition ${
                    chargeCategory === "outside" ? "bg-primary text-primary-foreground" : "bg-muted/40"
                  }`}
                >
                  Outside City
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={`space-y-3 rounded-lg border p-4 ${
              chargeCategory !== "inside" ? "bg-muted/40 opacity-70 pointer-events-none" : ""
            }`}>
              <div>
                <p className="font-medium">Inside City Route</p>
                <p className="text-sm text-muted-foreground">Select a route to apply within the city.</p>
              </div>
              <Controller
                control={control}
                name="insideCityCharge"
                rules={{
                  validate: (value) =>
                    chargeCategory === "inside" ? !!value || "Select an inside city route" : true,
                }}
                render={({ field }) => (
                  <>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => {
                        setChargeCategory("inside")
                        setValue("outsideCityCharge", null, { shouldDirty: true })
                        field.onChange(Number(value))
                      }}
                      disabled={true}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select inside city route" />
                      </SelectTrigger>
                      <SelectContent>
                        {insideCityRoutes.map((route) => (
                          <SelectItem key={route.id} value={String(route.id)}>
                            {route.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.insideCityCharge && chargeCategory === "inside" && (
                      <p className="text-sm text-destructive">{errors.insideCityCharge.message}</p>
                    )}
                  </>
                )}
              />
              {selectedInsideCharge && (
                <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedInsideCharge.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pricing will be calculated based on weight using the weight-based pricing system.
                  </p>
                </div>
              )}
            </div>

            <div className={`space-y-3 rounded-lg border p-4 ${
              chargeCategory !== "outside" ? "bg-muted/40 opacity-70 pointer-events-none" : ""
            }`}>
              <div>
                <p className="font-medium">Outside City Route</p>
                <p className="text-sm text-muted-foreground">Select a route for outside city delivery.</p>
              </div>
              <Controller
                control={control}
                name="outsideCityCharge"
                rules={{
                  validate: (value) =>
                    chargeCategory === "outside" ? !!value || "Select an outside city route" : true,
                }}
                render={({ field }) => (
                  <>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => {
                        setChargeCategory("outside")
                        setValue("insideCityCharge", null, { shouldDirty: true })
                        field.onChange(Number(value))
                      }}
                      disabled={true}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select outside city route" />
                      </SelectTrigger>
                      <SelectContent>
                        {outsideCityRoutes.map((route) => (
                          <SelectItem key={route.id} value={String(route.id)}>
                            {route.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.outsideCityCharge && chargeCategory === "outside" && (
                      <p className="text-sm text-destructive">{errors.outsideCityCharge.message}</p>
                    )}
                  </>
                )}
              />
              {selectedOutsideCharge && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedOutsideCharge.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pricing will be calculated based on weight using the weight-based pricing system.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Options */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Controller
              control={control}
              name="isDoorPickup"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label>Door Pickup</Label>
          </div>
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
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pickup point" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment & Shipping */}
      <Card>
        <CardHeader>
          <CardTitle>Payment & Shipping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Who Pays Shipping Fee *</Label>
            <Controller
              control={control}
              name="whoPaysShippingFee"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} disabled>
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
            <Label>Payment Mode *</Label>
            <Controller
              control={control}
              name="paymentMode"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} disabled>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prepaid" id="prepaid" />
                    <Label htmlFor="prepaid">Prepaid</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="postpaid" id="postpaid" />
                    <Label htmlFor="postpaid">Postpaid</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Type *</Label>
            <Controller
              control={control}
              name="paymentType"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} disabled>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash">Cash</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card">Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                    <Label htmlFor="bank-transfer">Transfer</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
          <div className="space-y-2 pt-2 border-t">
            <Label>External Payment Reference</Label>
            <Controller
              control={control}
              name="externalPaymentReference"
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter external payment reference (e.g., transaction ID, receipt number)"
                />
              )}
            />
          </div>
          <div className="space-y-2 pt-2 border-t">
            <Label>Payment Link</Label>
            <div className="flex gap-2">
              {paymentLink ? (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(paymentLink)
                      toastUtils.success("Copied!", "Payment link copied to clipboard")
                    } catch (error) {
                      console.error("Failed to copy:", error)
                      toastUtils.error("Failed", "Failed to copy payment link")
                    }
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={isCreatingPaymentLink}
                  onClick={async () => {
                    setIsCreatingPaymentLink(true)
                    try {
                      const amount = shipment.costing?.amount
                      
                      // Get logo image URL - using the logo from public folder
                      const logoUrl = typeof window !== "undefined" 
                        ? `${window.location.origin}/images/logo_full.png`
                        : ""
                      
                      // Include metadata with shipment information
                      const metadata: Record<string, any> = {
                        logoImage: logoUrl,
                        shipmentCode: shipment.trackingCode,
                        shipmentId: shipment.id,
                        trackingCode: shipment.trackingCode,
                        senderName: shipment.sender?.profile 
                          ? `${shipment.sender.profile.firstName} ${shipment.sender.profile.lastName}`
                          : "",
                        recipientName: shipment.recipient
                          ? `${shipment.recipient.firstName} ${shipment.recipient.lastName}`
                          : shipment.recipientFirstName && shipment.recipientLastName
                          ? `${shipment.recipientFirstName} ${shipment.recipientLastName}`
                          : "",
                        deliveryAddress: shipment.deliveryAddress || "",
                        amount: amount || 0,
                      }

                      const payload: CreatePaystackPaymentLinkPayload = {
                        ...(amount ? { amount } : {}),
                        successMessage: "Payment successful!",
                        name: shipment.trackingCode,
                        description: "Payment for shipment " + shipment.trackingCode,
                        metadata,
                      }

                      const response = await ApiService.createPaystackPaymentLink(shipmentId, payload)

                      if (response.status && response.data) {
                        setPaymentLink(response.data.paymentUrl)
                        toastUtils.success("Success", "Payment link created successfully")
                      } else {
                        throw new Error(response.message || "Failed to create payment link")
                      }
                    } catch (error) {
                      console.error("Failed to create payment link:", error)
                      const errorMessage = getErrorMessage(error, "Failed to create payment link")
                      toastUtils.error("Failed", errorMessage)
                    } finally {
                      setIsCreatingPaymentLink(false)
                    }
                  }}
                >
                  {isCreatingPaymentLink ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Create Payment Link
                    </>
                  )}
                </Button>
              )}
            </div>
            {paymentLink && (
              <p className="text-xs text-muted-foreground break-all">
                {paymentLink}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Notes</Label>
            <Controller
              control={control}
              name="note"
              render={({ field }) => <Textarea {...field} rows={4} placeholder="Additional notes..." />}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Controller
              control={control}
              name="isScheduled"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label>Schedule Shipment</Label>
          </div>
          {watch("isScheduled") && (
            <div className="space-y-2">
              <Label>Scheduled Date *</Label>
              <Controller
                control={control}
                name="scheduledDate"
                rules={{ required: watch("isScheduled") ? "Scheduled date is required" : false }}
                render={({ field }) => (
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push(`/shipment-management/shipments/${shipmentId}`)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Shipment"
          )}
        </Button>
      </div>

      {/* Recipient Creation Dialog */}
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
                if ('id' in data) {
                  return { success: false }
                }
                const result = await recipientStore.createRecipient(data)
                if (result.status && result.data) {
                  setValue("recipientId", result.data.id)
                  setValue("recipientOption", "existing")
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
      </form>
    </div>
  )
})

