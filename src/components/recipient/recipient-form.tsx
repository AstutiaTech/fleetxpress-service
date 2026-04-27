"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Controller, useForm } from "react-hook-form"
import { CreateRecipientPayload, Recipient, UpdateRecipientPayload } from "@/types/recipientTypes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Address } from "@/types/addressTypes"
import { AddressForm } from "@/components/address/address-form"
import { AddressStore } from "@/stores/address-store"
import { Button } from "@/components/ui/button"
import { Country } from "@/types/geoTypes"
import { CreateAddressPayload } from "@/types/addressTypes"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { ShipmentStore } from "@/stores/shipment-store"
import { useState } from "react"

interface RecipientFormProps {
  recipient?: Recipient | null
  onSubmit: (data: CreateRecipientPayload | UpdateRecipientPayload) => Promise<{ status: boolean; data?: Recipient; error?: string }>
  onCancel?: () => void
  addressStore: AddressStore
  shipmentStore: ShipmentStore
  countries: Country[]
  countriesLoading: boolean
  availableAddresses?: Address[] // Optional: pre-loaded addresses to choose from
  showAddressForm?: boolean // Whether to show inline address creation
}

export const RecipientForm = ({
  recipient,
  onSubmit,
  onCancel,
  addressStore,
  shipmentStore,
  countries,
  countriesLoading,
  availableAddresses = [],
  showAddressForm = true,
}: RecipientFormProps) => {
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState<Address | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateRecipientPayload & { addressId?: string | null }>({
    defaultValues: {
      firstName: recipient?.firstName || "",
      lastName: recipient?.lastName || "",
      phoneNumber: recipient?.phoneNumber || "",
      email: recipient?.email || "",
      addressLine: recipient?.addressLine || "",
      addressId: recipient?.addressId || null,
    },
  })

  const selectedAddressId = watch("addressId")

  const handleAddressCreated = async (addressData: CreateAddressPayload | { id: string }) => {
    if ("id" in addressData) {
      // Address was created, get the ID
      const address = await addressStore.fetchAddressById(addressData.id)
      if (address.success && address.data) {
        setNewAddress(address.data)
        setValue("addressId", address.data.id)
        setShowNewAddressForm(false)
      }
    } else {
      // Create new address
      const result = await addressStore.createAddress(addressData)
      if (result.status && result.data) {
        setNewAddress(result.data)
        setValue("addressId", result.data.id)
        setShowNewAddressForm(false)
      }
    }
  }

  const onFormSubmit = async (data: CreateRecipientPayload & { addressId?: string | null }) => {
    const payload: CreateRecipientPayload | UpdateRecipientPayload = {
      ...data,
      addressId: data.addressId || null,
    }
    if (recipient) {
      (payload as UpdateRecipientPayload).id = recipient.id
    }
    const result = await onSubmit(payload)
    if (result?.status) {
      // Form will be reset by parent component
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    handleSubmit(onFormSubmit)(e)
  }

  const selectedAddress = availableAddresses.find((a) => a.id === selectedAddressId) || newAddress

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{recipient ? "Edit Recipient" : "Create Recipient"}</CardTitle>
          <CardDescription>
            {recipient ? "Update the recipient information" : "Enter the recipient details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                placeholder="John"
                {...register("firstName", { required: "First name is required." })}
              />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                placeholder="Doe"
                {...register("lastName", { required: "Last name is required." })}
              />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                placeholder="+2348012345678"
                {...register("phoneNumber", {
                  required: "Phone number is required.",
                  // pattern: {
                  //   value: /^\+?[1-9]\d{1,14}$/,
                  //   message: "Please enter a valid phone number.",
                  // },
                })}
              />
              {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Email (Optional)</Label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                {...register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address.",
                  },
                })}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Address Line
              <span className="text-muted-foreground text-xs font-normal ml-1">(Optional)</span>
            </Label>
            <textarea
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              placeholder="e.g., Apartment 4B, Building 2, Near XYZ Mall"
              {...register("addressLine", {
                maxLength: {
                  value: 500,
                  message: "Address line must be less than 500 characters.",
                },
              })}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              Add specific address details like apartment number, building name, landmarks, etc.
            </p>
            {errors.addressLine && <p className="text-sm text-destructive">{errors.addressLine.message}</p>}
          </div>

          {showAddressForm && (
            <div className="space-y-4 hidden">
              <div className="space-y-2">
                <Label>Address (Optional)</Label>
                {availableAddresses.length > 0 && (
                  <Controller
                    control={control}
                    name="addressId"
                    render={({ field }) => (
                      <>
                        <Select
                          value={field.value || undefined}
                          onValueChange={(value) => {
                            field.onChange(value || "")
                            setShowNewAddressForm(false)
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select existing address or create new (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAddresses.map((address) => (
                              <SelectItem key={address.id} value={address.id}>
                                {address.street}, {address.city?.name || "City"}, {address.state?.name || "State"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  />
                )}
                {showAddressForm && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                  >
                    {showNewAddressForm ? "Cancel New Address" : "Create New Address"}
                  </Button>
                )}
              </div>

              {showNewAddressForm && (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-lg">New Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AddressForm
                      onSubmit={handleAddressCreated}
                      shipmentStore={shipmentStore}
                      countries={countries}
                      countriesLoading={countriesLoading}
                    />
                  </CardContent>
                </Card>
              )}

              {selectedAddress && !showNewAddressForm && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Selected Address:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAddress.street}
                    {selectedAddress.addressLine && `, ${selectedAddress.addressLine}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAddress.city?.name}, {selectedAddress.state?.name}, {selectedAddress.country?.name}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {recipient ? "Update Recipient" : "Create Recipient"}
        </Button>
      </div>
    </form>
  )
}

