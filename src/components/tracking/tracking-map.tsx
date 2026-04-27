"use client"

import { useEffect, useRef, useState } from "react"

import { TrackingInfo } from "@/types/trackingTypes"

// Type definitions for Google Maps
interface GoogleMaps {
  Map: new (element: HTMLElement, options?: unknown) => {
    fitBounds: (bounds: unknown, options?: unknown) => void
  }
  Marker: new (options?: unknown) => {
    setMap: (map: unknown) => void
    addListener: (event: string, callback: () => void) => void
  }
  DirectionsService: new () => {
    route: (request: unknown, callback: (result: unknown, status: string) => void) => void
  }
  DirectionsRenderer: new (options?: unknown) => {
    setMap: (map: unknown) => void
    setDirections: (result: unknown) => void
  }
  Polyline: new (options?: unknown) => {
    setMap: (map: unknown) => void
  }
  LatLngBounds: new () => {
    extend: (position: { lat: number; lng: number }) => void
  }
  TravelMode: {
    DRIVING: string
  }
  SymbolPath: {
    CIRCLE: unknown
  }
  Size: new (width: number, height: number) => unknown
  Point: new (x: number, y: number) => unknown
}

interface GoogleWindow extends Window {
  google?: {
    maps: GoogleMaps
  }
}

interface TrackingMapProps {
  trackingInfo: TrackingInfo | null
}

