"use client"

import { Recipient } from "@/types/recipientTypes"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Loader2, Plus, Search, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecipientSelectorProps {
  value: string | null
  onChange: (recipientId: string | null) => void
  options: Recipient[]
  isLoading?: boolean
  onSearch?: (term: string) => void
  onCreateNew?: () => void
  placeholder?: string
}

export const RecipientSelector = ({
  value,
  onChange,
  options,
  isLoading = false,
  onSearch,
  onCreateNew,
  placeholder = "Select recipient",
}: RecipientSelectorProps) => {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.id === value)
  
  // Create a unique key based on options to force re-render when options change
  const optionsKey = useMemo(() => {
    return options.map(o => o.id).join(",")
  }, [options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", !selected && "text-muted-foreground")}
        >
          {selected ? (
            <div className="flex items-center gap-2 text-left">
              <User className="h-4 w-4 shrink-0" />
              <span>
                {selected.firstName} {selected.lastName}
              </span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search recipients..."
            onValueChange={onSearch}
          />
          <CommandList key={optionsKey}>
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!isLoading && options.length === 0 && <CommandEmpty>No recipients found.</CommandEmpty>}
            {!isLoading && options.length > 0 && (
              <CommandGroup key={optionsKey}>
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
                      <p className="text-sm font-medium">
                        {option.firstName} {option.lastName}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{option.phoneNumber}</p>
                    {option.email && <p className="text-xs text-muted-foreground">{option.email}</p>}
                    {option.address && (
                      <p className="text-xs text-muted-foreground">
                        {option.address.street}, {option.address.city?.name}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            )}
            {onCreateNew && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    onCreateNew()
                  }}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new recipient
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

