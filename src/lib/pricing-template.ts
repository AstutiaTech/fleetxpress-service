"use client"

import * as XLSX from "xlsx"

export interface PricingTemplateData {
  route: string
  category: string
  kg: number
  price: number
}

/**
 * Generate a CSV template for pricing import
 * 
 * Note: The file includes Route and Category columns. 
 * 
 * Import Behavior:
 * - Routes are created per route+category combination
 * - Pricing is stored per category (not per route)
 * - ALL weight/price combinations in the file for each category are imported, regardless of which route they appear under
 * - All routes with the same category share the same pricing structure
 * 
 * Example: If "Ogba - Ikeja" has weights 0.5-10kg and "Agege" has weights 0.5-3000kg, 
 * both with category "MAINLAND 1", then ALL routes with "MAINLAND 1" will have pricing up to 3000kg.
 */
export function generateCSVTemplate(): void {
  const insideCityData: PricingTemplateData[] = [
    { route: "Ogba - Ikeja", category: "MAINLAND 1", kg: 0.5, price: 3000 },
    { route: "Ogba - Ikeja", category: "MAINLAND 1", kg: 1, price: 4000 },
    { route: "Ogba - Ikeja", category: "MAINLAND 1", kg: 2, price: 5000 },
    { route: "Agege", category: "MAINLAND 1", kg: 0.5, price: 3000 },
    { route: "Agege", category: "MAINLAND 1", kg: 1, price: 4000 },
  ]

  const outsideCityData: PricingTemplateData[] = [
    { route: "Abeokuta", category: "South West", kg: 0.5, price: 5000 },
    { route: "Abeokuta", category: "South West", kg: 1, price: 6000 },
    { route: "Abeokuta", category: "South West", kg: 2, price: 7000 },
    { route: "Akure", category: "South West", kg: 0.5, price: 5000 },
    { route: "Akure", category: "South West", kg: 1, price: 6000 },
  ]

  let csvContent = "Inside City\n"
  csvContent += "Route,Category,kg,Price\n"
  insideCityData.forEach((row) => {
    csvContent += `${row.route},${row.category},${row.kg},${row.price}\n`
  })
  csvContent += "\nOutside City\n"
  csvContent += "Route,Category,kg,Price\n"
  outsideCityData.forEach((row) => {
    csvContent += `${row.route},${row.category},${row.kg},${row.price}\n`
  })

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", "pricing-import-template.csv")
  link.style.visibility = "hidden"
  link.style.position = "absolute"
  link.style.left = "-9999px"

  if (document.body) {
    document.body.appendChild(link)
    link.click()
    setTimeout(() => {
      try {
        if (link.isConnected) {
          link.remove()
        }
        URL.revokeObjectURL(url)
      } catch (error) {
        console.warn("Error cleaning up CSV template:", error)
      }
    }, 100)
  }
}

/**
 * Generate an Excel template for pricing import
 * 
 * Note: The file includes Route and Category columns.
 * 
 * Import Behavior:
 * - Routes are created per route+category combination
 * - Pricing is stored per category (not per route)
 * - ALL weight/price combinations in the file for each category are imported, regardless of which route they appear under
 * - All routes with the same category share the same pricing structure
 * 
 * Example: If "Ogba - Ikeja" has weights 0.5-10kg and "Agege" has weights 0.5-3000kg, 
 * both with category "MAINLAND 1", then ALL routes with "MAINLAND 1" will have pricing up to 3000kg.
 */
export function generateExcelTemplate(): void {
  const insideCityData: PricingTemplateData[] = [
    { route: "Ogba - Ikeja", category: "MAINLAND 1", kg: 0.5, price: 3000 },
    { route: "Ogba - Ikeja", category: "MAINLAND 1", kg: 1, price: 4000 },
    { route: "Ogba - Ikeja", category: "MAINLAND 1", kg: 2, price: 5000 },
    { route: "Ogba - Ikeja", category: "MAINLAND 1", kg: 5, price: 8000 },
    { route: "Ogba - Ikeja", category: "MAINLAND 1", kg: 10, price: 12000 },
    { route: "Agege", category: "MAINLAND 1", kg: 0.5, price: 3000 },
    { route: "Agege", category: "MAINLAND 1", kg: 1, price: 4000 },
    { route: "Agege", category: "MAINLAND 1", kg: 2, price: 5000 },
  ]

  const outsideCityData: PricingTemplateData[] = [
    { route: "Abeokuta", category: "South West", kg: 0.5, price: 5000 },
    { route: "Abeokuta", category: "South West", kg: 1, price: 6000 },
    { route: "Abeokuta", category: "South West", kg: 2, price: 7000 },
    { route: "Abeokuta", category: "South West", kg: 5, price: 10000 },
    { route: "Abeokuta", category: "South West", kg: 10, price: 15000 },
    { route: "Akure", category: "South West", kg: 0.5, price: 5000 },
    { route: "Akure", category: "South West", kg: 1, price: 6000 },
    { route: "Akure", category: "South West", kg: 2, price: 7000 },
  ]

  // Create workbook
  const workbook = XLSX.utils.book_new()

  // Create Inside City sheet
  const insideCitySheetData = [
    ["Route", "Category", "kg", "Price"], // Header
    ...insideCityData.map((row) => [row.route, row.category, row.kg, row.price]),
  ]
  const insideCitySheet = XLSX.utils.aoa_to_sheet(insideCitySheetData)
  
  // Set column widths for Inside City sheet
  insideCitySheet["!cols"] = [
    { wch: 20 }, // Route
    { wch: 15 }, // Category
    { wch: 10 }, // kg
    { wch: 12 }, // Price
  ]

  // Create Outside City sheet
  const outsideCitySheetData = [
    ["Route", "Category", "kg", "Price"], // Header
    ...outsideCityData.map((row) => [row.route, row.category, row.kg, row.price]),
  ]
  const outsideCitySheet = XLSX.utils.aoa_to_sheet(outsideCitySheetData)
  
  // Set column widths for Outside City sheet
  outsideCitySheet["!cols"] = [
    { wch: 20 }, // Route
    { wch: 15 }, // Category
    { wch: 10 }, // kg
    { wch: 12 }, // Price
  ]

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(workbook, insideCitySheet, "Inside City")
  XLSX.utils.book_append_sheet(workbook, outsideCitySheet, "Outside City")

  // Generate and download Excel file
  XLSX.writeFile(workbook, "pricing-import-template.xlsx")
}

