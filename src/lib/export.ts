"use client"

import * as XLSX from "xlsx"

import autoTable from "jspdf-autotable"
import { jsPDF } from "jspdf"

export type ExportFormat = "pdf" | "csv" | "excel"

export interface ExportParams<T extends Record<string, unknown>> {
  type?: ExportFormat
  title: string         // Title of the file (shown in PDF, first line in CSV)
  headerTitle?: string  // Optional: Table header title (shown in PDF)
  fileName: string      // File name (without extension)
  columns: string[]     // Table column headers
  data: T[]             // Array of row objects (keys should match columns)
}

export async function exportData<T extends Record<string, unknown> = Record<string, unknown>>(params: ExportParams<T>) {
  const { type, title, headerTitle, fileName, columns, data } = params

  if (type === "pdf") {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.setTextColor(0, 0, 255)
    doc.text(title, 105, 15, { align: "center" })

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: "center" })

    if (headerTitle) {
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text(headerTitle, 14, 35)
    }

    // Dynamically generate columnStyles based on header length
    const baseWidth = 30;
    const maxWidth = 60;
    const columnStyles = columns.reduce((acc, col, idx) => {
      // Increase width for longer headers, but cap at maxWidth
      const width = Math.min(baseWidth + (String(col).length * 3), maxWidth);
      acc[idx] = { cellWidth: width };
      return acc;
    }, {} as Record<number, { cellWidth: number }>);

    autoTable(doc, {
      startY: headerTitle ? 40 : 30,
      head: [columns],
      body: data.map(row => columns.map(col => row[col] ?? "")),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 245, 255] },
      styles: { cellWidth: 'wrap', overflow: 'linebreak', fontSize: 10 },
      columnStyles,
    })

    doc.save(`${fileName}.pdf`)
  } else if (type === "csv") {
    try {
      let csvContent = `${title}\nGenerated on: ${new Date().toLocaleString()}\n\n`
      if (headerTitle) csvContent += `${headerTitle}\n`
      csvContent += columns.join(",") + "\n"
      data.forEach(row => {
        csvContent += columns.map(col => `"${row[col] ?? ""}"`).join(",") + "\n"
      })

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${fileName}.csv`)
      link.style.visibility = "hidden"
      link.style.position = "absolute"
      link.style.left = "-9999px"
      
      if (document.body) {
        document.body.appendChild(link)
        link.click()
        // Clean up: remove link and revoke URL
        setTimeout(() => {
          try {
            // Use modern remove() method which is safer - it's safe to call even if element is already removed
            if (link.isConnected) {
              link.remove()
            }
            URL.revokeObjectURL(url)
          } catch (error) {
            // Silently handle cleanup errors
            console.warn("Error cleaning up CSV export:", error)
          }
        }, 100)
      }
    } catch (error) {
      console.error("Error exporting CSV:", error)
      throw error
    }
  } else if (type === "excel") {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    
    // Prepare data for Excel
    const excelData = [
      [title],
      [`Generated on: ${new Date().toLocaleString()}`],
      headerTitle ? [headerTitle] : [],
      [], // Empty row
      columns, // Header row
      ...data.map(row => columns.map(col => {
        const value = row[col] ?? ""
        // Handle nested objects/arrays by converting to string
        return typeof value === "object" ? JSON.stringify(value) : String(value)
      }))
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(excelData)
    
    // Set column widths
    const maxWidth = 50
    const colWidths = columns.map((_, idx) => {
      const headerLength = String(columns[idx]).length
      const maxDataLength = Math.max(
        ...data.map(row => {
          const value = row[columns[idx]] ?? ""
          return String(value).length
        })
      )
      return { wch: Math.min(Math.max(headerLength, maxDataLength) + 2, maxWidth) }
    })
    worksheet["!cols"] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")

    // Generate Excel file and download
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  }
}
