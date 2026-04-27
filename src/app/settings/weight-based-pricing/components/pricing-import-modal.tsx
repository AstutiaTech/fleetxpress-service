"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { toastUtils } from "@/utils/toast-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PricingImportResult } from "@/types/weightBasedPricingTypes"

interface PricingImportModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function PricingImportModal({ open, onOpenChange, onSuccess }: PricingImportModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isImporting, setIsImporting] = useState(false)
    const [result, setResult] = useState<PricingImportResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            const extension = selectedFile.name.split('.').pop()?.toLowerCase()
            
            if (extension !== 'xlsx' && extension !== 'csv') {
                setError('Please select an Excel (.xlsx) or CSV file')
                setFile(null)
                return
            }
            
            setFile(selectedFile)
            setError(null)
            setResult(null)
        }
    }

    const handleImport = async () => {
        if (!file) {
            setError('Please select a file')
            return
        }

        setIsImporting(true)
        setError(null)
        setResult(null)

        try {
            const response = await ApiService.importPricing(file)
            if (response.status && response.data) {
                setResult(response.data)
                toastUtils.success("Import Successful", `Successfully imported ${response.data.totalPricesImported} prices.`)
                onSuccess?.()
            } else {
                const errorMsg = typeof response.response === 'string' 
                    ? response.response 
                    : (response.response?.message || response.response || 'Import failed')
                setError(String(errorMsg))
                toastUtils.error("Import Failed", String(errorMsg))
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.response 
                ? (typeof err.response.data.response === 'string' 
                    ? err.response.data.response 
                    : err.response.data.response?.message || String(err.response.data.response))
                : (err.message || 'Failed to import pricing data')
            setError(String(errorMsg))
            toastUtils.error("Import Failed", String(errorMsg))
        } finally {
            setIsImporting(false)
        }
    }

    const handleClose = () => {
        setFile(null)
        setResult(null)
        setError(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Pricing Data</DialogTitle>
                    <DialogDescription>
                        Upload an Excel (.xlsx) or CSV file to import pricing data. The file should contain 
                        Route, Category, kg, and Price columns for both Inside City and Outside City.
                        <br /><br />
                        <strong>Important:</strong> Routes are created per route+category combination, but pricing is stored per category. 
                        All weight/price combinations in the file for each category will be imported, regardless of which route they appear under. 
                        All routes with the same category will share the same pricing structure.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    {!result && (
                        <>
                            <div className="space-y-2">
                                <Label>Select File</Label>
                                <Input
                                    type="file"
                                    accept=".xlsx,.csv"
                                    onChange={handleFileChange}
                                    disabled={isImporting}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Supported formats: Excel (.xlsx) or CSV (.csv)
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {file && (
                                <div className="p-3 border rounded bg-muted/50">
                                    <p className="text-sm font-medium">Selected file:</p>
                                    <p className="text-sm text-muted-foreground">{file.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Size: {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {result && (
                        <div className="space-y-4">
                            <Alert>
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                    Import completed successfully!
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Import Summary</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Inside City Routes</p>
                                        <p className="font-medium">{result.insideCityRoutesCreated}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Outside City Routes</p>
                                        <p className="font-medium">{result.outsideCityRoutesCreated}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Inside City Prices</p>
                                        <p className="font-medium">{result.insideCityPricesImported}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Outside City Prices</p>
                                        <p className="font-medium">{result.outsideCityPricesImported}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground">Total Prices Imported</p>
                                        <p className="font-medium text-lg">{result.totalPricesImported}</p>
                                    </div>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-destructive">Errors/Warnings</h4>
                                    <div className="max-h-[200px] overflow-y-auto p-3 border rounded bg-destructive/10">
                                        <ul className="space-y-1 text-sm">
                                            {result.errors.map((err, index) => (
                                                <li key={index} className="text-destructive">{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {result ? (
                        <Button onClick={handleClose}>
                            Close
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                                Cancel
                            </Button>
                            <Button onClick={handleImport} disabled={!file || isImporting}>
                                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Upload className="mr-2 h-4 w-4" />
                                Import Pricing
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

