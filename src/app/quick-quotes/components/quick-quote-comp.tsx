"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Info, Loader2, Plus, Trash2 } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ParcelRequest, QuickQuoteRequest, QuickQuoteResponse } from "@/types/quickQuoteTypes"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getErrorMessage, toastUtils } from "@/utils/toast-utils"
import { useEffect, useMemo, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Country } from "@/types/geoTypes"
import { DashboardHeader } from "@/components/dashboard-header"
import { GooglePlacesInput } from "@/components/google-places-input"
import { Input } from "@/components/ui/input"
import { InsideCity } from "@/types/insideCityTypes"
import { Label } from "@/components/ui/label"
import { OutsideCity } from "@/types/outsideCityTypes"
import { Packaging } from "@/types/packagingType"
import { PageTransition } from "@/providers/page-transition"
import { QuoteResult } from "./quote-result"
import { Switch } from "@/components/ui/switch"
import { WareHouse } from "@/types/warehousesType"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/handlers/formatters"

// Type for API error responses that may include a response string field
interface ApiErrorResponse {
  response?: string
  message?: string
  status?: boolean
}


interface ParcelForm {
  packagingId: number | null
  length: string
  weight: string | null // Optional if dimensions are provided
  height: string
  width: string
  quantity: string
  extraCost: string
  declaredValue: string // Will be converted to number (monetary amount)
  isRushHour: boolean
  isLiquidFragile: boolean
}

