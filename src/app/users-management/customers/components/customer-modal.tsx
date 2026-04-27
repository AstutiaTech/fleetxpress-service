"use client"

import { ChevronDown, Loader2, Plus } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react"

import { AddressForm } from "@/components/address/address-form"
import { Button } from "@/components/ui/button"
import { Country } from "@/types/geoTypes"
import { CreateCustomerPayload } from "@/types/auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserStore } from "@/stores/user-store"
import { toastUtils } from "@/utils/toast-utils"
import { useForm } from "react-hook-form"
import { useStore } from "@/providers/store.provider"

interface CustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCustomerCreated: (customerId: string) => void
  userStore: UserStore
  onRefresh?: () => void
}

export const CustomerModal = ({
  open,
  onOpenChange,
  onCustomerCreated,
  userStore,
  onRefresh,
}: CustomerModalProps) => {
  const { shipmentStore, addressStore } = useStore()
  const [addressSectionOpen, setAddressSectionOpen] = useState(false)
  const [createdCustomerId, setCreatedCustomerId] = useState<string | undefined>(undefined)
  const [countries, setCountries] = useState<Country[]>([])
  const [countriesLoading, setCountriesLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{
    firstName: string
    lastName: string
    phone: string
    email: string
    isEmailVerified: boolean
  }>({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      isEmailVerified: false,
    },
  })

  // Load countries when component mounts
  useEffect(() => {
    const loadCountries = async () => {
      setCountriesLoading(true)
      try {
        const response = await shipmentStore.fetchCountries({ limit: 200 })
        setCountries(response || [])
      } catch (error) {
        console.error("Failed to load countries:", error)
      } finally {
        setCountriesLoading(false)
      }
    }
    if (open) {
      loadCountries()
    }
  }, [open, shipmentStore])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        isEmailVerified: false,
      })
      setAddressSectionOpen(false)
      setCreatedCustomerId(undefined)
    }
  }, [open, reset])

  const onSubmit = async (
    data: {
      firstName: string
      lastName: string
      phone: string
      email: string
      isEmailVerified: boolean
    },
    event?: React.BaseSyntheticEvent
  ) => {
    // Prevent any event propagation
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    const payload: CreateCustomerPayload = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      isEmailVerified: data.isEmailVerified,
      status: 1,
    }

    try {
      // First, create the customer
      const result = await userStore.createCustomer(payload)

      if (!result.status || !result.data) {
        toastUtils.error("Failed to Create Customer", result.error || "An error occurred while creating the customer.")
        return
      }

      // Get the customer ID from the response
      const customerId = result.data.id

      // Set the customer ID - AddressForm will auto-create address if fields are filled
      setCreatedCustomerId(customerId)

      // Wait a moment for address creation to complete (if address fields are filled)
      // The AddressForm will handle the address creation automatically
      await new Promise((resolve) => setTimeout(resolve, 500))

      toastUtils.success("Customer Created", "The customer has been created successfully.")

      onCustomerCreated(customerId)
      onOpenChange(false)
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error("Error creating customer:", error)
      toastUtils.error("Failed to Create Customer", "An unexpected error occurred while creating the customer.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
          <DialogDescription>Fill in the details to create a new customer.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input {...register("firstName", { required: "First name is required" })} />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input {...register("lastName", { required: "Last name is required" })} />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" {...register("email", { required: "Email is required" })} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Phone *</Label>
            <Input {...register("phone", { required: "Phone is required" })} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <Collapsible open={addressSectionOpen} onOpenChange={setAddressSectionOpen} className="space-y-2">
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Address (Optional)
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${addressSectionOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <AddressForm
                onSubmit={async () => {
                  // This will be called after address is auto-created
                  return { success: true }
                }}
                onCancel={() => {
                  setAddressSectionOpen(false)
                }}
                shipmentStore={shipmentStore}
                countries={countries}
                countriesLoading={countriesLoading}
                showDefaultCheckbox={true}
                customerId={createdCustomerId}
                hideButtons={true}
                addressStore={addressStore}
              />
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