export function TrackingMap({ trackingInfo }: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const markersRef = useRef<Array<{ setMap: (map: unknown) => void }>>([])
  const directionsRendererRef = useRef<{ setMap: (map: unknown) => void; setDirections: (result: unknown) => void } | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const googleWindow = window as GoogleWindow
    
    // Check if Google Maps is already loaded
    if (googleWindow.google?.maps) {
      setTimeout(() => setIsReady(true), 0)
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY
    if (!apiKey) {
      console.error("Missing Google Maps API key (NEXT_PUBLIC_GOOGLE_PLACES_KEY)")
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-google-maps]")
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsReady(true))
      return
    }

    // Load Google Maps script
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
    script.async = true
    script.defer = true
    script.dataset.googleMaps = "true"
    script.addEventListener("load", () => setIsReady(true))
    script.addEventListener("error", () => {
      console.error("Failed to load Google Maps script")
    })
    document.head.appendChild(script)

    return () => {
      script.removeEventListener("load", () => setIsReady(true))
    }
  }, [])

  useEffect(() => {
    if (!isReady || !mapRef.current || !trackingInfo) return

    const googleWindow = window as GoogleWindow
    if (!googleWindow.google?.maps) return

    // Initialize map with dark theme
    const googleMap = new googleWindow.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: 6.5244, lng: 3.3792 }, // Default to Lagos
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#1d2c4d" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#8ec3b9" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#1a3646" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#0e1626" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38414e" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#212a37" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9ca5b3" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#746855" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry.stroke",
          stylers: [{ color: "#1f2835" }],
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [{ color: "#f3d19c" }],
        },
        {
          featureType: "transit",
          elementType: "geometry",
          stylers: [{ color: "#2f3948" }],
        },
        {
          featureType: "transit.station",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "poi",
          elementType: "geometry",
          stylers: [{ color: "#283d6a" }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#263d3e" }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b9a76" }],
        },
      ],
    })

    // Map is stored but not used in state - it's accessed via refs

    // Clear existing markers and directions
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
    }

    const bounds = new googleWindow.google.maps.LatLngBounds()
    let hasLocations = false

    // Add pickup marker
    if (trackingInfo.pickupDetails) {
      const pickupPosition = {
        lat: trackingInfo.pickupDetails.latitude,
        lng: trackingInfo.pickupDetails.longitude,
      }

      const pickupMarker = new googleWindow.google.maps.Marker({
        position: pickupPosition,
        map: googleMap,
        title: "Pickup Location",
        icon: {
          path: googleWindow.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#28a745",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      })

      markersRef.current.push(pickupMarker)
      bounds.extend(pickupPosition)
      hasLocations = true
    }

    // Add delivery marker (red pin)
    if (trackingInfo.deliveryLat && trackingInfo.deliveryLng) {
      const deliveryPosition = {
        lat: trackingInfo.deliveryLat,
        lng: trackingInfo.deliveryLng,
      }

      const deliveryMarker = new googleWindow.google.maps.Marker({
        position: deliveryPosition,
        map: googleMap,
        title: "Delivery Location",
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 40 16 40C16 40 32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#dc3545"/>
              <circle cx="16" cy="16" r="6" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new googleWindow.google.maps.Size(32, 40),
          anchor: new googleWindow.google.maps.Point(16, 40),
        },
      })

      markersRef.current.push(deliveryMarker)
      bounds.extend(deliveryPosition)
      hasLocations = true
    }

    // Draw route line if we have both locations
    if (
      trackingInfo.pickupDetails &&
      trackingInfo.deliveryLat &&
      trackingInfo.deliveryLng
    ) {
      const pickupPosition = {
        lat: trackingInfo.pickupDetails.latitude,
        lng: trackingInfo.pickupDetails.longitude,
      }
      const deliveryPosition = {
        lat: trackingInfo.deliveryLat,
        lng: trackingInfo.deliveryLng,
      }

      // Draw a straight line between pickup and delivery
      const routeLine = new googleWindow.google.maps.Polyline({
        path: [pickupPosition, deliveryPosition],
        geodesic: true,
        strokeColor: "#007bff",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: googleMap,
      })

      // Also use Directions Service for a more accurate route
      const directionsService = new googleWindow.google.maps.DirectionsService()
      const directionsRenderer = new googleWindow.google.maps.DirectionsRenderer({
        map: googleMap,
        suppressMarkers: true, // We'll use our custom markers
        polylineOptions: {
          strokeColor: "#007bff",
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      })

      directionsRendererRef.current = directionsRenderer

      directionsService.route(
        {
          origin: pickupPosition,
          destination: deliveryPosition,
          travelMode: googleWindow.google.maps.TravelMode.DRIVING,
        },
        (result: unknown, status: string) => {
          if (status === "OK" && result && googleWindow.google) {
            // Remove the straight line and use the route from Directions Service
            routeLine.setMap(null)
            directionsRenderer.setDirections(result)
            
            // Add truck icon on the route (positioned at current location)
            const routeResult = result as { routes?: Array<{ overview_path?: Array<{ lat: () => number; lng: () => number }> }> }
            const route = routeResult?.routes?.[0]
            if (route && route.overview_path && route.overview_path.length > 0) {
              // Position truck at about 1/3 of the route
              const truckIndex = Math.floor(route.overview_path.length * 0.33)
              const truckPoint = route.overview_path[truckIndex]
              const truckPosition = {
                lat: truckPoint.lat(),
                lng: truckPoint.lng(),
              }

              const truckMarker = new googleWindow.google.maps.Marker({
                position: truckPosition,
                map: googleMap,
                title: "Current Location",
                icon: {
                  url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#007bff" opacity="0.8"/>
                      <path d="M12 20L18 14L22 18L28 12V20H12Z" fill="#ffffff"/>
                    </svg>
                  `),
                  scaledSize: new googleWindow.google.maps.Size(40, 40),
                  anchor: new googleWindow.google.maps.Point(20, 20),
                },
              })

              markersRef.current.push(truckMarker)
            }
          } else {
            // If Directions Service fails, keep the straight line
            console.warn("Directions service failed, using straight line")
          }
        }
      )
    }

    // Fit bounds if we have locations
    if (hasLocations) {
      googleMap.fitBounds(bounds)
      
      // Add padding to bounds
      const padding = 50
      googleMap.fitBounds(bounds, {
        top: padding,
        right: padding,
        bottom: padding,
        left: padding,
      })
    }
  }, [isReady, trackingInfo])

  if (!trackingInfo) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1d2c4d]">
        <p className="text-muted-foreground">Enter a tracking code to view the map</p>
      </div>
    )
  }

  return (
    <div ref={mapRef} className="w-full h-full" />
  )
}