export function QuickQuoteComp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quoteResult, setQuoteResult] = useState<QuickQuoteResponse | null>(null)

  // Form state
  const [pickupPointId, setPickupPointId] = useState<string>("")
  const [deliveryAddress, setDeliveryAddress] = useState<string>("")
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null)
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null)
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null)
  const [chargeCategory, setChargeCategory] = useState<"inside" | "outside">("inside")
  const [insideCityCharge, setInsideCityCharge] = useState<number | null>(null)
  const [outsideCityCharge, setOutsideCityCharge] = useState<number | null>(null)
  
  // Geo data
  const [countries, setCountries] = useState<Country[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)

  const [parcels, setParcels] = useState<ParcelForm[]>([
    {
      packagingId: null,
      length: "",
      weight: null,
      height: "",
      width: "",
      quantity: "1",
      extraCost: "0",
      declaredValue: "",
      isRushHour: false,
      isLiquidFragile: false,
    },
  ])

  const [dimensionsOpen, setDimensionsOpen] = useState<Record<number, boolean>>({})

  // Data for dropdowns
  const [warehouses, setWarehouses] = useState<WareHouse[]>([])
  const [senderCities, setSenderCities] = useState<City[]>([])
  const [packagings, setPackagings] = useState<Packaging[]>([])
  const [insideCityCharges, setInsideCityCharges] = useState<InsideCity[]>([])
  const [outsideCityCharges, setOutsideCityCharges] = useState<OutsideCity[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingInsideCharges, setLoadingInsideCharges] = useState(false)
  const [loadingOutsideCharges, setLoadingOutsideCharges] = useState(false)
  
  const selectedInsideCharge = useMemo(
    () => insideCityCharges.find((charge) => charge.id === insideCityCharge) || null,
    [insideCityCharges, insideCityCharge]
  )
  const selectedOutsideCharge = useMemo(
    () => outsideCityCharges.find((charge) => charge.id === outsideCityCharge) || null,
    [outsideCityCharges, outsideCityCharge]
  )

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoadingData(true)
    setLoadingInsideCharges(true)
    setLoadingOutsideCharges(true)
    setLoadingCountries(true)
    try {
      const [warehousesRes, packagingsRes, insideCityRes, outsideCityRes, countriesRes] = await Promise.all([
        ApiService.getAllWarehouses(),
        ApiService.getAllPackages(),
        ApiService.getAllInsideCity(),
        ApiService.getAllOutsideCity(),
        ApiService.getCountries({ limit: 200 }),
      ])

      if (warehousesRes.status && warehousesRes.data) {
        setWarehouses(warehousesRes.data)
      } else {
        const errorResponse = warehousesRes as unknown as ApiErrorResponse
        const errorMsg = errorResponse?.response || warehousesRes.message || "Failed to load warehouses"
        toastUtils.error("Error", errorMsg)
      }
      
      if (packagingsRes.status && packagingsRes.data) {
        setPackagings(packagingsRes.data)
      } else {
        const errorResponse = packagingsRes as unknown as ApiErrorResponse
        const errorMsg = errorResponse?.response || packagingsRes.message || "Failed to load packaging options"
        toastUtils.error("Error", errorMsg)
      }
      
      if (insideCityRes.status && insideCityRes.data) {
        setInsideCityCharges(insideCityRes.data)
      } else {
        const errorResponse = insideCityRes as unknown as ApiErrorResponse
        const errorMsg = errorResponse?.response || insideCityRes.message || "Failed to load inside city charges"
        toastUtils.error("Error", errorMsg)
      }
      
      if (outsideCityRes.status && outsideCityRes.data) {
        setOutsideCityCharges(outsideCityRes.data)
      } else {
        const errorResponse = outsideCityRes as unknown as ApiErrorResponse
        const errorMsg = errorResponse?.response || outsideCityRes.message || "Failed to load outside city charges"
        toastUtils.error("Error", errorMsg)
      }
      
      if (countriesRes.status && countriesRes.data) {
        setCountries(countriesRes.data)
      } else {
        const errorResponse = countriesRes as unknown as ApiErrorResponse
        const errorMsg = errorResponse?.response || countriesRes.message || "Failed to load countries"
        toastUtils.error("Error", errorMsg)
      }
    } catch (error) {
      console.error("Failed to load initial data:", error)
      const errorMessage = getErrorMessage(error, "Failed to load form data")
      toastUtils.error("Error", errorMessage)
    } finally {
      setLoadingData(false)
      setLoadingInsideCharges(false)
      setLoadingOutsideCharges(false)
      setLoadingCountries(false)
    }
  }


  // Auto-set charge category based on selection
  useEffect(() => {
    if (insideCityCharge && chargeCategory !== "inside") {
      setChargeCategory("inside")
    } else if (!insideCityCharge && outsideCityCharge && chargeCategory !== "outside") {
      setChargeCategory("outside")
    }
  }, [insideCityCharge, outsideCityCharge, chargeCategory])

  const handleAddParcel = () => {
    setParcels([
      ...parcels,
      {
        packagingId: null,
        length: "",
        weight: null,
        height: "",
        width: "",
        quantity: "1",
        extraCost: "0",
        declaredValue: "",
        isRushHour: false,
        isLiquidFragile: false,
      },
    ])
  }

  const handleRemoveParcel = (index: number) => {
    setParcels(parcels.filter((_, i) => i !== index))
  }

  const handleParcelChange = (index: number, field: keyof ParcelForm, value: string | number | boolean | null) => {
    const updatedParcels = [...parcels]
    updatedParcels[index] = {
      ...updatedParcels[index],
      [field]: value,
    }
    setParcels(updatedParcels)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setQuoteResult(null)
    setLoading(true)

    try {
      // Validate form
      if (parcels.length === 0) {
        throw new Error("At least one parcel is required")
      }

      if (!pickupPointId) {
        throw new Error("Pickup point (warehouse) is required")
      }

      if (deliveryLat === null || deliveryLng === null) {
        throw new Error("Delivery address with coordinates is required")
      }

      if (!insideCityCharge && !outsideCityCharge) {
        throw new Error("Please select a shipping charge option")
      }

      // Validate parcels - either weight OR all dimensions must be provided
      for (const parcel of parcels) {
        const hasDimensions = parcel.length && parcel.width && parcel.height
        const hasWeight = parcel.weight && parcel.weight !== ""
        if (!hasDimensions && !hasWeight) {
          throw new Error("Parcel must have either weight or all dimensions (length, width, height)")
        }
      }

      // Build request
      const request: QuickQuoteRequest = {
        isDoorPickup: false,
        pickupPointId: pickupPointId || undefined,
        deliveryLat: deliveryLat !== null ? deliveryLat : undefined,
        deliveryLng: deliveryLng !== null ? deliveryLng : undefined,
        insideCityCharge: chargeCategory === "inside" ? insideCityCharge || undefined : undefined,
        outsideCityCharge: chargeCategory === "outside" ? outsideCityCharge || undefined : undefined,
        parcels: parcels.map((p) => {
          const hasDimensions = p.length && p.width && p.height
          const weight = p.weight ? Number(p.weight) : null
          
          const parcel: ParcelRequest = {
            packagingId: p.packagingId!,
            weight: hasDimensions ? weight : (weight || undefined), // Optional if dimensions exist
            quantity: Number(p.quantity) || 1,
            extraCost: Number(p.extraCost) || 0,
            declaredValue: p.declaredValue ? Number(p.declaredValue) : undefined, // Convert to number
            isRushHour: p.isRushHour,
            isLiquidFragile: p.isLiquidFragile,
          }

          if (hasDimensions) {
            parcel.length = Number(p.length)
            parcel.width = Number(p.width)
            parcel.height = Number(p.height)
          }

          return parcel
        }),
      }

      const response = await ApiService.getQuickQuote(request)
      if (response.status && response.data) {
        setQuoteResult(response.data)
        toastUtils.success("Success", "Quote calculated successfully")
      } else {
        // Check for response string first, then message, then default
        const errorResponse = response as unknown as ApiErrorResponse
        const errorMsg = errorResponse?.response?.message || errorResponse?.response || response.message || "Failed to get quote"
        throw new Error(errorMsg)
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err, "Failed to get quote")
      setError(errorMessage)
      toastUtils.error("Error", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceResolved = (payload: { address: string; lat: number; lng: number }) => {
    setDeliveryAddress(payload.address)
    setDeliveryLat(payload.lat)
    setDeliveryLng(payload.lng)
  }

  const handleCoordinatesCleared = () => {
    setDeliveryLat(null)
    setDeliveryLng(null)
  }

  const handleReset = () => {
    setQuoteResult(null)
    setError(null)
    setPickupPointId("")
    setDeliveryAddress("")
    setDeliveryLat(null)
    setDeliveryLng(null)
    setSelectedCountryId(null)
    setChargeCategory("inside")
    setInsideCityCharge(null)
    setOutsideCityCharge(null)
    setParcels([
      {
        packagingId: null,
        length: "",
        weight: null,
        height: "",
        width: "",
        quantity: "1",
        extraCost: "0",
        declaredValue: "",
        isRushHour: false,
        isLiquidFragile: false,
      },
    ])
  }

  if (loadingData) {
    return (
      <PageTransition>
        <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
        <DashboardHeader title="Get Quick Quote" />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quote Request</CardTitle>
              <CardDescription>Fill in the details to get a shipping quote</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Pickup Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pickup Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="pickupPoint">Pickup Point (Warehouse) *</Label>
                    <Select value={pickupPointId} onValueChange={setPickupPointId} required>
                        <SelectTrigger id="pickupPoint">
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name} - {wh.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                </div>

                {/* Delivery Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Delivery Information</h3>
                  <div className="space-y-2">
                    <Label>Delivery Address *</Label>
                    <GooglePlacesInput
                      value={deliveryAddress}
                      onValueChange={setDeliveryAddress}
                      onPlaceResolved={handlePlaceResolved}
                      onCoordinatesCleared={handleCoordinatesCleared}
                      placeholder="Search delivery address"
                    />
                    {deliveryLat !== null && deliveryLng !== null && (
                      <p className="text-xs text-muted-foreground">
                        Coordinates: {deliveryLat.toFixed(6)}, {deliveryLng.toFixed(6)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destinationCountry">Destination Country</Label>
                        <Select
                          value={selectedCountryId?.toString() || ""}
                      onValueChange={(value) => setSelectedCountryId(value ? Number(value) : null)}
                          disabled={loadingCountries}
                        >
                          <SelectTrigger id="destinationCountry">
                            <SelectValue placeholder={loadingCountries ? "Loading..." : "Select country"} />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.id} value={country.id.toString()}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                  </div>
                </div>

                {/* Shipping Charges */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Shipping Options</h3>
                  <div className="space-y-2">
                    <Label>Charge Type *</Label>
                    <RadioGroup
                      value={chargeCategory}
                      onValueChange={(value: "inside" | "outside") => {
                        setChargeCategory(value)
                        if (value === "inside") {
                          setOutsideCityCharge(null)
                        } else {
                          setInsideCityCharge(null)
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
                      <div className="space-y-2">
                        <Label htmlFor="insideCityCharge">Inside City Charge *</Label>
                        <Select
                          value={insideCityCharge?.toString() || ""}
                          onValueChange={(value) => {
                            setChargeCategory("inside")
                            setOutsideCityCharge(null)
                            setInsideCityCharge(Number(value))
                          }}
                          disabled={loadingInsideCharges || chargeCategory !== "inside"}
                        >
                          <SelectTrigger id="insideCityCharge">
                            <SelectValue
                              placeholder={loadingInsideCharges ? "Loading packages..." : "Select inside city package"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {insideCityCharges.map((charge) => (
                              <SelectItem key={charge.id} value={charge.id.toString()}>
                                {charge.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedInsideCharge && (
                        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                          <p className="text-muted-foreground">
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
                      <div className="space-y-2">
                        <Label htmlFor="outsideCityCharge">Outside City Charge *</Label>
                        <Select
                          value={outsideCityCharge?.toString() || ""}
                          onValueChange={(value) => {
                            setChargeCategory("outside")
                            setInsideCityCharge(null)
                            setOutsideCityCharge(Number(value))
                          }}
                          disabled={loadingOutsideCharges || chargeCategory !== "outside"}
                        >
                          <SelectTrigger id="outsideCityCharge">
                            <SelectValue
                              placeholder={loadingOutsideCharges ? "Loading packages..." : "Select outside city package"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {outsideCityCharges.map((charge) => (
                              <SelectItem key={charge.id} value={charge.id.toString()}>
                                {charge.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedOutsideCharge && (
                        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                          <p className="text-muted-foreground">
                            Pricing will be calculated based on weight using the weight-based pricing system.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parcels */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Parcels</h3>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddParcel}>
                      <Plus className="mr-2 h-4 w-4" /> Add Parcel
                    </Button>
                  </div>
                  {parcels.map((parcel, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Parcel {index + 1}</h4>
                        {parcels.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveParcel(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Packaging Type</Label>
                            <Select
                              value={parcel.packagingId?.toString() || "none"}
                              onValueChange={(value) => handleParcelChange(index, "packagingId", value === "none" ? null : Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select packaging (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None (No Packaging)</SelectItem>
                                {packagings.map((pkg) => (
                                  <SelectItem key={pkg.id} value={pkg.id.toString()}>
                                    {pkg.name} ({formatPrice(pkg.price)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={parcel.quantity}
                              onChange={(e) => handleParcelChange(index, "quantity", e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>
                            Weight (kg){" "}
                            {parcel.length && parcel.width && parcel.height ? "" : "*"}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={parcel.weight || ""}
                            onChange={(e) => handleParcelChange(index, "weight", e.target.value || null)}
                          />
                          {parcel.length && parcel.width && parcel.height && (
                            <p className="text-xs text-muted-foreground">
                              Optional when dimensions are provided
                            </p>
                          )}
                        </div>
                        <Collapsible 
                          open={dimensionsOpen[index] || false} 
                          onOpenChange={(open) => setDimensionsOpen(prev => ({ ...prev, [index]: open }))}
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
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={parcel.length}
                                  onChange={(e) => handleParcelChange(index, "length", e.target.value)}
                                  placeholder="Optional"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Width (cm)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={parcel.width}
                                  onChange={(e) => handleParcelChange(index, "width", e.target.value)}
                                  placeholder="Optional"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Height (cm)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={parcel.height}
                                  onChange={(e) => handleParcelChange(index, "height", e.target.value)}
                                  placeholder="Optional"
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Extra Cost (₦)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={parcel.extraCost}
                              onChange={(e) => handleParcelChange(index, "extraCost", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Declared Value (₦) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={parcel.declaredValue}
                              onChange={(e) => handleParcelChange(index, "declaredValue", e.target.value)}
                              placeholder="Enter value of goods"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Monetary value of goods being shipped
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`rushHour-${index}`}
                              checked={parcel.isRushHour}
                              onCheckedChange={(checked) => handleParcelChange(index, "isRushHour", checked)}
                            />
                            <Label htmlFor={`rushHour-${index}`}>Rush Hour</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`liquidFragile-${index}`}
                              checked={parcel.isLiquidFragile}
                              onCheckedChange={(checked) => handleParcelChange(index, "isLiquidFragile", checked)}
                            />
                            <Label htmlFor={`liquidFragile-${index}`}>Liquid/Fragile</Label>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>


                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? "Calculating..." : "Get Quote"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Reset Form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Quote Result */}
          {quoteResult && (
            <div className="md:col-span-1">
              <QuoteResult result={quoteResult} />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

