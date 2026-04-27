"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Loader2, MapPin } from "lucide-react"
import { toastUtils } from "@/utils/toast-utils"

type GoogleAddressComponent = {
  long_name: string
  short_name: string
  types: string[]
}

type GooglePlaceDetails = {
  formatted_address?: string
  name?: string
  geometry?: {
    location: {
      lat: () => number
      lng: () => number
    }
  }
  address_components?: GoogleAddressComponent[]
}

type GooglePlacesSuggestion = {
  description: string
  place_id: string
}

type GoogleAutocompleteService = {
  getPlacePredictions: (
    request: { input: string },
    callback: (predictions?: GooglePlacesSuggestion[], status?: string) => void
  ) => void
}

type GooglePlacesNamespace = {
  AutocompleteService: new () => GoogleAutocompleteService
  PlacesService: new (node: HTMLElement) => {
    getDetails: (
      request: { placeId: string; fields: Array<"formatted_address" | "geometry" | "name" | "address_components"> },
      callback: (result: GooglePlaceDetails | null, status: string) => void
    ) => void
  }
}

type GoogleMapsNamespace = {
  places?: GooglePlacesNamespace
}

type GoogleGlobal = {
  maps?: GoogleMapsNamespace
}

type GoogleWindow = Window & { google?: GoogleGlobal }

interface AddressComponents {
  country?: string
  state?: string
  city?: string
  lga?: string
  postalCode?: string
}

interface GooglePlacesInputProps {
  value: string
  onValueChange: (value: string) => void
  onPlaceResolved: (payload: { address: string; lat: number; lng: number; components?: AddressComponents }) => void
  onCoordinatesCleared: () => void
  error?: string
  placeholder?: string
}

export const GooglePlacesInput = ({
  value,
  onValueChange,
  onPlaceResolved,
  onCoordinatesCleared,
  error,
  placeholder = "Search delivery address",
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
      { placeId: prediction.place_id, fields: ["formatted_address", "geometry", "name", "address_components"] },
      (result: GooglePlaceDetails | null, status: string) => {
        if (status === "OK" && result?.geometry?.location) {
          const lat = result.geometry.location.lat()
          const lng = result.geometry.location.lng()
          const formatted = result.formatted_address || result.name || prediction.description
          
          // Extract address components
          const components: AddressComponents = {}
          if (result.address_components) {
            result.address_components.forEach((component) => {
              if (component.types.includes("country")) {
                components.country = component.long_name
              } else if (component.types.includes("administrative_area_level_1")) {
                components.state = component.long_name
              } else if (component.types.includes("locality") || component.types.includes("administrative_area_level_2")) {
                components.city = component.long_name
              } else if (component.types.includes("sublocality") || component.types.includes("sublocality_level_1")) {
                components.lga = component.long_name
              } else if (component.types.includes("postal_code")) {
                components.postalCode = component.long_name
              }
            })
          }
          
          onPlaceResolved({ address: formatted, lat, lng, components })
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
          placeholder={placeholder}
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

