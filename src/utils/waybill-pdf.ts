import { Costing } from "@/types/costingTypes"
import { GeneralSettings } from "@/types/settingsTypes"
import { Parcel } from "@/types/parcelTypes"
import QRCode from "qrcode"
import { Shipment } from "@/types/shipmentTypes"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { jsPDF } from "jspdf"

// Extend jsPDF type to include lastAutoTable
declare module "jspdf" {
    interface jsPDF {
        lastAutoTable?: {
            finalY: number
        }
    }
}

// Generate QR code data URL using qrcode library
async function generateQRCodeDataURL(text: string): Promise<string> {
    try {
        return await QRCode.toDataURL(text, {
            width: 150,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        })
    } catch (error) {
        console.error("Failed to generate QR code:", error)
        // Fallback to API service
        const encodedText = encodeURIComponent(text)
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodedText}`
    }
}

// Function to draw barcode (simple Code128-like representation)
function drawBarcode(doc: jsPDF, x: number, y: number, text: string, height: number = 20) {
    const barWidth = 1.5
    let currentX = x
    
    // Draw barcode pattern (simplified - using alternating bars)
    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const charCode = char.charCodeAt(0)
        const barHeight = height
        
        // Create pattern based on character code
        for (let j = 0; j < 8; j++) {
            const isBar = (charCode >> j) & 1
            if (isBar) {
                doc.rect(currentX, y, barWidth, barHeight, 'F')
            }
            currentX += barWidth
        }
        currentX += barWidth // Space between characters
    }
    
    // Draw text below barcode
    doc.setFontSize(8)
    doc.text(text, x + (currentX - x) / 2, y + height + 5, { align: "center" })
}

// Helper function to load image as data URL
async function loadImageAsDataURL(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext("2d")
            if (ctx) {
                ctx.drawImage(img, 0, 0)
                resolve(canvas.toDataURL("image/png"))
            } else {
                reject(new Error("Could not get canvas context"))
            }
        }
        img.onerror = reject
        img.src = src
    })
}

export async function generateWaybillPDF(
    shipment: Shipment,
    costing: Costing | null,
    parcels: Parcel[],
    settings?: GeneralSettings | null
) {
    // Create PDF in landscape orientation
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    
    // ============================================
    // SUBHEADER SECTION
    // ============================================
    const marginLeft = 10
    const marginRight = 10
    const subheaderY = 10
    const subheaderHeight = 8
    
    // App Name (Top Left) - from settings
    const companyName = settings?.applicationName || "FleetXpress"
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text(companyName.toUpperCase(), marginLeft, subheaderY)
    
    // Slogan (Top Right) - using about text from settings as slogan/tagline
    const slogan = settings?.about || "LOGISTICS & SERVICES"
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(slogan.toUpperCase(), pageWidth - marginRight, subheaderY, { align: "right" })
    
    // ============================================
    // MAIN HEADER SECTION - 5 GRID ROWS
    // ============================================
    const headerStartY = subheaderY + subheaderHeight + 5
    const rowSpacing = 6 // Adequate spacing between rows
    const rowHeight = 15
    
    // Row 1: Logo
    try {
        // Try to load logo from public folder first, then fallback to default
        const logoPath = "/images/logo_horizontal.webp"
        const logoUrl = typeof window !== "undefined" 
            ? `${window.location.origin}${logoPath}`
            : logoPath
        const logoDataURL = await loadImageAsDataURL(logoUrl)
        // Add logo image - adjusting size to fit nicely
        doc.addImage(logoDataURL, 'PNG', marginLeft, headerStartY, 60, 20)
    } catch (error) {
        console.error("Failed to load logo, using text fallback:", error)
        // Fallback: Use text logo
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text("FleetXpress", marginLeft, headerStartY + 10)
    }
    
    // Row 2: Payment Type, Payment Mode, Applied Insurance Amount
    const row2Y = headerStartY + rowHeight + rowSpacing
    const colWidth = (pageWidth - marginLeft - marginRight) / 3
    const col1X = marginLeft
    const col2X = marginLeft + colWidth
    const col3X = marginLeft + (colWidth * 2)
    const col4X = marginLeft + (colWidth * 2) + colWidth
    
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    
    // Column 1: Payment Type
    doc.setFont("helvetica", "bold")
    doc.text("Payment Type:", col1X, row2Y)
    doc.setFont("helvetica", "normal")
    const paymentTypeMap: Record<string, string> = {
        "cash": "Cash",
        "card": "Card",
        "transfer": "Bank Transfer"
    }
    doc.text(paymentTypeMap[shipment.paymentType] || shipment.paymentType, col1X, row2Y + 5)
    
    // Column 2: Payment Mode
    doc.setFont("helvetica", "bold")
    doc.text("Payment Mode:", col2X, row2Y)
    doc.setFont("helvetica", "normal")
    const paymentModeText = shipment.paymentMode.charAt(0).toUpperCase() + shipment.paymentMode.slice(1)
    doc.text(paymentModeText, col2X, row2Y + 5)
    
    // Column 3: Applied Insurance Amount
    doc.setFont("helvetica", "bold")
    doc.text("Applied Insurance:", col3X, row2Y)
    doc.setFont("helvetica", "normal")
    const insuranceAmount = costing?.insurance || 0
    doc.text(formatPrice(insuranceAmount), col3X, row2Y + 5)
    
    doc.setFont("helvetica", "bold")
    doc.text("Tracking Code:", col4X, row2Y)
    doc.setFont("helvetica", "normal")
    doc.text(shipment.trackingCode, col4X, row2Y + 5)
    
    // Row 3: Shipment Date, Delivery Option, Is Door Pickup
    const row3Y = row2Y + rowHeight + rowSpacing
    
    // Column 1: Shipment Date
    doc.setFont("helvetica", "bold")
    doc.text("Shipment Date:", col1X, row3Y)
    doc.setFont("helvetica", "normal")
    const shipmentDate = format(new Date(shipment.createdAt), "MMMM dd, yyyy 'at' h:mm a")
    doc.text(shipmentDate, col1X, row3Y + 5)
    
    // Column 2: Delivery Option
    doc.setFont("helvetica", "bold")
    doc.text("Delivery Option:", col2X, row3Y)
    doc.setFont("helvetica", "normal")
    const deliveryOptionMap: Record<string, string> = {
        "home": "Home Delivery",
        "pickup": "Pickup Point",
        "same-day": "Same Day"
    }
    doc.text(deliveryOptionMap[shipment.deliveryOption] || shipment.deliveryOption, col2X, row3Y + 5)
    
    // Column 3: Is Door Pickup
    doc.setFont("helvetica", "bold")
    doc.text("Door Pickup:", col3X, row3Y)
    doc.setFont("helvetica", "normal")
    doc.text(shipment.isDoorPickup ? "Yes" : "No", col3X, row3Y + 5)
    
    // Row 4: Waybill Number, Declared Value, Total Weight
    const row4Y = row3Y + rowHeight + rowSpacing
    const totalDeclaredValue = parcels.reduce((sum, p) => sum + (p.declaredValue || 0), 0)
    const totalWeight = parcels.reduce((sum, p) => sum + ((p.weight || 0) * p.quantity), 0)
    
    // Column 1: Waybill Number (Shipment Number)
    doc.setFont("helvetica", "bold")
    doc.text("Waybill Number:", col1X, row4Y)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(shipment.trackingCode, col1X, row4Y + 6)
    doc.setFontSize(6)
    
    // Column 2: Declared Value
    doc.setFont("helvetica", "bold")
    doc.text("Declared Value:", col2X, row4Y)
    doc.setFont("helvetica", "normal")
    doc.text(formatPrice(totalDeclaredValue), col2X, row4Y + 5)
    
    // Column 3: Total Weight
    doc.setFont("helvetica", "bold")
    doc.text("Total Weight:", col3X, row4Y)
    doc.setFont("helvetica", "normal")
    doc.text(`${totalWeight.toFixed(1)} Kg`, col3X, row4Y + 5)
    
    // Row 5: QR Code with tracking details
    const row5Y = row4Y + rowHeight + rowSpacing
    const qrSize = 30
    
    // Get origin for tracking URL
    const origin = typeof window !== "undefined" 
        ? window.location.origin 
        : (process.env.NEXT_PUBLIC_LIVE_URL || process.env.NEXT_PUBLIC_DEV_URL || "https://3flogistics.com")
    const trackingURL = `${origin}/shipment-tracking?code=${shipment.trackingCode}`
    
    try {
        const qrCodeURL = await generateQRCodeDataURL(trackingURL)
        // Center QR code in the row
        const qrX = (pageWidth - qrSize) / 2
        doc.addImage(qrCodeURL, 'PNG', qrX, row5Y, qrSize, qrSize)
        doc.setFontSize(7)
        doc.text("Scan to track shipment", qrX + qrSize / 2, row5Y + qrSize + 3, { align: "center" })
    } catch (error) {
        console.error("Failed to generate QR code:", error)
        // Fallback: Draw placeholder
        doc.rect((pageWidth - qrSize) / 2, row5Y, qrSize, qrSize, 'S')
        doc.setFontSize(7)
        doc.text("QR Code", pageWidth / 2, row5Y + qrSize / 2, { align: "center" })
    }
    
    // Calculate next Y position after header section
    let yPos = row5Y + qrSize + 10
    
    // Sender Section
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("FROM", 14, yPos)
    
    const senderName = shipment.sender?.profile 
        ? `${shipment.sender.profile.firstName} ${shipment.sender.profile.lastName}`.toUpperCase()
        : "N/A"
    const senderAddress = shipment.senderAddress?.street || shipment.sender?.profile?.address || "N/A"
    const senderPhone = shipment.sender?.profile?.phone || "N/A"
    
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(senderName, 14, yPos + 6)
    doc.text(senderAddress, 14, yPos + 11)
    doc.text(`Phone: ${senderPhone}`, 14, yPos + 16)
    
    // Recipient Section
    doc.setFont("helvetica", "bold")
    doc.text("TO", 14, yPos + 25)
    
    const recipientName = shipment.recipient
        ? `${shipment.recipient.firstName} ${shipment.recipient.lastName}`.toUpperCase()
        : `${shipment.recipientFirstName} ${shipment.recipientLastName}`.toUpperCase()
    const recipientAddress = shipment.deliveryAddress || shipment.recipient?.address?.street || "N/A"
    const recipientPhone = shipment.recipientPhoneNumber || shipment.recipient?.phoneNumber || "N/A"
    
    doc.setFont("helvetica", "normal")
    doc.text(recipientName, 14, yPos + 31)
    doc.text(recipientAddress, 14, yPos + 36)
    doc.text(`Phone: ${recipientPhone}`, 14, yPos + 41)
    
    // Signatures Section (Right side)
    const signatureX = 105
    doc.setFontSize(9)
    doc.text("Sent By:", signatureX, yPos, { align: "right" })
    doc.text("Signature: ________________", signatureX, yPos + 10, { align: "right" })
    
    doc.text("Received By:", signatureX, yPos + 25, { align: "right" })
    doc.text("Name: ________________", signatureX, yPos + 31, { align: "right" })
    doc.text("Phone #: ________________", signatureX, yPos + 36, { align: "right" })
    doc.text("Signature: ________________", signatureX, yPos + 41, { align: "right" })
    doc.text("Date: ________________", signatureX, yPos + 46, { align: "right" })
    
    // Feedback QR Code
    try {
        const origin = typeof window !== "undefined" 
            ? window.location.origin 
            : (process.env.NEXT_PUBLIC_LIVE_URL || process.env.NEXT_PUBLIC_DEV_URL || "https://3flogistics.com")
        const feedbackURL = `${origin}/shipment-tracking?code=${shipment.trackingCode}&feedback=true`
        const feedbackQR = await generateQRCodeDataURL(feedbackURL)
        doc.addImage(feedbackQR, 'PNG', signatureX - 20, yPos + 50, 20, 20)
        doc.setFontSize(6)
        doc.text("Send feedback", signatureX - 10, yPos + 72, { align: "center" })
    } catch (error) {
        console.error("Failed to generate feedback QR code:", error)
    }
    
    // Parcel Details Table
    yPos = yPos + 60
    
    const tableData = parcels.map((parcel, index) => {
        const description = parcel.packaging?.name 
            ? `${parcel.packaging.name}, ${parcel.length}×${parcel.width}×${parcel.height}cm`
            : `${parcel.length}×${parcel.width}×${parcel.height}cm`
        
        const unitPrice = costing ? costing.amount / parcels.reduce((sum, p) => sum + p.quantity, 0) : 0
        const amount = unitPrice * parcel.quantity
        
        return [
            "☐", // Checkbox placeholder
            description,
            `${parcel.weight || 0}Kg`,
            "NORMAL, NormalGoods",
            parcel.quantity.toString(),
            formatPrice(unitPrice),
            formatPrice(amount),
            formatPrice(amount)
        ]
    })
    
    autoTable(doc, {
        startY: yPos,
        head: [["CHECK", "DESCRIPTION", "WEIGHT", "NATURE OF ITEMS", "QUANTITY", "UNIT PRICE", "AMOUNT", "TOTAL"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [66, 66, 66], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 50 },
            2: { cellWidth: 25 },
            3: { cellWidth: 30 },
            4: { cellWidth: 20 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 },
            7: { cellWidth: 25 }
        },
        margin: { left: 14, right: 14 }
    })
    
    // Financial Summary
    const tableEndY = (doc.lastAutoTable?.finalY || yPos + 50) + 10
    
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    
    const summaryY = tableEndY
    const summaryX = 105
    
    if (costing) {
        doc.text(`Packages: ${formatPrice(0)}`, summaryX, summaryY, { align: "right" })
        doc.text(`Handling & Security: ${formatPrice(2000)}`, summaryX, summaryY + 5, { align: "right" })
        doc.text(`Pickup Price: ${formatPrice(0)}`, summaryX, summaryY + 10, { align: "right" })
        doc.text(`Vat: ${formatPrice(costing.vat)}`, summaryX, summaryY + 15, { align: "right" })
        doc.text(`Total: ${formatPrice(costing.amount)}`, summaryX, summaryY + 20, { align: "right" })
        doc.text(`Vacuum Seal Fee: ${formatPrice(0)}`, summaryX, summaryY + 25, { align: "right" })
        doc.text(`Phytosanitary Cert Fee: ${formatPrice(0)}`, summaryX, summaryY + 30, { align: "right" })
        doc.text(`Express Charge: ${formatPrice(0)}`, summaryX, summaryY + 35, { align: "right" })
        doc.text(`Surcharge: ${formatPrice(costing.extraCost)}`, summaryX, summaryY + 40, { align: "right" })
        doc.text(`SMEDAN Discount: ${formatPrice(0)}`, summaryX, summaryY + 45, { align: "right" })
        
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.text(`Grand Total: ${formatPrice(costing.amount)}`, summaryX, summaryY + 52, { align: "right" })
    }
    
    // Preparation and Shipment Type (Bottom Left)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const bottomY = pageHeight - 30
    
    doc.text(`Prepared By: ${shipment.sender?.profile ? `${shipment.sender.profile.firstName} ${shipment.sender.profile.lastName}` : "N/A"}`, 14, bottomY)
    
    const shipmentTypeMap: Record<string, string> = {
        "home": "Agility",
        "pickup": "Agility",
        "same-day": "Same Day"
    }
    doc.text(`Shipment Type: ${shipmentTypeMap[shipment.deliveryOption] || "Standard"}`, 14, bottomY + 5)
    
    const parcelDescription = parcels.map(p => 
        p.packaging?.name || `${p.length}×${p.width}×${p.height}cm`
    ).join(", ")
    doc.text(`Description: ${parcelDescription.substring(0, 60)}`, 14, bottomY + 10)
    
    return doc
}

