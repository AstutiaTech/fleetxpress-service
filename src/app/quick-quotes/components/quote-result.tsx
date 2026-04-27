"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Printer } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { QuickQuoteResponse } from "@/types/quickQuoteTypes"
import { buildImageUrl } from "@/lib/utils"
import { formatPrice } from "@/handlers/formatters"
import { jsPDF } from "jspdf"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"

interface QuoteResultProps {
  result: QuickQuoteResponse
}

const QuoteResultComponent = ({ result }: QuoteResultProps) => {
  const { settingsStore } = useStore()
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>("/images/logo_full.png")
  const [applicationName, setApplicationName] = useState<string>("FleetXpress")

  useEffect(() => {
    // Fetch settings if not loaded
    if (!settingsStore.generalSettings) {
      settingsStore.fetchGeneralSettings()
    }
    
    // Set logo URL
    const logoFromApi = settingsStore.generalSettings?.logo
    if (logoFromApi) {
      const builtUrl = buildImageUrl(logoFromApi)
      setLogoUrl(builtUrl || "/images/logo_full.png")
    } else {
      setLogoUrl("/images/logo_full.png")
    }
    
    // Set application name
    setApplicationName(settingsStore.generalSettings?.applicationName || "FleetXpress")
  }, [settingsStore.generalSettings])

  const handlePrint = () => {
    setIsPrintModalOpen(true)
  }

  const handlePrintPage = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      let yPos = margin

      // Add logo at the top
      try {
        console.log("Loading logo from URL:", logoUrl)
        const logoImg = await loadImageAsBase64(logoUrl)
        console.log("Logo loaded, base64 length:", logoImg?.length || 0)
        
        if (logoImg) {
          // Use canvas method to ensure compatibility
          // Use window.Image to avoid conflict with Next.js Image component
          const img = new window.Image()
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              console.log("Image loaded successfully, dimensions:", img.width, "x", img.height)
              resolve()
            }
            img.onerror = (err) => {
              console.error("Image load error:", err)
              reject(new Error("Failed to load image"))
            }
            img.crossOrigin = "anonymous"
            img.src = logoImg
          })
          
          // Convert to canvas for reliable PDF embedding
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          
          if (!ctx) {
            throw new Error("Could not get canvas context")
          }
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0)
          
          // Convert canvas to PNG data URL
          const pngDataUrl = canvas.toDataURL("image/png")
          const pngBase64 = pngDataUrl.split(",")[1]
          
          if (!pngBase64) {
            throw new Error("Failed to extract base64 data from canvas")
          }
          
          // Calculate logo dimensions for PDF (in mm)
          const maxWidth = 60 // mm
          const maxHeight = 30 // mm
          const aspectRatio = img.width / img.height
          let logoWidth = maxWidth
          let logoHeight = maxWidth / aspectRatio
          
          if (logoHeight > maxHeight) {
            logoHeight = maxHeight
            logoWidth = maxHeight * aspectRatio
          }
          
          // Add logo to PDF
          console.log("Adding logo to PDF, size:", logoWidth, "x", logoHeight, "mm")
          doc.addImage(
            pngBase64,
            "PNG",
            pageWidth / 2 - logoWidth / 2, // Center horizontally
            yPos,
            logoWidth,
            logoHeight
          )
          
          yPos += logoHeight + 10
          console.log("Logo added successfully to PDF")
        } else {
          console.warn("Logo image is null, skipping logo in PDF")
        }
      } catch (error) {
        console.error("Error loading/adding logo for PDF:", error)
        // Continue without logo if it fails
      }

      // Add application name
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text(applicationName, pageWidth / 2, yPos, { align: "center" })
      yPos += 10

      // Add title
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text("Quick Quote Summary", pageWidth / 2, yPos, { align: "center" })
      yPos += 10

      // Add date
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" })
      yPos += 15

      // Add badge info
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(`Shipment Type: ${result.isOutsideCity ? "Outside City" : "Inside City"}`, margin, yPos)
      yPos += 8
      doc.text(`Distance: ${result.distanceInKm.toFixed(2)} km`, margin, yPos)
      yPos += 15

      // Pricing Breakdown
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text("Pricing Breakdown", margin, yPos)
      yPos += 8

      doc.setFontSize(10)
      yPos = addLineItem(doc, "Delivery Charge", formatPrice(result.deliveryCharge), margin, yPos, pageWidth)
      
      if (result.extraVolume > 0) {
        yPos = addLineItem(doc, "Extra Volume Charge", formatPrice(result.extraVolume), margin, yPos, pageWidth)
      }
      
      if (result.packagingCharge > 0) {
        yPos = addLineItem(doc, "Packaging Charge", formatPrice(result.packagingCharge), margin, yPos, pageWidth)
      }
      
      if (result.extraCost > 0) {
        yPos = addLineItem(doc, "Extra Cost", formatPrice(result.extraCost), margin, yPos, pageWidth)
      }
      
      yPos = addLineItem(doc, "Subtotal", formatPrice(result.subtotal), margin, yPos, pageWidth, true)
      yPos += 5

      // Taxes & Fees
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text("Taxes & Fees", margin, yPos)
      yPos += 8

      doc.setFontSize(10)
      if (result.vat > 0) {
        yPos = addLineItem(doc, `VAT (${result.vatRate}%)`, formatPrice(result.vat), margin, yPos, pageWidth)
      }
      
      if (result.tax > 0) {
        yPos = addLineItem(doc, `Tax (${result.taxRate}%)`, formatPrice(result.tax), margin, yPos, pageWidth)
      }
      
      if (result.insurance > 0) {
        const insuranceLabel = result.insuranceRate > 0 
          ? `Insurance (${result.insuranceRate}%)` 
          : "Insurance (Custom)"
        yPos = addLineItem(doc, insuranceLabel, formatPrice(result.insurance), margin, yPos, pageWidth)
      }
      yPos += 10

      // Total
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "bold")
      yPos = addLineItem(doc, "Total Amount", formatPrice(result.totalAmount), margin, yPos, pageWidth, true)
      doc.setFont(undefined, "normal")

      // Save PDF
      doc.save(`quote-${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  const addLineItem = (
    doc: jsPDF,
    label: string,
    value: string,
    margin: number,
    yPos: number,
    pageWidth: number,
    isBold = false
  ): number => {
    const pageHeight = doc.internal.pageSize.getHeight()
    // Check if we need a new page
    if (yPos > pageHeight - 30) {
      doc.addPage()
      return 20
    }

    doc.setFont(undefined, isBold ? "bold" : "normal")
    doc.text(label, margin, yPos)
    doc.text(value, pageWidth - margin, yPos, { align: "right" })
    return yPos + 7
  }

  const loadImageAsBase64 = async (url: string): Promise<string | null> => {
    // Primary method: Use canvas conversion (handles CORS better)
    try {
      return new Promise<string | null>((resolve) => {
        // Use window.Image to avoid conflict with Next.js Image component
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        
        img.onload = () => {
          try {
            console.log("Image loaded via canvas method, converting to base64")
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext("2d")
            
            if (!ctx) {
              console.error("Could not get canvas context")
              resolve(null)
              return
            }
            
            // Draw image to canvas
            ctx.drawImage(img, 0, 0)
            
            // Convert to PNG data URL
            const dataUrl = canvas.toDataURL("image/png")
            console.log("Canvas conversion successful, data URL length:", dataUrl.length)
            resolve(dataUrl)
          } catch (canvasError) {
            console.error("Canvas conversion error:", canvasError)
            resolve(null)
          }
        }
        
        img.onerror = (error) => {
          console.error("Image load error in canvas method:", error)
          // Try fetch method as fallback
          fetchImageAsFallback(url).then(resolve).catch(() => resolve(null))
        }
        
        img.src = url
      })
    } catch (error) {
      console.error("Error in canvas method, trying fetch:", error)
      return fetchImageAsFallback(url)
    }
  }

  const fetchImageAsFallback = async (url: string): Promise<string | null> => {
    try {
      console.log("Trying fetch method for image:", url)
      const response = await fetch(url, {
        mode: "cors",
        credentials: "omit",
      })
      
      if (!response.ok) {
        console.error(`Failed to fetch image: ${response.status} ${response.statusText}`)
        return null
      }
      
      const blob = await response.blob()
      console.log("Blob created, size:", blob.size)
      
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          if (base64) {
            console.log("FileReader success, base64 length:", base64.length)
            resolve(base64)
          } else {
            console.error("FileReader returned null")
            resolve(null)
          }
        }
        reader.onerror = (error) => {
          console.error("FileReader error:", error)
          resolve(null)
        }
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error("Fetch method error:", error)
      return null
    }
  }

  return (
    <>
      <Card className="sticky top-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quote Summary</CardTitle>
            <Badge variant={result.isOutsideCity ? "default" : "secondary"}>
              {result.isOutsideCity ? "Outside City" : "Inside City"}
            </Badge>
          </div>
          <CardDescription>Pricing breakdown for your shipment</CardDescription>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* Pricing Breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Pricing Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span className="font-medium">{formatPrice(result.deliveryCharge)}</span>
            </div>
            {result.extraVolume > 0 && (
              <div className="flex justify-between">
                <span>Extra Volume Charge</span>
                <span className="font-medium">{formatPrice(result.extraVolume)}</span>
              </div>
            )}
            {result.packagingCharge > 0 && (
              <div className="flex justify-between">
                <span>Packaging Charge</span>
                <span className="font-medium">{formatPrice(result.packagingCharge)}</span>
              </div>
            )}
            {result.extraCost > 0 && (
              <div className="flex justify-between">
                <span>Extra Cost</span>
                <span className="font-medium">{formatPrice(result.extraCost)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(result.subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Taxes & Fees */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Taxes & Fees</h3>
          <div className="space-y-2">
            {result.vat > 0 && (
              <div className="flex justify-between">
                <span>VAT ({result.vatRate}%)</span>
                <span className="font-medium">{formatPrice(result.vat)}</span>
              </div>
            )}
            {result.tax > 0 && (
              <div className="flex justify-between">
                <span>Tax ({result.taxRate}%)</span>
                <span className="font-medium">{formatPrice(result.tax)}</span>
              </div>
            )}
            {result.insurance > 0 && (
              <div className="flex justify-between">
                <span>
                  Insurance {result.insuranceRate > 0 ? `(${result.insuranceRate}%)` : "(Custom)"}
                </span>
                <span className="font-medium">{formatPrice(result.insurance)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">Total Amount</span>
            <span className="text-2xl font-bold text-primary">{formatPrice(result.totalAmount)}</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Distance:</span>
            <span className="font-medium">{result.distanceInKm.toFixed(2)} km</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipment Type:</span>
            <span className="font-medium">{result.isOutsideCity ? "Outside City" : "Inside City"}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t flex gap-2">
          {/* <Button onClick={handlePrint} variant="outline" className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button> */}
          <Button onClick={handleDownloadPDF} variant="outline" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Print Modal */}
    <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full print:overflow-visible print:p-0 print:static print:transform-none print:shadow-none print:border-none">
        <div className="print-content p-6 print:p-0 print:block">
          {/* Header with Logo and Name */}
          <div className="flex flex-col items-center mb-6 print:mb-2 print:block print:text-center">
            <div className="mb-3 print:mb-1 print:flex print:justify-center">
              <Image
                src={logoUrl}
                alt="Brand Logo"
                width={200}
                height={70}
                className="object-contain print:max-w-[120px] print:h-auto print:block print:mx-auto"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold print:text-lg print:mb-1 print:mt-1">{applicationName}</h1>
          </div>

          {/* Quote Content */}
          <div className="space-y-4 print:space-y-2">
            <div className="text-center mb-4 print:mb-2">
              <h2 className="text-xl font-semibold print:text-base print:mb-1">Quick Quote Summary</h2>
              <p className="text-sm text-muted-foreground print:text-[10px] print:mt-0">
                Generated on: {new Date().toLocaleString()}
              </p>
            </div>

            {/* Badge Info */}
            <div className="flex justify-center gap-4 mb-4 print:mb-2 print:gap-2">
              <Badge variant={result.isOutsideCity ? "default" : "secondary"} className="print:text-xs">
                {result.isOutsideCity ? "Outside City" : "Inside City"}
              </Badge>
              <span className="text-sm text-muted-foreground print:text-xs">
                Distance: {result.distanceInKm.toFixed(2)} km
              </span>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-2 print:space-y-1">
              <h3 className="font-semibold text-lg print:text-sm print:mb-1 border-b print:border-b print:pb-1">Pricing Breakdown</h3>
              <div className="space-y-1 print:space-y-0.5">
                <div className="flex justify-between print:text-sm">
                  <span>Delivery Charge</span>
                  <span className="font-medium">{formatPrice(result.deliveryCharge)}</span>
                </div>
                {result.extraVolume > 0 && (
                  <div className="flex justify-between print:text-sm">
                    <span>Extra Volume Charge</span>
                    <span className="font-medium">{formatPrice(result.extraVolume)}</span>
                  </div>
                )}
                {result.packagingCharge > 0 && (
                  <div className="flex justify-between print:text-sm">
                    <span>Packaging Charge</span>
                    <span className="font-medium">{formatPrice(result.packagingCharge)}</span>
                  </div>
                )}
                {result.extraCost > 0 && (
                  <div className="flex justify-between print:text-sm">
                    <span>Extra Cost</span>
                    <span className="font-medium">{formatPrice(result.extraCost)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-semibold print:text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(result.subtotal)}</span>
                </div>
              </div>
            </div>

            {/* Taxes & Fees */}
            <div className="space-y-2 print:space-y-1">
              <h3 className="font-semibold text-lg print:text-sm print:mb-1 border-b print:border-b print:pb-1">Taxes & Fees</h3>
              <div className="space-y-1 print:space-y-0.5">
                {result.vat > 0 && (
                  <div className="flex justify-between print:text-sm">
                    <span>VAT ({result.vatRate}%)</span>
                    <span className="font-medium">{formatPrice(result.vat)}</span>
                  </div>
                )}
                {result.tax > 0 && (
                  <div className="flex justify-between print:text-sm">
                    <span>Tax ({result.taxRate}%)</span>
                    <span className="font-medium">{formatPrice(result.tax)}</span>
                  </div>
                )}
                {result.insurance > 0 && (
                  <div className="flex justify-between print:text-sm">
                    <span>
                      Insurance {result.insuranceRate > 0 ? `(${result.insuranceRate}%)` : "(Custom)"}
                    </span>
                    <span className="font-medium">{formatPrice(result.insurance)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t-2 print:pt-1 print:mt-2">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold print:text-base">Total Amount</span>
                <span className="text-2xl font-bold text-primary print:text-lg">{formatPrice(result.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className="mt-6 print:hidden">
          <Button onClick={handlePrintPage} className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            Print This Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

export const QuoteResult = observer(QuoteResultComponent)

