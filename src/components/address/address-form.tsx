"use client"

import { Address, AddressType, CreateAddressPayload, UpdateAddressPayload } from "@/types/addressTypes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { City, Country, LGA, State } from "@/types/geoTypes"
import { Controller, useForm } from "react-hook-form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

import { AddressStore } from "@/stores/address-store"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { GooglePlacesInput } from "@/components/google-places-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { ShipmentStore } from "@/stores/shipment-store"
import { Textarea } from "@/components/ui/textarea"
import { toastUtils } from "@/utils/toast-utils"

interface AddressFormProps {
  address?: Address | null
  onSubmit: (data: CreateAddressPayload | UpdateAddressPayload) => Promise<{ success: boolean }>
  onCancel?: () => void
  shipmentStore: ShipmentStore
  countries: Country[]
  countriesLoading: boolean
  userId?: string // Optional: for user addresses
  showDefaultCheckbox?: boolean
  defaultAddressId?: string | null
  customerId?: string // Optional: if provided, auto-create address when fields are filled
  hideButtons?: boolean // Optional: hide submit/cancel buttons
  addressStore?: AddressStore // Optional: required if customerId is provided for auto-creation
}

export const AddressForm = ({
  address,
  onSubmit,
  onCancel,
  shipmentStore,
  countries,
  countriesLoading,
  userId,
  showDefaultCheckbox = false,
  defaultAddressId,
  customerId,
  hideButtons = false,
  addressStore,
}: AddressFormProps) => {
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [lgas, setLgas] = useState<LGA[]>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingLgas, setLoadingLgas] = useState(false)

  type AddressFormData = Omit<CreateAddressPayload, "cityId" | "stateId" | "lgaId" | "countryId"> & {
    cityId: number | null
    stateId: number | null
    lgaId: number | null
    countryId: number | null
    isDefault?: boolean
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    defaultValues: {
      street: address?.street || "",
      addressLine: address?.addressLine || "",
      // cityId: address?.cityId || null,
      // stateId: address?.stateId || null,
      // lgaId: address?.lgaId || null,
      countryId: address?.countryId || null,
      latitude: address?.latitude || null,
      longitude: address?.longitude || null,
      postalCode: address?.postalCode || "",
      addressType: address?.addressType || "HOME",
      isDefault: address?.isDefault || defaultAddressId === address?.id || false,
      userId: userId,
    },
  })

  const countryId = watch("countryId")
  const stateId = watch("stateId")
  const street = watch("street")
  const [hasAutoCreated, setHasAutoCreated] = useState(false)

  // Load states when country changes
  useEffect(() => {
    if (!countryId) {
      setStates([])
      setCities([])
      setLgas([])
      setValue("stateId", null)
      setValue("cityId", null)
      setValue("lgaId", null)
      return
    }
    const fetchStates = async () => {
      setLoadingStates(true)
      try {
        const response = await shipmentStore.fetchStates(countryId, { limit: 200 })
        setStates(response || [])
        // If editing and stateId exists, keep it
        if (address?.stateId && address.countryId === countryId) {
          setValue("stateId", address.stateId)
        }
      } catch (error) {
        console.error(error)
        toastUtils.error("Failed to Load States", "Unable to fetch states.")
      } finally {
        setLoadingStates(false)
      }
    }
    fetchStates()
  }, [countryId, shipmentStore, setValue, address])

  // Load cities and LGAs when state changes
  useEffect(() => {
    if (!stateId) {
      setCities([])
      setLgas([])
      setValue("cityId", null)
      setValue("lgaId", null)
      return
    }
    const fetchCitiesAndLgas = async () => {
      setLoadingCities(true)
      setLoadingLgas(true)
      try {
        const [citiesRes, lgasRes] = await Promise.all([
          shipmentStore.fetchCities(stateId, { limit: 200 }),
          shipmentStore.fetchLgas(stateId, { limit: 200 }),
        ])
        setCities(citiesRes || [])
        setLgas(lgasRes || [])
        // If editing and cityId/lgaId exist, keep them
        if (address?.cityId && address.stateId === stateId) {
          setValue("cityId", address.cityId)
        }
        if (address?.lgaId && address.stateId === stateId) {
          setValue("lgaId", address.lgaId)
        }
      } catch (error) {
        console.error(error)
        toastUtils.error("Failed to Load Locations", "Unable to fetch cities/LGAs.")
      } finally {
        setLoadingCities(false)
        setLoadingLgas(false)
      }
    }
    fetchCitiesAndLgas()
  }, [stateId, shipmentStore, setValue, address])

  // Auto-create address when customerId is provided and required fields are filled
  useEffect(() => {
    const autoCreateAddress = async () => {
      // Only auto-create if:
      // 1. customerId is provided
      // 2. addressStore is provided
      // 3. We haven't already auto-created
      // 4. This is a new address (not editing existing)
      // 5. Required fields are filled (street and countryId)
      if (
        customerId &&
        addressStore &&
        !hasAutoCreated &&
        !address &&
        street &&
        countryId &&
        street.trim() !== "" &&
        countryId
      ) {
        setHasAutoCreated(true)
        try {
          const formData = watch()
          const payload: CreateAddressPayload = {
            street: formData.street?.trim() || "",
            addressLine: formData.addressLine || null,
            cityId: formData.cityId || undefined,
            stateId: formData.stateId || undefined,
            lgaId: formData.lgaId || undefined,
            countryId: formData.countryId as number,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
            postalCode: formData.postalCode || null,
            addressType: formData.addressType || "HOME",
            isDefault: showDefaultCheckbox ? (formData.isDefault || false) : undefined,
            userId: customerId,
          }

          const result = await addressStore.createAddress(payload)
          if (result.status) {
            // Address created successfully, call onSubmit callback if provided
            await onSubmit(payload)
          }
        } catch (error) {
          console.error("Error auto-creating address:", error)
          setHasAutoCreated(false) // Reset to allow retry
        }
      }
    }

    autoCreateAddress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, street, countryId])

  const onFormSubmit = async (data: AddressFormData) => {
    const { isDefault, ...addressData } = data
    const basePayload: CreateAddressPayload = {
      ...addressData,
      isDefault: showDefaultCheckbox ? isDefault : undefined,
      // State, city, and LGA are now optional - only include if provided
      cityId: data.cityId ? (data.cityId as number) : undefined,
      stateId: data.stateId ? (data.stateId as number) : undefined,
      lgaId: data.lgaId ? (data.lgaId as number) : undefined,
      countryId: data.countryId as number,
    }
    
    const payload: CreateAddressPayload | UpdateAddressPayload = address
      ? { ...basePayload, id: address.id }
      : basePayload
    
    const result = await onSubmit(payload)
    if (result.success) {
      // Form will be reset by parent component
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    handleSubmit(onFormSubmit)(e)
  }

  // When embedded (hideButtons or customerId provided), don't render form wrapper
  const isEmbedded = hideButtons || !!customerId

  const formContent = (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{address ? "Edit Address" : "Create Address"}</CardTitle>
          <CardDescription>
            {address ? "Update the address information" : "Enter the address details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Street Address *</Label>
            <Controller
              control={control}
              name="street"
              rules={{ required: "Street address is required." }}
              render={({ field }) => (
                <GooglePlacesInput
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  onPlaceResolved={async (payload) => {
                    field.onChange(payload.address)
                    // Set latitude and longitude
                    if (payload.lat && payload.lng) {
                      setValue("latitude", payload.lat)
                      setValue("longitude", payload.lng)
                    }
                    
                    // Extract and match location components
                    if (payload.components) {
                      const { country, state, city, lga, postalCode } = payload.components
                      
                      // Helper function to find best match
                      const findBestMatch = <T extends { id: number; name: string }>(searchTerm: string, items: T[]): T | null => {
                        if (!searchTerm || !items.length) return null
                        const lowerSearch = searchTerm.toLowerCase()
                        return items.find(
                          item => item.name.toLowerCase() === lowerSearch ||
                          item.name.toLowerCase().includes(lowerSearch) ||
                          lowerSearch.includes(item.name.toLowerCase())
                        ) || null
                      }
                      
                      // Match country
                      if (country) {
                        const matchedCountry = findBestMatch(country, countries)
                        if (matchedCountry) {
                          setValue("countryId", matchedCountry.id)
                          
                          // Load states and match
                          setLoadingStates(true)
                          try {
                            const statesResponse = await shipmentStore.fetchStates(matchedCountry.id, { limit: 200 })
                            const loadedStates = statesResponse || []
                            setStates(loadedStates)
                            
                            if (state) {
                              const matchedState = findBestMatch(state, loadedStates)
                              if (matchedState) {
                                setValue("stateId", matchedState.id)
                                
                                // Load cities and LGAs in parallel
                                setLoadingCities(true)
                                setLoadingLgas(true)
                                try {
                                  const [citiesRes, lgasRes] = await Promise.all([
                                    shipmentStore.fetchCities(matchedState.id, { limit: 200 }),
                                    shipmentStore.fetchLgas(matchedState.id, { limit: 200 }),
                                  ])
                                  const loadedCities = citiesRes || []
                                  const loadedLgas = lgasRes || []
                                  setCities(loadedCities)
                                  setLgas(loadedLgas)
                                  
                                  // Match city
                                  if (city) {
                                    const matchedCity = findBestMatch(city, loadedCities)
                                    if (matchedCity) {
                                      setValue("cityId", matchedCity.id)
                                    }
                                  }
                                  
                                  // Match LGA
                                  if (lga) {
                                    const matchedLga = findBestMatch(lga, loadedLgas)
                                    if (matchedLga) {
                                      setValue("lgaId", matchedLga.id)
                                    }
                                  }
                                } catch (error) {
                                  console.error(error)
                                  toastUtils.error("Failed to Load Locations", "Unable to fetch cities/LGAs.")
                                } finally {
                                  setLoadingCities(false)
                                  setLoadingLgas(false)
                                }
                              }
                            }
                          } catch (error) {
                            console.error(error)
                            toastUtils.error("Failed to Load States", "Unable to fetch states.")
                          } finally {
                            setLoadingStates(false)
                          }
                        }
                      }
                      
                      // Set postal code if available
                      if (postalCode) {
                        setValue("postalCode", postalCode)
                      }
                    }
                  }}
                  onCoordinatesCleared={() => {
                    setValue("latitude", null)
                    setValue("longitude", null)
                  }}
                  placeholder="Search for address"
                  error={errors.street?.message}
                />
              )}
            />
            {errors.street && <p className="text-sm text-destructive">{errors.street.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>
              Address Line <span className="text-muted-foreground">(Optional but recommended)</span>
            </Label>
            <Textarea
              rows={3}
              placeholder="Apartment 4B, Building 2, Near XYZ Mall"
              {...register("addressLine")}
            />
            <p className="text-xs text-muted-foreground">
              Specific location details like apartment number, building name, landmarks, etc. This helps ensure
              accurate delivery.
            </p>
            {errors.addressLine && <p className="text-sm text-destructive">{errors.addressLine.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Country *</Label>
              <Controller
                control={control}
                name="countryId"
                rules={{ required: "Country is required." }}
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
                    {errors.countryId && <p className="text-sm text-destructive">{errors.countryId.message}</p>}
                  </>
                )}
              />
            </div>

            {/* <div className="space-y-2">
              <Label>State *</Label>
              <Controller
                control={control}
                name="stateId"
                rules={{ required: "State is required." }}
                render={({ field }) => (
                  <>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={!countryId || loadingStates}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingStates ? "Loading states..." : "Select state"} />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={String(state.id)}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.stateId && <p className="text-sm text-destructive">{errors.stateId.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>City *</Label>
              <Controller
                control={control}
                name="cityId"
                rules={{ required: "City is required." }}
                render={({ field }) => (
                  <>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={!stateId || loadingCities}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingCities ? "Loading cities..." : "Select city"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={String(city.id)}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.cityId && <p className="text-sm text-destructive">{errors.cityId.message}</p>}
                  </>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>LGA *</Label>
              <Controller
                control={control}
                name="lgaId"
                rules={{ required: "LGA is required." }}
                render={({ field }) => (
                  <>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={!stateId || loadingLgas}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingLgas ? "Loading LGAs..." : "Select LGA"} />
                      </SelectTrigger>
                      <SelectContent>
                        {lgas.map((lga) => (
                          <SelectItem key={lga.id} value={String(lga.id)}>
                            {lga.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.lgaId && <p className="text-sm text-destructive">{errors.lgaId.message}</p>}
                  </>
                )}
              />
            </div> */}
          </div>

          <div className="space-y-2">
            <Label>Postal Code (Optional)</Label>
            <Input placeholder="100001" {...register("postalCode")} />
            {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode.message}</p>}
          </div>
          
          {/* {(watch("latitude") || watch("longitude")) && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium mb-2">Coordinates (Auto-filled)</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Latitude:</span>{" "}
                  {watch("latitude")?.toFixed(6) || "Not set"}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Longitude:</span>{" "}
                  {watch("longitude")?.toFixed(6) || "Not set"}
                </div>
              </div>
            </div>
          )} */}

          <div className="space-y-2">
            <Label>Address Type *</Label>
            <Controller
              control={control}
              name="addressType"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => field.onChange(value as AddressType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="HOME" id="type-home" />
                    <Label htmlFor="type-home" className="cursor-pointer">
                      Home
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="WORK" id="type-work" />
                    <Label htmlFor="type-work" className="cursor-pointer">
                      Work
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="OTHER" id="type-other" />
                    <Label htmlFor="type-other" className="cursor-pointer">
                      Other
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          {showDefaultCheckbox && (
            <div className="flex items-center space-x-2">
              <Controller
                control={control}
                name="isDefault"
                render={({ field }) => (
                  <Checkbox
                    id="isDefault"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default address
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {(!hideButtons && !customerId) && (
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {address ? "Update Address" : "Create Address"}
          </Button>
        </div>
      )}
    </>
  )

  // Render as div when embedded, form when standalone
  if (isEmbedded) {
    return <div className="space-y-6">{formContent}</div>
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {formContent}
    </form>
  )
}

