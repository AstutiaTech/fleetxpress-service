"use client"

import { Address, CreateAddressPayload } from "@/types/addressTypes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Info, Loader2, MapPin, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { CalculateShippingPriceRequest, CalculateShippingPriceResponse } from "@/types/weightBasedPricingTypes"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { City, Country, LGA, State } from "@/types/geoTypes"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { CreateRecipientPayload, Recipient } from "@/types/recipientTypes"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCallback, useEffect, useMemo, useState } from "react"

import { AddressForm } from "@/components/address/address-form"
import { AddressSelector } from "@/components/address/address-selector"
import { ApiPaginatedResponseMeta } from "@/types/apiTypes"
import { ApiService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CostingRate } from "@/types/costingTypes"
import { CreatePaystackPaymentLinkPayload } from "@/types/financialsTypes"
import { CreateShipmentPayload } from "@/types/shipmentTypes"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { WareHouse } from "@/types/warehousesType"
import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/utils/toast-utils"
import { observer } from "mobx-react-lite"
import { toastUtils } from "@/utils/toast-utils"
import useDebounce from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"
import { useStore } from "@/providers/store.provider"

// Helper function to remove null and undefined values from an object
const removeNullValues = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        // For arrays, recursively clean each item if it's an object
        cleaned[key as keyof T] = value.map((item) =>
          typeof item === "object" && item !== null && !Array.isArray(item)
            ? removeNullValues(item as Record<string, unknown>)
            : item
        ) as T[keyof T]
      } else if (typeof value === "object" && value !== null) {
        // Recursively clean nested objects
        cleaned[key as keyof T] = removeNullValues(value as Record<string, unknown>) as T[keyof T]
      } else {
        cleaned[key as keyof T] = value as T[keyof T]
      }
    }
  }
  return cleaned
}

type ParcelFormValue = {
  packagingId: number | null
  length: string
  width: string
  height: string
  weight: string | null // Optional if dimensions are provided
  quantity: string
  isRushHour: boolean
  isLiquidFragile: boolean
  extraCost: string
  declaredValue: string // Will be converted to number (monetary amount)
  description: string // Optional parcel description
}

interface CreateShipmentFormValues {
  // New recipient/address fields
  recipientId: string | null
  recipientOption: "existing" | "new"
  senderAddressId: string | null
  destinationAddressId: string | null
  // Legacy fields (for backward compatibility - can be removed after migration)
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
}

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

const formatCurrency = (value: number) => currencyFormatter.format(isNaN(value) ? 0 : Math.round(value))

const formatNumber = (value: number) => amountFormatter.format(isNaN(value) ? 0 : value)

