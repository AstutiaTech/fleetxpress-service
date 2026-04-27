"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Calculator, Info, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react"
import { ApiService } from "@/lib/api"
import { CalculateShippingPriceRequest, CalculateShippingPriceResponse, CityType } from "@/types/weightBasedPricingTypes"
import { formatPrice } from "@/handlers/formatters"
import { toastUtils } from "@/utils/toast-utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export function PriceCalculator() {
    const [cityType, setCityType] = useState<CityType>("inside_city")
    const [category, setCategory] = useState<string>("")
    const [weightKg, setWeightKg] = useState<string>("")
    const [lengthCm, setLengthCm] = useState<string>("")
    const [widthCm, setWidthCm] = useState<string>("")
    const [heightCm, setHeightCm] = useState<string>("")
    const [result, setResult] = useState<CalculateShippingPriceResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [dimensionsOpen, setDimensionsOpen] = useState(false)

    const calculatePrice = async () => {
        const weight = parseFloat(weightKg)
        if (isNaN(weight) || weight <= 0) {
            toastUtils.error("Invalid Weight", "Please enter a valid weight greater than 0.")
            return
        }

        if (!category || category.trim() === "") {
            toastUtils.error("Category Required", "Please enter a category.")
            return
        }

        setLoading(true)
        try {
            const payload: CalculateShippingPriceRequest = {
                cityType,
                category: category.trim(),
                weightKg: weight,
            }

            // Add dimensions if all are provided
            if (lengthCm && widthCm && heightCm) {
                const length = parseFloat(lengthCm)
                const width = parseFloat(widthCm)
                const height = parseFloat(heightCm)

                if (!isNaN(length) && !isNaN(width) && !isNaN(height) && length > 0 && width > 0 && height > 0) {
                    payload.lengthCm = length
                    payload.widthCm = width
                    payload.heightCm = height
                }
            }

            const response = await ApiService.calculateShippingPrice(payload)
            if (response.status && response.data) {
                setResult(response.data)
            } else {
                toastUtils.error("Calculation Failed", response.message || "Failed to calculate shipping price.")
            }
        } catch (error) {
            const errorMessage = getErrorMessage(error, "An error occurred while calculating the price.")
            toastUtils.error("Error", errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setCategory("")
        setWeightKg("")
        setLengthCm("")
        setWidthCm("")
        setHeightCm("")
        setResult(null)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Calculate Shipping Price
                    </CardTitle>
                    <CardDescription>
                        Get an instant quote for your shipment based on category, weight and optional dimensions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>City Type *</Label>
                            <Select value={cityType} onValueChange={(value) => setCityType(value as CityType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inside_city">Inside City</SelectItem>
                                    <SelectItem value="outside_city">Outside City</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Category *</Label>
                            <Input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g., MAINLAND 1, South West"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the pricing category
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Weight (kg) *</Label>
                            <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={weightKg}
                                onChange={(e) => setWeightKg(e.target.value)}
                                placeholder="0.0"
                            />
                        </div>
                    </div>

                    <Collapsible open={dimensionsOpen} onOpenChange={setDimensionsOpen}>
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
                                {dimensionsOpen ? (
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
                                    step="0.1"
                                    min="0"
                                    value={lengthCm}
                                    onChange={(e) => setLengthCm(e.target.value)}
                                    placeholder="0.0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Width (cm)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={widthCm}
                                    onChange={(e) => setWidthCm(e.target.value)}
                                    placeholder="0.0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Height (cm)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={heightCm}
                                    onChange={(e) => setHeightCm(e.target.value)}
                                    placeholder="0.0"
                                />
                            </div>
                        </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <div className="flex gap-2">
                        <Button onClick={calculatePrice} disabled={loading || !weightKg || !category}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Calculate Price
                        </Button>
                        <Button variant="outline" onClick={resetForm}>
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Price Breakdown</CardTitle>
                        <CardDescription>Detailed calculation information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-sm text-muted-foreground">Actual Weight</Label>
                                <p className="text-lg font-semibold">{result.actualWeightKg} kg</p>
                            </div>

                            {result.volumetricWeightKg && (
                                <div className="space-y-1">
                                    <Label className="text-sm text-muted-foreground">Volumetric Weight</Label>
                                    <p className={`text-lg font-semibold ${result.volumetricWeightKg > (result.actualWeightKg || 0) ? 'text-orange-600' : ''}`}>
                                        {result.volumetricWeightKg.toFixed(2)} kg
                                    </p>
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label className="text-sm text-muted-foreground">Applied Weight</Label>
                                <p className="text-lg font-semibold">{result.appliedKg} kg</p>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-sm text-muted-foreground">Pricing Basis</Label>
                                <p className="text-lg font-semibold">
                                    {result.pricingBasis === "volumetricOverride" ? "Volumetric Override" : "Weight Tier"}
                                </p>
                            </div>
                        </div>

                        {result.usedFallback && (
                            <Alert variant="default">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Fallback Policy Used</AlertTitle>
                                <AlertDescription>
                                    A fallback policy was used to determine the price. Please ensure all weight tiers are properly configured.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <Label className="text-base">Shipping Price</Label>
                                <p className="text-3xl font-bold text-primary">
                                    {formatPrice(result.appliedPrice)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Weight Rounding Rules
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        <li>• Weights less than 0.5kg are rounded to 0kg</li>
                        <li>• Weights 0.5kg and above are rounded up to the nearest whole kg</li>
                        <li className="pt-2 font-medium">Examples:</li>
                        <li className="ml-4">• 0.3kg → 0kg</li>
                        <li className="ml-4">• 0.5kg → 1kg</li>
                        <li className="ml-4">• 1.2kg → 2kg</li>
                        <li className="ml-4">• 5.7kg → 6kg</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}

