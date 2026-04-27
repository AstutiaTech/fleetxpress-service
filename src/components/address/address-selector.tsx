"use client"

import { Check, Loader2, MapPin, Plus, Search } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { Address } from "@/types/addressTypes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface AddressSelectorProps {
  value: string | null
  onChange: (addressId: string | null) => void
  options: Address[]
  isLoading?: boolean
  onSearch?: (term: string) => void
  onCreateNew?: () => void
  placeholder?: string
}

export const AddressSelector = ({
  value,
  onChange,
  options,
  isLoading = false,
  onSearch,
  onCreateNew,
  placeholder = "Select address",
}: AddressSelectorProps) => {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.id === value)

  const formatAddress = (address: Address) => {
    const parts = [
      address.street,
      address.addressLine,
      address.city?.name,
      address.state?.name,
      address.country?.name,
    ].filter(Boolean)
    return parts.join(", ")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", !selected && "text-muted-foreground")}
        >
          {selected ? (
            <div className="flex items-center gap-2 text-left min-w-0 w-full">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate block min-w-0 flex-1 max-w-xl" title={formatAddress(selected)}>
                {formatAddress(selected)}
              </span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search addresses..."
            onValueChange={onSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!isLoading && options.length === 0 && <CommandEmpty>No addresses found.</CommandEmpty>}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                  className="flex items-start gap-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{option.street}</p>
                      {option.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                      <Badge variant="secondary" className="text-xs">
                        {option.addressType}
                      </Badge>
                    </div>
                    {option.addressLine && (
                      <p className="text-xs text-muted-foreground">{option.addressLine}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {option.city?.name}, {option.state?.name}, {option.country?.name}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    // Use setTimeout to ensure this doesn't interfere with form submission
                    setTimeout(() => {
                      if (onCreateNew) {
                        onCreateNew()
                      }
                    }, 0)
                  }}
                  className="text-primary"
                  value="__create_new__"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new address
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