const formatDeliveryOption = (value: CreateShipmentFormValues["deliveryOption"]) => {
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

const parseNumber = (value: number | string | null | undefined) => {
  const numericValue = typeof value === "string" ? parseFloat(value) : value ?? 0
  return Number.isFinite(numericValue) ? numericValue : 0
}

type GoogleLatLng = {
  lat: () => number
  lng: () => number
}

interface GooglePlaceDetails {
  formatted_address?: string
  geometry?: {
    location: GoogleLatLng
  }
  name?: string
}

type GooglePlacesService = {
  getDetails: (
    request: { placeId: string; fields: Array<"formatted_address" | "geometry" | "name"> },
    callback: (result: GooglePlaceDetails | null, status: string) => void
  ) => void
}

type GoogleAutocompleteService = {
  getPlacePredictions: (
    request: { input: string },
    callback: (predictions?: GooglePlacesSuggestion[], status?: string) => void
  ) => void
}

type GooglePlacesNamespace = {
  AutocompleteService: new () => GoogleAutocompleteService
  PlacesService: new (node: HTMLElement) => GooglePlacesService
}

type GoogleMapsNamespace = {
  places?: GooglePlacesNamespace
}

type GoogleGlobal = {
  maps?: GoogleMapsNamespace
}

type GoogleWindow = Window & { google?: GoogleGlobal }

interface GooglePlacesSuggestion {
  description: string
  place_id: string
}

interface GooglePlacesInputProps {
  value: string
  onValueChange: (value: string) => void
  onPlaceResolved: (payload: { address: string; lat: number; lng: number }) => void
  onCoordinatesCleared: () => void
  error?: string
}

const GooglePlacesInput = ({
  value,
  onValueChange,
  onPlaceResolved,
  onCoordinatesCleared,
  error,
}: GooglePlacesInputProps) => {
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [predictions, setPredictions] = useState<GooglePlacesSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const googleWindow = window as GoogleWindow
    const scheduleReadyUpdate = () => {
      setTimeout(() => setIsReady(true), 0)
    }
    const handleScriptLoad = () => scheduleReadyUpdate()
    const handleScriptError = () => setLoadError("Failed to load Google Places script.")
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-google-places]")

    if (googleWindow.google) {
      scheduleReadyUpdate()
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY
    if (!apiKey) {
      const missingKeyFrame = requestAnimationFrame(() =>
        setLoadError("Missing Google Places API key (NEXT_PUBLIC_GOOGLE_PLACES_KEY).")
      )
      return () => cancelAnimationFrame(missingKeyFrame)
    }

    if (existingScript) {
      existingScript.addEventListener("load", handleScriptLoad)
      existingScript.addEventListener("error", handleScriptError)
      return () => {
        existingScript.removeEventListener("load", handleScriptLoad)
        existingScript.removeEventListener("error", handleScriptError)
      }
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.dataset.googlePlaces = "true"
    script.addEventListener("load", handleScriptLoad)
    script.addEventListener("error", handleScriptError)
    document.head.appendChild(script)

    return () => {
      script.removeEventListener("load", handleScriptLoad)
      script.removeEventListener("error", handleScriptError)
    }
  }, [])

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return

    const googleWindow = window as GoogleWindow
    const googleApi = googleWindow.google
    const placesNamespace = googleApi?.maps?.places
    if (!placesNamespace) return

    let isActive = true
    const autocompleteService = new placesNamespace.AutocompleteService()

    let startFrame: number | null = null
    let clearFrame: number | null = null

    if (value && value.length > 2) {
      startFrame = requestAnimationFrame(() => {
        if (isActive) {
          setIsSearching(true)
        }
      })
      autocompleteService.getPlacePredictions({ input: value }, (preds?: GooglePlacesSuggestion[]) => {
        if (!isActive) return
        setPredictions(preds || [])
        setIsSearching(false)
      })
    } else {
      clearFrame = requestAnimationFrame(() => {
        if (!isActive) return
        setPredictions([])
        setIsSearching(false)
      })
    }

    return () => {
      isActive = false
      if (startFrame) cancelAnimationFrame(startFrame)
      if (clearFrame) cancelAnimationFrame(clearFrame)
    }
  }, [value, isReady])

  const handleSelectPrediction = (prediction: GooglePlacesSuggestion) => {
    if (typeof window === "undefined") return
    const googleWindow = window as GoogleWindow
    const placesNamespace = googleWindow.google?.maps?.places
    if (!placesNamespace) return

    const placesService = new placesNamespace.PlacesService(document.createElement("div"))

    placesService.getDetails(
      { placeId: prediction.place_id, fields: ["formatted_address", "geometry", "name"] },
      (result: GooglePlaceDetails | null, status: string) => {
        if (status === "OK" && result?.geometry?.location) {
          const lat = result.geometry.location.lat()
          const lng = result.geometry.location.lng()
          const formatted = result.formatted_address || result.name || prediction.description
          onPlaceResolved({ address: formatted, lat, lng })
          setPredictions([])
        } else {
          toastUtils.error("Location Lookup Failed", "Unable to fetch location details from Google Places.")
        }
      }
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={value}
          placeholder="Search delivery address"
          onChange={(event) => {
            onValueChange(event.target.value)
            onCoordinatesCleared()
          }}
          className="pl-8"
          leftIcon={<MapPin className="h-4 w-4" />}
          disabled={!!loadError}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {predictions.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 rounded-md border bg-popover text-sm shadow-md">
            <ul className="max-h-60 divide-y overflow-y-auto">
              {predictions.map((prediction) => (
                <li key={prediction.place_id}>
                  <button
                    type="button"
                    className="hover:bg-accent/30 w-full px-3 py-2 text-left"
                    onClick={() => handleSelectPrediction(prediction)}
                  >
                    {prediction.description}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {loadError && <p className="text-sm text-destructive">{loadError}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

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
        <Command>
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


interface SummaryBreakdown {
  amount: number
  baseCharge: number
  packagingCharge: number
  parcelExtra: number
  rushHourCharge: number
  liquidFragileCharge: number
  scheduledDeliveryCharge: number
  sameDayCharge: number
  vat: number
  tax: number
  insurance: number
  totalShippingFee: number
  volumetricWeight: number
  shippingType: string
  distanceKm: number | null
  insuranceThreshold?: number
  isInsuranceApplicable?: boolean
  totalDeclaredValue?: number // Total declared value of all parcels
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
      scheduledDeliveryCharge,
      sameDayCharge,
      parcelExtra,
      rushHourCharge,
      liquidFragileCharge,
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
            <span className="text-muted-foreground">Scheduled Delivery Charge</span>
            <span className="font-medium">{formatCurrency(scheduledDeliveryCharge)}</span>
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
          {liquidFragileCharge > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Liquid/Fragile Charge</span>
              <span className="font-medium">{formatCurrency(liquidFragileCharge)}</span>
            </div>
          )}
          {sameDayCharge > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Same Day Delivery Charge</span>
              <span className="font-medium">{formatCurrency(sameDayCharge)}</span>
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
                    ? `(Applied - declared value exceeds threshold: ${formatCurrency(insuranceThreshold)})`
                    : `(Not applied - declared value below threshold: ${formatCurrency(insuranceThreshold)})`}
                </span>
              )}
            </span>
            <span className="font-medium">{formatCurrency(insurance)}</span>
          </div>
          {!isInsuranceApplicable && insuranceThreshold !== undefined && insuranceThreshold !== null && (
            <Alert className="mt-2">
              <AlertDescription className="text-xs">
                Insurance is not applied because the total declared value of goods is below the threshold of {formatCurrency(insuranceThreshold)}.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">{formatCurrency(tax)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Shipping Fee</p>
          <p className="text-xl font-semibold">{formatCurrency(totalShippingFee)}</p>
        </div>
      </CardFooter>
    </Card>
  )
}

const parcelDefault: ParcelFormValue = {
  packagingId: null,
  length: "",
  width: "",
  height: "",
  weight: null,
  quantity: "1",
  isRushHour: false,
  isLiquidFragile: false,
  extraCost: "",
  declaredValue: "",
  description: "",
}

export const CreateShipmentForm = observer(() => {
  const router = useRouter()
  const { settingsStore, shipmentStore, userStore, addressStore, recipientStore } = useStore()
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateShipmentFormValues>({
    defaultValues: {
      // New fields
      recipientId: null,
      recipientOption: "existing",
      senderAddressId: null,
      destinationAddressId: null,
      // Legacy fields
      destinationCountryId: null,
      destinationStateId: null,
      destinationCityId: null,
      destinationLgaId: null,
      senderCountryId: null,
      senderStateId: null,
      senderCityId: null,
      senderLgaId: null,
      recipientFirstName: "",
      recipientLastName: "",
      recipientPhoneNumber: "",
      recipientEmail: "",
      recipientAddress: "",
      senderId: null,
      deliveryOption: "home",
      isDoorPickup: false,
      pickupPointId: null,
      deliveryAddress: "",
      deliveryLat: null,
      deliveryLng: null,
      insideCityCharge: null,
      outsideCityCharge: null,
      parcels: [parcelDefault],
      whoPaysShippingFee: "sender",
      paymentType: "cash",
      paymentMode: "prepaid",
      note: "",
      isScheduled: false,
      scheduledDate: null,
      countryId: null,
      applyInsurance: false,
      customInsuranceAmount: "",
    },
  })

  const { fields: parcelFields, append: appendParcel, remove: removeParcel } = useFieldArray({
    control,
    name: "parcels",
  })

  const [countries, setCountries] = useState<Country[]>([])
  const [countriesLoading, setCountriesLoading] = useState(false)

  const [destinationStates, setDestinationStates] = useState<State[]>([])
  const [destinationCities, setDestinationCities] = useState<City[]>([])
  const [destinationLgas, setDestinationLgas] = useState<LGA[]>([])
  const [senderStates, setSenderStates] = useState<State[]>([])
  const [senderCities, setSenderCities] = useState<City[]>([])
  const [senderLgas, setSenderLgas] = useState<LGA[]>([])

  const [loadingDestinationStates, setLoadingDestinationStates] = useState(false)
  const [loadingDestinationCities, setLoadingDestinationCities] = useState(false)
  const [loadingDestinationLgas, setLoadingDestinationLgas] = useState(false)
  const [loadingSenderStates, setLoadingSenderStates] = useState(false)
  const [loadingSenderCities, setLoadingSenderCities] = useState(false)
  const [loadingSenderLgas, setLoadingSenderLgas] = useState(false)

  const [insideCharges, setInsideCharges] = useState<InsideCity[]>([])
  const [outsideCharges, setOutsideCharges] = useState<OutsideCity[]>([])
  const [loadingInsideCharges, setLoadingInsideCharges] = useState(false)
  const [loadingOutsideCharges, setLoadingOutsideCharges] = useState(false)

  const [packagingOptions, setPackagingOptions] = useState<Packaging[]>([])
  const [loadingPackaging, setLoadingPackaging] = useState(false)
  const [costings, setCostings] = useState<CostingRate[]>([])

  const [warehouses, setWarehouses] = useState<WareHouse[]>([])
  const [warehousesMeta, setWarehousesMeta] = useState<ApiPaginatedResponseMeta | null>(null)
  const [warehousesLoading, setWarehousesLoading] = useState(false)
  const [warehousesSearch, setWarehousesSearch] = useState("")
  const debouncedWarehouseSearch = useDebounce(warehousesSearch, 400)

  const [senders, setSenders] = useState<CustomerUser[]>([])
  const [sendersLoading, setSendersLoading] = useState(false)
  const [senderSearch, setSenderSearch] = useState("")
  const debouncedSenderSearch = useDebounce(senderSearch, 400)
  const [createCustomerDialogOpen, setCreateCustomerDialogOpen] = useState(false)

  // Recipient and Address state
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState("")
  const debouncedRecipientSearch = useDebounce(recipientSearch, 400)
  const [createRecipientDialogOpen, setCreateRecipientDialogOpen] = useState(false)
  const [createAddressDialogOpen, setCreateAddressDialogOpen] = useState(false)
  const [userAddresses, setUserAddresses] = useState<Address[]>([])
  const [userAddressesLoading, setUserAddressesLoading] = useState(false)

  // Price calculation state
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)
  const [priceDetails, setPriceDetails] = useState<CalculateShippingPriceResponse | null>(null)
  const [calculatingPrice, setCalculatingPrice] = useState(false)
  const [priceCalculationError, setPriceCalculationError] = useState<string | null>(null)

  const [chargeCategory, setChargeCategory] = useState<"inside" | "outside">("inside")
  const [createdShipmentId, setCreatedShipmentId] = useState<string | null>(null)
  const [paymentLinkModalOpen, setPaymentLinkModalOpen] = useState(false)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState(false)
  const [dimensionsOpen, setDimensionsOpen] = useState<Record<number, boolean>>({})

  // Watch new fields
  const recipientId = watch("recipientId")
  const recipientOption = watch("recipientOption")
  const senderAddressId = watch("senderAddressId")
  const destinationAddressId = watch("destinationAddressId")
  const senderId = watch("senderId")
  const isDoorPickup = watch("isDoorPickup")

  // Watch legacy fields
  const destinationCountryId = watch("destinationCountryId")
  const destinationStateId = watch("destinationStateId")
  const senderCountryId = watch("senderCountryId")
  const senderStateId = watch("senderStateId")
  const deliveryOption = watch("deliveryOption")
  const pickupPointId = watch("pickupPointId")
  const deliveryLat = watch("deliveryLat")
  const deliveryLng = watch("deliveryLng")
  const parcels = watch("parcels")
  const insideChargeId = watch("insideCityCharge")
  const outsideChargeId = watch("outsideCityCharge")
  const countryId = watch("countryId")
  const applyInsurance = watch("applyInsurance")
  const isScheduled = watch("isScheduled")
  const customInsuranceAmount = watch("customInsuranceAmount")

  // Watch all form values to ensure any nested field changes (like parcel packagingId, extraCost) trigger recalculation
  // This ensures the summary updates immediately when pricing-related fields change
  const allFormValues = watch()

  const selectedInsideCharge = useMemo(
    () => insideCharges.find((charge) => charge.id === insideChargeId) || null,
    [insideCharges, insideChargeId]
  )
  const selectedOutsideCharge = useMemo(
    () => outsideCharges.find((charge) => charge.id === outsideChargeId) || null,
    [outsideCharges, outsideChargeId]
  )

  const rushHourPricing = useMemo(
    () => costings.find((rate) => rate.slug === "rush-hour") || null,
    [costings]
  )

  const scheduledDeliveryPricing = useMemo(
    () => costings.find((rate) => rate.slug === "scheduled") || null,
    [costings]
  )

  const liquidFragilePricing = useMemo(
    () => costings.find((rate) => rate.slug === "liquid-fragile") || null,
    [costings]
  )

  const sameDayPricing = useMemo(
    () => costings.find((rate) => rate.slug === "same-day") || null,
    [costings]
  )

  useEffect(() => {
    if (insideChargeId && chargeCategory !== "inside") {
      setChargeCategory("inside")
    } else if (!insideChargeId && outsideChargeId && chargeCategory !== "outside") {
      setChargeCategory("outside")
    }
  }, [insideChargeId, outsideChargeId, chargeCategory])

  // Automatically set isDoorPickup to false when delivery option is "pickup"
  useEffect(() => {
    if (deliveryOption === "pickup") {
      setValue("isDoorPickup", false, { shouldDirty: true })
    }
  }, [deliveryOption, setValue])

  const vatRate = (settingsStore.generalSettings?.vat || 0) / 100
  const taxRate = (settingsStore.generalSettings?.tax || 0) / 100
  const insuranceRate = (settingsStore.generalSettings?.insurance || 0) / 100

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
    // Need cityType, route selected, and at least one parcel with weight
    if (!chargeCategory || parcels.length === 0) {
      setCalculatedPrice(null)
      setPriceDetails(null)
      setPriceCalculationError(null)
      return
    }

    // Check if a route is selected
    const hasRoute = chargeCategory === "inside"
      ? insideChargeId != null
      : outsideChargeId != null

    if (!hasRoute) {
      setCalculatedPrice(null)
      setPriceDetails(null)
      setPriceCalculationError(null)
      return
    }

    // Calculate total weight from all parcels
    // Weight is optional if dimensions are provided
    const totalWeight = parcels.reduce((sum, parcel) => {
      const hasDimensions =
        parcel.length && parcel.width && parcel.height &&
        parseNumber(parcel.length) > 0 &&
        parseNumber(parcel.width) > 0 &&
        parseNumber(parcel.height) > 0

      // If dimensions exist, weight is optional
      if (hasDimensions && !parcel.weight) {
        return sum // Skip weight calculation if dimensions exist and weight not provided
      }

      const weight = parseNumber(parcel.weight) || 0
      const quantity = parseNumber(parcel.quantity) || 1
      return sum + weight * quantity
    }, 0)

    // Check if we have either weight or dimensions for pricing
    const hasWeightOrDimensions = parcels.some(parcel => {
      const hasWeight = parcel.weight && parseNumber(parcel.weight) > 0
      const hasDimensions =
        parcel.length && parcel.width && parcel.height &&
        parseNumber(parcel.length) > 0 &&
        parseNumber(parcel.width) > 0 &&
        parseNumber(parcel.height) > 0
      return hasWeight || hasDimensions
    })

    if (!hasWeightOrDimensions) {
      setCalculatedPrice(null)
      setPriceDetails(null)
      setPriceCalculationError(null)
      return
    }

    // Get dimensions from first parcel (or use largest if multiple)
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

      // Add dimensions if available
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
    } catch (error: unknown) {
      console.error("Failed to calculate shipping price:", error)
      const errorMessage = (error as { response?: { message?: string }; message?: string })?.response?.message ||
        (error as { message?: string })?.message ||
        "Failed to calculate shipping price"
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

  const summaryBreakdown: SummaryBreakdown = useMemo(() => {
    // Use calculated price from API, fallback to 0 if not calculated yet
    const baseAmount = calculatedPrice || 0

    const packagingCharge = parcels.reduce((sum, parcel) => {
      if (!parcel.packagingId) return sum
      const packagingIdNum = typeof parcel.packagingId === "string" ? Number(parcel.packagingId) : parcel.packagingId
      const packaging = packagingOptions.find((option) => Number(option.id) === packagingIdNum)
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

    // Calculate liquid/fragile charge
    const liquidFragileUnits = parcels.reduce((sum, parcel) => {
      if (!parcel.isLiquidFragile) return sum
      return sum + (Number(parcel.quantity) || 1)
    }, 0)
    const liquidFragileUnitCharge =
      liquidFragilePricing != null
        ? chargeCategory === "inside"
          ? parseNumber(liquidFragilePricing.insideCharge)
          : parseNumber(liquidFragilePricing.outsideCharge)
        : 0
    const liquidFragileCharge = liquidFragileUnits * liquidFragileUnitCharge

    // Only apply scheduled delivery charge if scheduled delivery is selected
    const scheduledDeliveryCharge = isScheduled && scheduledDeliveryPricing != null
      ? chargeCategory === "inside"
        ? parseNumber(scheduledDeliveryPricing.insideCharge)
        : parseNumber(scheduledDeliveryPricing.outsideCharge)
      : 0

    // Calculate same-day delivery charge if same-day delivery option is selected
    const sameDayCharge = deliveryOption === "same-day" && sameDayPricing != null
      ? chargeCategory === "inside"
        ? parseNumber(sameDayPricing.insideCharge)
        : parseNumber(sameDayPricing.outsideCharge)
      : 0

    const volumetricWeight = parcels.reduce((sum, parcel) => {
      const length = Number(parcel.length) || 0
      const width = Number(parcel.width) || 0
      const height = Number(parcel.height) || 0
      const quantity = Number(parcel.quantity) || 1
      if (!length || !width || !height) return sum
      const volumetric = (length * width * height) / 5000
      return sum + volumetric * quantity
    }, 0)

    const amountBeforeTaxes = baseAmount + packagingCharge + parcelExtra + rushHourCharge + liquidFragileCharge + scheduledDeliveryCharge + sameDayCharge
    const vat = amountBeforeTaxes * vatRate
    const tax = amountBeforeTaxes * taxRate

    // Calculate total declared value from all parcels
    const totalDeclaredValue = parcels.reduce((sum, parcel) => {
      const declaredValue = parseNumber(parcel.declaredValue) || 0
      const quantity = parseNumber(parcel.quantity) || 1
      return sum + declaredValue * quantity
    }, 0)

    // Get insurance calculation method from settings (default to "declaredValue" for backward compatibility)
    const insuranceCalculationMethod = settingsStore.generalSettings?.insuranceCalculationMethod || "declaredValue"
    
    // Determine the base value for insurance calculation based on the selected method
    let insuranceBaseValue: number
    switch (insuranceCalculationMethod) {
      case "declaredValue":
        insuranceBaseValue = totalDeclaredValue
        break
      case "subtotal":
        insuranceBaseValue = amountBeforeTaxes
        break
      case "both":
        insuranceBaseValue = totalDeclaredValue + amountBeforeTaxes
        break
      default:
        insuranceBaseValue = totalDeclaredValue
    }

    // Insurance threshold check: compare against the base value determined by the calculation method
    const insuranceThreshold = settingsStore.generalSettings?.insuranceThreshold || 0
    const isInsuranceApplicable = insuranceBaseValue > insuranceThreshold

    // Use custom insurance percentage if applyInsurance is true, otherwise use the rate from settings
    // Custom insurance amount is in percentage (e.g., 5 means 5%), so divide by 100
    // Insurance is calculated on the base value determined by the calculation method
    const customInsuranceRate = applyInsurance ? (parseNumber(customInsuranceAmount) || 0) / 100 : 0
    const insurance = isInsuranceApplicable
      ? applyInsurance
        ? insuranceBaseValue * customInsuranceRate
        : insuranceBaseValue * insuranceRate
      : 0
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
      liquidFragileCharge,
      scheduledDeliveryCharge,
      sameDayCharge,
      vat,
      tax,
      insurance,
      totalShippingFee: total,
      volumetricWeight,
      shippingType: formatDeliveryOption(deliveryOption),
      distanceKm,
      insuranceThreshold,
      isInsuranceApplicable,
      totalDeclaredValue, // Add total declared value to breakdown
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chargeCategory,
    selectedInsideCharge,
    selectedOutsideCharge,
    rushHourPricing,
    liquidFragilePricing,
    sameDayPricing,
    parcels,
    packagingOptions,
    vatRate,
    taxRate,
    insuranceRate,
    applyInsurance,
    customInsuranceAmount,
    selectedWarehouse,
    deliveryCoords,
    deliveryOption,
    settingsStore.generalSettings?.insuranceThreshold,
    calculatedPrice, // Include calculated price in dependencies
    scheduledDeliveryPricing,
    isScheduled, // Include isScheduled to trigger recalculation when scheduled delivery is toggled
    allFormValues, // Watch all form values to trigger recalculation on any field change, including nested parcel fields
  ])

  const hasMoreWarehouses =
    warehousesMeta && warehousesMeta.total > warehousesMeta.page * warehousesMeta.limit ? true : false

  const handleLoadWarehouses = useCallback(
    async (page = 1, append = false, searchTerm?: string) => {
      setWarehousesLoading(true)
      try {
        const response = await shipmentStore.fetchWarehouses({
          page,
          search: searchTerm,
        })
        setWarehouses((prev) => (append ? [...prev, ...(response.data || [])] : response.data || []))
        setWarehousesMeta(response.meta)
      } catch (error) {
        console.error(error)
        toastUtils.error("Failed to Fetch Warehouses", "Unable to retrieve pickup points.")
      } finally {
        setWarehousesLoading(false)
      }
    },
    [shipmentStore]
  )

  const handleLoadSenders = useCallback(
    async (page = 1, searchTerm?: string) => {
      setSendersLoading(true)
      try {
        const response = await userStore.fetchCustomers({
          page,
          search: searchTerm,
        })
        setSenders(response.data || [])
      } catch (error) {
        console.error(error)
        toastUtils.error("Failed to Fetch Customers", "Unable to retrieve customers list.")
      } finally {
        setSendersLoading(false)
      }
    },
    [userStore]
  )

  const handleLoadRecipients = useCallback(
    async (page = 1, searchTerm?: string) => {
      setRecipientsLoading(true)
      try {
        const response = await recipientStore.fetchAllRecipients({
          page,
          search: searchTerm,
          limit: 20,
        })
        setRecipients(response.success ? recipientStore.recipients : [])
      } catch (error) {
        console.error(error)
        toastUtils.error("Failed to Fetch Recipients", "Unable to retrieve recipients list.")
      } finally {
        setRecipientsLoading(false)
      }
    },
    [recipientStore]
  )

  const handleLoadUserAddresses = useCallback(
    async (userId: string) => {
      if (!userId) return
      setUserAddressesLoading(true)
      try {
        const result = await addressStore.fetchUserAddresses(userId)
        if (result.success) {
          setUserAddresses(addressStore.addresses)
          // Set default address if available
          const defaultAddress = addressStore.addresses.find((a) => a.isDefault)
          if (defaultAddress && !isDoorPickup) {
            setValue("senderAddressId", defaultAddress.id)
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setUserAddressesLoading(false)
      }
    },
    [addressStore, isDoorPickup, setValue]
  )

  const loadSupportingData = useCallback(async () => {
    setCountriesLoading(true)
    setLoadingInsideCharges(true)
    setLoadingOutsideCharges(true)
    setLoadingPackaging(true)
    try {
      const [countriesRes, insideRes, outsideRes, packagingRes, costingRes] = await Promise.all([
        shipmentStore.fetchCountries({ limit: 300 }),
        shipmentStore.fetchInsideCityCharges(),
        shipmentStore.fetchOutsideCityCharges(),
        shipmentStore.fetchPackagingOptions(),
        shipmentStore.fetchCostings(),
      ])
      setCountries(countriesRes || [])
      setInsideCharges(insideRes || [])
      setOutsideCharges(outsideRes || [])
      setPackagingOptions(packagingRes || [])
      setCostings(costingRes || [])
    } catch (error) {
      console.error(error)
      toastUtils.error("Failed to Load Data", "Unable to fetch supporting data for the form.")
    } finally {
      setCountriesLoading(false)
      setLoadingInsideCharges(false)
      setLoadingOutsideCharges(false)
      setLoadingPackaging(false)
    }
  }, [shipmentStore])

  useEffect(() => {
    loadSupportingData()
    handleLoadWarehouses(1, false, undefined)
    handleLoadSenders(1, undefined)
    handleLoadRecipients(1, undefined)
  }, [loadSupportingData, handleLoadWarehouses, handleLoadSenders, handleLoadRecipients])

  useEffect(() => {
    handleLoadWarehouses(1, false, debouncedWarehouseSearch || undefined)
  }, [debouncedWarehouseSearch, handleLoadWarehouses])

  useEffect(() => {
    handleLoadSenders(1, debouncedSenderSearch || undefined)
  }, [debouncedSenderSearch, handleLoadSenders])

  useEffect(() => {
    handleLoadRecipients(1, debouncedRecipientSearch || undefined)
  }, [debouncedRecipientSearch, handleLoadRecipients])

  // Load user addresses when sender is selected
  useEffect(() => {
    if (senderId && !isDoorPickup) {
      handleLoadUserAddresses(senderId)
    } else {
      setUserAddresses([])
      setValue("senderAddressId", null)
    }
  }, [senderId, isDoorPickup, handleLoadUserAddresses, setValue])

  // Update destination address when recipient is selected
  useEffect(() => {
    if (recipientId && recipientOption === "existing") {
      const recipient = recipients.find((r) => r.id === recipientId)
      if (recipient?.addressId) {
        setValue("destinationAddressId", recipient.addressId)
      }
    }
  }, [recipientId, recipientOption, recipients, setValue])

  useEffect(() => {
    if (!destinationCountryId) {
      setDestinationStates([])
      setDestinationCities([])
      setDestinationLgas([])
      setValue("destinationStateId", null)
      setValue("destinationCityId", null)
      setValue("destinationLgaId", null)
      return
    }
    const fetchStates = async () => {
      setLoadingDestinationStates(true)
      try {
        const response = await shipmentStore.fetchStates(destinationCountryId, { limit: 200 })
        setDestinationStates(response || [])
      } catch (error) {
        console.error(error)
        toastUtils.error("Failed to Load States", "Unable to fetch destination states.")
      } finally {
        setLoadingDestinationStates(false)
      }
    }
    fetchStates()
  }, [destinationCountryId, setValue, shipmentStore])

  useEffect(() => {
    if (!destinationStateId) {
      setDestinationCities([])
      setDestinationLgas([])
      setValue("destinationCityId", null)
      setValue("destinationLgaId", null)
      return
    }
    const fetchCitiesAndLgas = async () => {
      setLoadingDestinationCities(true)
      setLoadingDestinationLgas(true)
      try {
        const [citiesRes, lgasRes] = await Promise.all([
          shipmentStore.fetchCities(destinationStateId, { limit: 200 }),
          shipmentStore.fetchLgas(destinationStateId, { limit: 200 }),
        ])
        setDestinationCities(citiesRes || [])
        setDestinationLgas(lgasRes || [])
      } catch (error) {
        console.error(error)
        toastUtils.error("Failed to Load Destination Locations", "Unable to fetch cities/LGAs.")
      } finally {
        setLoadingDestinationCities(false)
        setLoadingDestinationLgas(false)
      }
    }
    fetchCitiesAndLgas()
  }, [destinationStateId, setValue, shipmentStore])

  useEffect(() => {
    if (!senderCountryId) {
      setSenderStates([])
      setSenderCities([])
      setSenderLgas([])
      setValue("senderStateId", null)
      setValue("senderCityId", null)
      setValue("senderLgaId", null)
      return
    }
    const fetchStates = async () => {
      setLoadingSenderStates(true)
      try {
        const response = await shipmentStore.fetchStates(senderCountryId, { limit: 200 })
        setSenderStates(response || [])
      } catch (error) {
        console.error(error)
        toastUtils.error("Failed to Load Sender States", "Unable to fetch sender states.")
      } finally {
        setLoadingSenderStates(false)
      }
    }
    fetchStates()
  }, [senderCountryId, setValue, shipmentStore])

  useEffect(() => {
    if (!senderStateId) {
      setSenderCities([])
      setSenderLgas([])
      setValue("senderCityId", null)
      setValue("senderLgaId", null)
      return
    }
    const fetchCitiesAndLgas = async () => {
      setLoadingSenderCities(true)
      setLoadingSenderLgas(true)
      try {
        const [citiesRes, lgasRes] = await Promise.all([
          shipmentStore.fetchCities(senderStateId, { limit: 200 }),
          shipmentStore.fetchLgas(senderStateId, { limit: 200 }),
        ])
        setSenderCities(citiesRes || [])
        setSenderLgas(lgasRes || [])
      } catch (error) {
        console.error(error)
        toastUtils.error("Failed to Load Sender Locations", "Unable to fetch sender cities/LGAs.")
      } finally {
        setLoadingSenderCities(false)
        setLoadingSenderLgas(false)
      }
    }
    fetchCitiesAndLgas()
  }, [senderStateId, setValue, shipmentStore])

  useEffect(() => {
    if (!countryId && destinationCountryId) {
      setValue("countryId", destinationCountryId)
    }
  }, [countryId, destinationCountryId, setValue])

  // Set Nigeria as default destination country
  useEffect(() => {
    if (countries.length > 0 && !destinationCountryId) {
      const nigeria = countries.find((c) => c.name.toLowerCase() === "nigeria")
      if (nigeria) {
        setValue("destinationCountryId", nigeria.id)
      }
    }
  }, [countries, destinationCountryId, setValue])


  const createShipmentPayload = useCallback((values: CreateShipmentFormValues): CreateShipmentPayload => {
    return {
      // New structure: Use recipientId if existing recipient selected
      ...(values.recipientOption === "existing" && values.recipientId
        ? { recipientId: values.recipientId }
        : {}),
      // New structure: Use senderAddressId if not door pickup
      ...(values.senderAddressId && !values.isDoorPickup ? { senderAddressId: values.senderAddressId } : {}),
      // New structure: Use destinationAddressId if available
      ...(values.destinationAddressId ? { destinationAddressId: values.destinationAddressId } : {}),
      // Common fields
      senderId: values.senderId!,
      deliveryOption: values.deliveryOption,
      isDoorPickup: values.isDoorPickup,
      pickupPointId: values.pickupPointId!,
      insideCityCharge: values.insideCityCharge,
      outsideCityCharge: values.outsideCityCharge,
      parcels: values.parcels.map((parcel) => {
        const hasDimensions = parcel.length && parcel.width && parcel.height
        const weight = parcel.weight ? Number(parcel.weight) : null

        return {
          ...(parcel.packagingId ? { packagingId: parcel.packagingId as number } : {}),
          length: Number(parcel.length) || 0,
          width: Number(parcel.width) || 0,
          height: Number(parcel.height) || 0,
          weight: hasDimensions ? weight : (weight || 0), // Optional if dimensions exist, required otherwise
          quantity: Number(parcel.quantity) || 1,
          isRushHour: parcel.isRushHour,
          isLiquidFragile: parcel.isLiquidFragile,
          extraCost: Number(parcel.extraCost) || 0,
          declaredValue: parcel.declaredValue ? Number(parcel.declaredValue) : null, // Convert to number
          description: parcel.description?.trim() || null, // Optional parcel description
        }
      }),
      whoPaysShippingFee: values.whoPaysShippingFee,
      paymentType: values.paymentType,
      paymentMode: values.paymentMode,
      note: values.note || undefined,
      isScheduled: values.isScheduled,
      scheduledDate: values.isScheduled && values.scheduledDate ? new Date(values.scheduledDate).toISOString() : null,
      countryId: values.countryId as number,
      applyInsurance: values.applyInsurance,
      insurance: values.applyInsurance ? summaryBreakdown.insurance : undefined,
      // Legacy fields (for backward compatibility - will be deprecated)
      ...(values.destinationCountryId
        ? {
          destinationCountryId: values.destinationCountryId,
          // Removed destinationStateId, destinationCityId, destinationLgaId as not needed on backend
        }
        : {}),
      ...(values.senderCountryId && !values.senderAddressId
        ? {
          senderCountryId: values.senderCountryId,
          senderStateId: values.senderStateId as number,
          senderCityId: values.senderCityId as number,
          senderLgaId: values.senderLgaId as number,
        }
        : {}),
      ...(values.recipientFirstName
        ? {
          recipientFirstName: values.recipientFirstName,
          recipientLastName: values.recipientLastName,
          recipientPhoneNumber: values.recipientPhoneNumber,
          recipientEmail: values.recipientEmail,
          recipientAddress: values.recipientAddress,
        }
        : {}),
      // Always include delivery address and coordinates when available
      ...(values.deliveryAddress
        ? {
          deliveryAddress: values.deliveryAddress,
          deliveryLat: values.deliveryLat ?? undefined,
          deliveryLng: values.deliveryLng ?? undefined,
        }
        : {}),
    }
  }, [summaryBreakdown.insurance])

  const validateForm = useCallback((values: CreateShipmentFormValues): boolean => {
    if (!values.senderId) {
      toastUtils.error("Sender Required", "Please select a sender.")
      return false
    }

    // Validate recipient
    if (values.recipientOption === "existing" && !values.recipientId) {
      toastUtils.error("Recipient Required", "Please select a recipient.")
      return false
    }

    // Validate sender address (if not door pickup)
    if (!values.isDoorPickup && !values.senderAddressId) {
      toastUtils.error("Sender Address Required", "Please select a sender address or enable door pickup.")
      return false
    }

    if (!values.pickupPointId) {
      toastUtils.error("Pickup Point Required", "Please select a pickup point.")
      return false
    }

    if (!values.insideCityCharge && !values.outsideCityCharge) {
      toastUtils.error("Charge Required", "Select at least one inside or outside city charge.")
      return false
    }

    if (!values.parcels.length) {
      toastUtils.error("Parcels Required", "Please add at least one parcel.")
      return false
    }

    return true
  }, [])

  const handleCreateShipment = useCallback(async (values: CreateShipmentFormValues, createPaymentLink: boolean = false) => {
    if (!validateForm(values)) {
      return
    }

    const payload = createShipmentPayload(values)
    // Remove all null and undefined values from payload before sending
    const cleanedPayload = removeNullValues(payload as unknown as Record<string, unknown>) as unknown as CreateShipmentPayload

    const result = await shipmentStore.createShipment(cleanedPayload)
    if (result.success && result.data) {
      const shipmentId = result.data.id
      setCreatedShipmentId(shipmentId)
      toastUtils.success("Shipment Created", "The shipment has been created successfully.")

      if (createPaymentLink) {
        // Create payment link
        setIsCreatingPaymentLink(true)
        try {
          const amount = summaryBreakdown.totalShippingFee

          // Get logo image URL
          const logoUrl = typeof window !== "undefined"
            ? `${window.location.origin}/images/logo_full.png`
            : ""

          // Get recipient information
          const currentRecipient = values.recipientOption === "existing" && values.recipientId
            ? recipients.find(r => r.id === values.recipientId)
            : null
          const recipientName = currentRecipient
            ? `${currentRecipient.firstName} ${currentRecipient.lastName}`
            : values.recipientFirstName && values.recipientLastName
              ? `${values.recipientFirstName} ${values.recipientLastName}`
              : ""

          // Get sender information
          const senderName = senders.find(s => s.id === values.senderId)
            ? `${senders.find(s => s.id === values.senderId)?.profile?.firstName} ${senders.find(s => s.id === values.senderId)?.profile?.lastName}`
            : ""

          // Include metadata with shipment information
          const metadata: Record<string, string | number> = {
            logoImage: logoUrl,
            shipmentId: shipmentId,
            trackingCode: result.data.trackingCode,
            senderName,
            recipientName,
            deliveryAddress: values.deliveryAddress || "",
            amount: amount || 0,
          }

          const paymentPayload: CreatePaystackPaymentLinkPayload = {
            ...(amount ? { amount } : {}),
            successMessage: "Payment successful!",
            name: result.data.trackingCode,
            description: "Payment for shipment " + result.data.trackingCode,
            metadata,
          }

          const response = await ApiService.createPaystackPaymentLink(shipmentId, paymentPayload)

          if (response.status && response.data) {
            setPaymentLink(response.data.paymentUrl)
            setPaymentLinkModalOpen(true)
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
      } else {
        // Redirect to all shipments
        router.push("/shipment-management/shipments")
      }
    }
  }, [validateForm, createShipmentPayload, shipmentStore, summaryBreakdown.totalShippingFee, recipients, senders, router])

  const onSubmit = async (values: CreateShipmentFormValues) => {
    await handleCreateShipment(values, false)
  }

  return (
    <PageTransition>
      <div className="flex flex-1 flex-col gap-6 pb-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <DashboardHeader title="Create Shipment" />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                handleLoadWarehouses(1, false, debouncedWarehouseSearch || undefined)
                handleLoadSenders(1, debouncedSenderSearch || undefined)
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </div>

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
                              options={senders}
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
                  <Alert className="mt-2">
                    <AlertTitle>Heads up</AlertTitle>
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

                {!isDoorPickup && senderId && (
                  <div className="space-y-2">
                    <Label>Sender Address *</Label>
                    <Controller
                      control={control}
                      name="senderAddressId"
                      rules={{
                        required: !isDoorPickup ? "Sender address is required when not using door pickup." : false,
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
                            // Ensure required fields are present (cityId, stateId, lgaId are now optional)
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
                              userId: senderId || undefined,
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
                          countriesLoading={countriesLoading}
                          userId={senderId || undefined}
                          showDefaultCheckbox={true}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recipient Information</CardTitle>
                <CardDescription>Select an existing recipient or create a new one</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient Option *</Label>
                  <Controller
                    control={control}
                    name="recipientOption"
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="existing" id="recipient-existing" />
                          <Label htmlFor="recipient-existing" className="cursor-pointer">
                            Use Existing Recipient
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="new" id="recipient-new" />
                          <Label htmlFor="recipient-new" className="cursor-pointer">
                            Create New Recipient
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                {recipientOption === "existing" && (
                  <div className="space-y-2">
                    <Label>Select Recipient *</Label>
                    <Controller
                      control={control}
                      name="recipientId"
                      rules={{ required: recipientOption === "existing" ? "Recipient selection is required." : false }}
                      render={({ field }) => (
                        <>
                          <RecipientSelector
                            value={field.value}
                            onChange={field.onChange}
                            options={recipients}
                            isLoading={recipientsLoading}
                            onSearch={setRecipientSearch}
                            onCreateNew={() => setValue("recipientOption", "new")}
                            placeholder="Search and select recipient"
                          />
                          {errors.recipientId && (
                            <p className="text-sm text-destructive">{errors.recipientId.message}</p>
                          )}
                        </>
                      )}
                    />
                  </div>
                )}

                {recipientOption === "new" && (
                  <Alert>
                    <AlertTitle>Create New Recipient</AlertTitle>
                    <AlertDescription>
                      You can create a new recipient inline. The recipient will be saved and can be reused for future shipments.
                    </AlertDescription>
                  </Alert>
                )}

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
                        const result = await recipientStore.createRecipient(data as CreateRecipientPayload)
                        if (result.status && result.data) {
                          setRecipients([...recipients, result.data])
                          setValue("recipientId", result.data.id)
                          setValue("recipientOption", "existing")
                          setCreateRecipientDialogOpen(false)
                          return { success: true }
                        }
                        return { success: false }
                      }}
                      onCancel={() => setCreateRecipientDialogOpen(false)}
                      addressStore={addressStore}
                      shipmentStore={shipmentStore}
                      countries={countries}
                      countriesLoading={countriesLoading}
                      showAddressForm={true}
                    />
                  </DialogContent>
                </Dialog>

                {recipientOption === "new" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateRecipientDialogOpen(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Recipient
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle>Destination Location</CardTitle>
                <CardDescription>Select the destination geo hierarchy</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Controller
                    control={control}
                    name="destinationCountryId"
                    rules={{ required: "Destination country is required." }}
                    render={({ field }) => (
                      <>
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => field.onChange(Number(value))}
                          disabled={countriesLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={countriesLoading ? "Loading countries..." : "Select country"} />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.id} value={String(country.id)}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.destinationCountryId && (
                          <p className="text-sm text-destructive">{errors.destinationCountryId.message}</p>
                        )}
                      </>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Controller
                    control={control}
                    name="destinationStateId"
                    rules={{ required: "Destination state is required." }}
                    render={({ field }) => (
                      <>
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => field.onChange(Number(value))}
                          disabled={!destinationCountryId || loadingDestinationStates}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingDestinationStates ? "Loading states..." : "Select state"} />
                          </SelectTrigger>
                          <SelectContent>
                            {destinationStates.map((state) => (
                              <SelectItem key={state.id} value={String(state.id)}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.destinationStateId && (
                          <p className="text-sm text-destructive">{errors.destinationStateId.message}</p>
                        )}
                      </>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Controller
                    control={control}
                    name="destinationCityId"
                    rules={{ required: "Destination city is required." }}
                    render={({ field }) => (
                      <>
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => field.onChange(Number(value))}
                          disabled={!destinationStateId || loadingDestinationCities}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingDestinationCities ? "Loading cities..." : "Select city"} />
                          </SelectTrigger>
                          <SelectContent>
                            {destinationCities.map((city) => (
                              <SelectItem key={city.id} value={String(city.id)}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.destinationCityId && (
                          <p className="text-sm text-destructive">{errors.destinationCityId.message}</p>
                        )}
                      </>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>LGA *</Label>
                  <Controller
                    control={control}
                    name="destinationLgaId"
                    rules={{ required: "Destination LGA is required." }}
                    render={({ field }) => (
                      <>
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => field.onChange(Number(value))}
                          disabled={!destinationStateId || loadingDestinationLgas}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingDestinationLgas ? "Loading LGAs..." : "Select LGA"} />
                          </SelectTrigger>
                          <SelectContent>
                            {destinationLgas.map((lga) => (
                              <SelectItem key={lga.id} value={String(lga.id)}>
                                {lga.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.destinationLgaId && (
                          <p className="text-sm text-destructive">{errors.destinationLgaId.message}</p>
                        )}
                      </>
                    )}
                  />
                </div>
              </CardContent>
            </Card> */}

            <Card>
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
                <CardDescription>Configure delivery option, pickup point and address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Delivery Option *</Label>
                    <Controller
                      control={control}
                      name="deliveryOption"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="pickup">Pickup</SelectItem>
                            <SelectItem value="same-day">Same Day</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Who Pays Shipping Fee *</Label>
                    <Controller
                      control={control}
                      name="whoPaysShippingFee"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sender">Sender</SelectItem>
                            <SelectItem value="recipient">Recipient</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border px-4 py-2">
                    <div className="space-y-0.5">
                      <Label className="text-base">Door Pickup?</Label>
                      <p className="text-sm text-muted-foreground">
                        {deliveryOption === "pickup"
                          ? "Not applicable for pickup option"
                          : "Enable if parcels will be retrieved from door"}
                      </p>
                    </div>
                    <Controller
                      control={control}
                      name="isDoorPickup"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={deliveryOption === "pickup"}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pickup Point *</Label>
                  <div className="grid gap-2 md:grid-cols-[2fr_1fr]">
                    <Input
                      placeholder="Search pickup point"
                      leftIcon={<Search className="h-4 w-4" />}
                      value={warehousesSearch}
                      className="pl-8"
                      onChange={(event) => setWarehousesSearch(event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleLoadWarehouses(1, false, debouncedWarehouseSearch || undefined)}
                      disabled={warehousesLoading}
                    >
                      {warehousesLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Refresh Warehouses
                    </Button>
                  </div>
                  <Controller
                    control={control}
                    name="pickupPointId"
                    rules={{ required: "Pickup point is required." }}
                    render={({ field }) => (
                      <>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          disabled={warehousesLoading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={warehousesLoading ? "Loading warehouses..." : "Select pickup point"} />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name} • {warehouse.city}, {warehouse.state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.pickupPointId && (
                          <p className="text-sm text-destructive">{errors.pickupPointId.message}</p>
                        )}
                      </>
                    )}
                  />
                  {hasMoreWarehouses && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-fit"
                      disabled={warehousesLoading}
                      onClick={() =>
                        handleLoadWarehouses(
                          (warehousesMeta?.page || 1) + 1,
                          true,
                          debouncedWarehouseSearch || undefined
                        )
                      }
                    >
                      Load more warehouses
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Delivery Address *</Label>
                  <Controller
                    control={control}
                    name="deliveryAddress"
                    rules={{ required: "Delivery address is required." }}
                    render={({ field }) => (
                      <GooglePlacesInput
                        value={field.value}
                        onValueChange={field.onChange}
                        onCoordinatesCleared={() => {
                          setValue("deliveryLat", null)
                          setValue("deliveryLng", null)
                        }}
                        onPlaceResolved={({ address, lat, lng }) => {
                          field.onChange(address)
                          setValue("deliveryLat", lat)
                          setValue("deliveryLng", lng)
                        }}
                        error={errors.deliveryAddress?.message}
                      />
                    )}
                  />
                  <div className="text-sm text-muted-foreground">
                    {deliveryLat && deliveryLng ? (
                      <p>
                        Coordinates: {deliveryLat.toFixed(4)}, {deliveryLng.toFixed(4)}
                      </p>
                    ) : (
                      <p>Select a suggestion to capture coordinates.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parcels</CardTitle>
                <CardDescription>Declare all parcels included in this shipment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {parcelFields.map((parcel, index) => (
                  <div key={parcel.id} className="rounded-lg border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-medium">Parcel {index + 1}</p>
                      {parcelFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParcel(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Packaging</Label>
                        <Controller
                          control={control}
                          name={`parcels.${index}.packagingId`}
                          render={({ field }) => (
                            <>
                              <Select
                                value={field.value ? String(field.value) : "none"}
                                onValueChange={(value) => field.onChange(value === "none" ? null : Number(value))}
                                disabled={loadingPackaging}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder={loadingPackaging ? "Loading packaging..." : "Select packaging (optional)"}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None (No Packaging)</SelectItem>
                                  {packagingOptions.map((pkg) => (
                                    <SelectItem key={pkg.id} value={String(pkg.id)}>
                                      {pkg.name} • {formatCurrency(Number(pkg.price) || 0)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors.parcels?.[index]?.packagingId && (
                                <p className="text-sm text-destructive">
                                  {errors.parcels[index]?.packagingId?.message as string}
                                </p>
                              )}
                            </>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          {...register(`parcels.${index}.quantity`, {
                            required: "Quantity is required.",
                            pattern: {
                              value: /^[1-9]\d*$/,
                              message: "Quantity must be a positive number."
                            },
                            min: { value: 1, message: "Quantity cannot be less than 1." }
                          })}
                        />
                        {errors.parcels?.[index]?.quantity && (
                          <p className="text-sm text-destructive">
                            {errors.parcels[index]?.quantity?.message as string}
                          </p>
                        )}
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
                              type="text"
                              inputMode="numeric"
                              {...register(`parcels.${index}.weight`, {
                                required: "Weight is required.",
                                min: { value: 0.5, message: "Weight must be at least 0.5 kg." },
                                pattern: {
                                  value: /^\d*\.?\d+$/,
                                  message: "Weight must be a valid number."
                                }
                              })}
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
                            />
                          )}
                        />
                        {errors.parcels?.[index]?.weight && (
                          <p className="text-sm text-destructive">
                            {errors.parcels[index]?.weight?.message as string}
                          </p>
                        )}
                        {watch(`parcels.${index}.length`) && watch(`parcels.${index}.width`) && watch(`parcels.${index}.height`) && (
                          <p className="text-xs text-muted-foreground">
                            Optional when dimensions are provided
                          </p>
                        )}
                      </div>
                      <Collapsible
                        open={dimensionsOpen[index] || false}
                        onOpenChange={(open) => setDimensionsOpen(prev => ({ ...prev, [index]: open }))}
                        className="md:col-span-3"
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-4 py-3 text-left hover:bg-muted/70 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <Label className="text-sm font-medium cursor-pointer">Package Dimensions (Optional)</Label>
                                <p className="text-xs text-muted-foreground">
                                  Add dimensions to calculate volumetric weight for accurate pricing
                                </p>
                              </div>
                            </div>
                            {dimensionsOpen[index] ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 pt-4">
                          <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="flex gap-2">
                              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">What is Volumetric Weight?</p>
                                <p className="text-muted-foreground">
                                  Volumetric weight is calculated from package dimensions (length × width × height ÷ 5000).
                                  Shipping charges are based on whichever is higher: actual weight or volumetric weight.
                                  This ensures fair pricing for lightweight but bulky items.
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Length (cm)</Label>
                              <Controller
                                control={control}
                                name={`parcels.${index}.length`}
                                rules={{
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
                                    min={0}
                                    step="0.01"
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
                                  />
                                )}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Width (cm)</Label>
                              <Controller
                                control={control}
                                name={`parcels.${index}.width`}
                                rules={{
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
                                    min={0}
                                    step="0.01"
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
                                  />
                                )}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Height (cm)</Label>
                              <Controller
                                control={control}
                                name={`parcels.${index}.height`}
                                rules={{
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
                                    min={0}
                                    step="0.01"
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
                                  />
                                )}
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      <div className="space-y-2">
                        <Label>Declared Value (₦) *</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter value of goods"
                          {...register(`parcels.${index}.declaredValue`, {
                            required: "Declared value is required.",
                            pattern: {
                              value: /^[+-]?[0-9]\d*$/,
                              message: "Declared value must be a valid number."
                            }
                          })}
                        />
                        {errors.parcels?.[index]?.declaredValue && (
                          <p className="text-sm text-destructive">
                            {errors.parcels[index]?.declaredValue?.message as string}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Monetary value of goods being shipped
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Extra Cost</Label>
                        <Input type="text" inputMode="numeric" {...register(`parcels.${index}.extraCost`, {
                          pattern: {
                            value: /^[+-]?[1-9]\d*(\.\d+)?$/,
                            message: "Extra cost must be a valid number."
                          }
                        })} />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <Label>
                          Parcel Description
                          <span className="text-muted-foreground text-xs font-normal ml-1">(Optional)</span>
                        </Label>
                        <Textarea
                          rows={3}
                          placeholder="e.g., Fragile items - Handle with care, Documents - Urgent delivery, Electronics, etc."
                          {...register(`parcels.${index}.description`, {
                            maxLength: {
                              value: 500,
                              message: "Description must be less than 500 characters.",
                            },
                          })}
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground">
                          Add any special instructions or descriptions about this parcel
                        </p>
                        {errors.parcels?.[index]?.description && (
                          <p className="text-sm text-destructive">
                            {errors.parcels[index]?.description?.message as string}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between rounded-lg border px-3 py-2 space-y-2">
                        <div>
                          <Label className="text-sm font-medium">Rush Hour?</Label>
                          <p className="text-xs text-muted-foreground">Enable if parcel needs rush delivery</p>
                        </div>
                        <Controller
                          control={control}
                          name={`parcels.${index}.isRushHour`}
                          render={({ field }) => (
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          )}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border px-3 py-2 space-y-2">
                        <div>
                          <Label className="text-sm font-medium">Liquid/Fragile?</Label>
                          <p className="text-xs text-muted-foreground">Enable if parcel contains liquid or fragile items</p>
                        </div>
                        <Controller
                          control={control}
                          name={`parcels.${index}.isLiquidFragile`}
                          render={({ field }) => (
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => appendParcel(parcelDefault)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Parcel
                </Button>
              </CardContent>
            </Card>

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
                    className="grid w-full gap-3 md:w-fit md:grid-cols-2"
                  >
                    <div>
                      <RadioGroupItem value="inside" id="charge-inside" className="sr-only" />
                      <Label
                        htmlFor="charge-inside"
                        className={cn(
                          "cursor-pointer rounded-md border px-4 py-3 text-sm font-medium transition",
                          chargeCategory === "inside" ? "bg-primary text-primary-foreground" : "bg-muted/40"
                        )}
                      >
                        Inside City
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="outside" id="charge-outside" className="sr-only" />
                      <Label
                        htmlFor="charge-outside"
                        className={cn(
                          "cursor-pointer rounded-md border px-4 py-3 text-sm font-medium transition",
                          chargeCategory === "outside" ? "bg-primary text-primary-foreground" : "bg-muted/40"
                        )}
                      >
                        Outside City
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div
                    className={cn(
                      "space-y-3 rounded-lg border p-4",
                      chargeCategory !== "inside" && "bg-muted/40 opacity-70 pointer-events-none"
                    )}
                  >
                    <div>
                      <p className="font-medium">Inside City Packages</p>
                      <p className="text-sm text-muted-foreground">Select a tariff to apply within the city.</p>
                    </div>
                    <Controller
                      control={control}
                      name="insideCityCharge"
                      rules={{
                        validate: (value) =>
                          chargeCategory === "inside" ? !!value || "Select an inside city package" : true,
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
                            disabled={loadingInsideCharges || chargeCategory !== "inside"}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={loadingInsideCharges ? "Loading packages..." : "Select inside city package"}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {insideCharges.map((charge) => (
                                <SelectItem key={charge.id} value={String(charge.id)}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{charge.title}</span>
                                  </div>
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

                  <div
                    className={cn(
                      "space-y-3 rounded-lg border p-4",
                      chargeCategory !== "outside" && "bg-muted/40 opacity-70 pointer-events-none"
                    )}
                  >
                    <div>
                      <p className="font-medium">Outside City Packages</p>
                      <p className="text-sm text-muted-foreground">
                        Pick the distance-based tariff that fits this shipment.
                      </p>
                    </div>
                    <Controller
                      control={control}
                      name="outsideCityCharge"
                      rules={{
                        validate: (value) =>
                          chargeCategory === "outside" ? !!value || "Select an outside city package" : true,
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
                            disabled={loadingOutsideCharges || chargeCategory !== "outside"}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={loadingOutsideCharges ? "Loading packages..." : "Select outside city package"}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {outsideCharges.map((charge) => (
                                <SelectItem key={charge.id} value={String(charge.id)}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{charge.title}</span>
                                  </div>
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

            <Card>
              <CardHeader>
                <CardTitle>Payment & Scheduling</CardTitle>
                <CardDescription>Configure how payment is made and schedule future dispatch</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Payment Type *</Label>
                  <Controller
                    control={control}
                    name="paymentType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode *</Label>
                  <Controller
                    control={control}
                    name="paymentMode"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prepaid">Prepaid</SelectItem>
                          <SelectItem value="postpaid">Postpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border px-4 py-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Schedule Delivery</Label>
                    <p className="text-sm text-muted-foreground">Toggle on to pick a future date</p>
                  </div>
                  <Controller
                    control={control}
                    name="isScheduled"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (!checked) {
                            setValue("scheduledDate", null)
                          }
                        }}
                      />
                    )}
                  />
                </div>
                {watch("isScheduled") && (
                  <div className="space-y-2">
                    <Label>Scheduled Date *</Label>
                    <Input
                      type="datetime-local"
                      {...register("scheduledDate", {
                        required: "Select a schedule date",
                      })}
                    />
                    {errors.scheduledDate && <p className="text-sm text-destructive">{errors.scheduledDate.message}</p>}
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border px-4 py-2">
                  <div className="space-y-0.5">
                    <Label className="text-base">Apply Custom Insurance</Label>
                    <p className="text-sm text-muted-foreground">Toggle on to provide custom insurance amount</p>
                  </div>
                  <Controller
                    control={control}
                    name="applyInsurance"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                          if (!checked) {
                            setValue("customInsuranceAmount", "", { shouldDirty: true })
                          }
                        }}
                      />
                    )}
                  />
                </div>
                {watch("applyInsurance") && (
                  <div className="space-y-2">
                    <Label>Custom Insurance Percentage (%) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter insurance percentage (e.g., 5 for 5%)"
                      {...register("customInsuranceAmount", {
                        required: watch("applyInsurance") ? "Custom insurance percentage is required" : false,
                        min: {
                          value: 0,
                          message: "Insurance percentage must be greater than or equal to 0",
                        },
                      })}
                    />
                    {errors.customInsuranceAmount && (
                      <p className="text-sm text-destructive">{errors.customInsuranceAmount.message}</p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Shipment Country *</Label>
                  <Controller
                    control={control}
                    name="countryId"
                    rules={{ required: "Shipment country is required." }}
                    render={({ field }) => (
                      <>
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(value) => field.onChange(Number(value))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.id} value={String(country.id)}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.countryId && <p className="text-sm text-destructive">{errors.countryId.message}</p>}
                      </>
                    )}
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <Label>Additional Note</Label>
                  <Textarea rows={3} placeholder="Add special handling notes" {...register("note")} />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                Once you create the shipment, tracking code and costing will be generated automatically.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting || isCreatingPaymentLink}
                  onClick={handleSubmit(async (values) => {
                    await handleCreateShipment(values, false)
                  })}
                  className="min-w-[180px]"
                >
                  {isSubmitting && !isCreatingPaymentLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Shipment
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting || isCreatingPaymentLink}
                  onClick={handleSubmit(async (values) => {
                    await handleCreateShipment(values, true)
                  })}
                  className="min-w-[240px]"
                >
                  {(isSubmitting || isCreatingPaymentLink) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCreatingPaymentLink ? "Creating Link..." : "Create Shipment & Payment Link"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Payment Link Modal */}
      <Dialog open={paymentLinkModalOpen} onOpenChange={setPaymentLinkModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Link Created</DialogTitle>
            <DialogDescription>
              Your payment link has been generated successfully. Copy it to share with your customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Link</Label>
              <div className="flex gap-2">
                <Input
                  value={paymentLink || ""}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    if (paymentLink) {
                      try {
                        await navigator.clipboard.writeText(paymentLink)
                        toastUtils.success("Copied!", "Payment link copied to clipboard")
                      } catch (error) {
                        console.error("Failed to copy:", error)
                        toastUtils.error("Failed", "Failed to copy payment link")
                      }
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPaymentLinkModalOpen(false)
                  router.push("/shipment-management/shipments")
                }}
              >
                Close
              </Button>
              {createdShipmentId && (
                <Button
                  type="button"
                  onClick={() => {
                    setPaymentLinkModalOpen(false)
                    router.push(`/shipment-management/shipments/${createdShipmentId}`)
                  }}
                >
                  View Shipment
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
})

export default CreateShipmentForm

