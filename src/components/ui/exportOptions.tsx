"use client"

import { Download, FileDown, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ExportFormat, ExportParams, exportData } from "@/lib/export"

import { Button } from "@/components/ui/button"
import { toJS } from "mobx"
import { useState } from "react"

interface ExportOptionsProps<T extends Record<string, unknown> = Record<string, unknown>> {
  params: ExportParams<T>
}

export default function ExportOptions<T extends Record<string, unknown> = Record<string, unknown>>({ params }: ExportOptionsProps<T>) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: ExportFormat) => {
    setIsExporting(true)
    try {
      await exportData({ ...params, type } as ExportParams<Record<string, unknown>>)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-300">
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          className="hover:bg-slate-700 hover:text-white cursor-pointer"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          className="hover:bg-slate-700 hover:text-white cursor-pointer"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("excel")}
          className="hover:bg-slate-700 hover:text-white cursor-pointer"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
