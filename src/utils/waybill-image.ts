import { Costing } from "@/types/costingTypes"
import { GeneralSettings } from "@/types/settingsTypes"
import { Parcel } from "@/types/parcelTypes"
import QRCode from "qrcode"
import { Shipment } from "@/types/shipmentTypes"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { toPng } from "html-to-image"

// Generate QR code data URL
async function generateQRCodeDataURL(text: string): Promise<string> {
    try {
        return await QRCode.toDataURL(text, {
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        })
    } catch (error) {
        console.error("Failed to generate QR code:", error)
        const encodedText = encodeURIComponent(text)
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`
    }
}

// Generate a simple barcode using canvas
function generateBarcode(text: string, width: number = 200, height: number = 60): string {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return ""

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = "#000000"

    const barWidth = 2
    let currentX = 20
    
    // Draw barcode pattern
    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const charCode = char.charCodeAt(0)
        
        for (let j = 0; j < 8; j++) {
            const isBar = (charCode >> j) & 1
            if (isBar) {
                ctx.fillRect(currentX, 10, barWidth, height - 30)
            }
            currentX += barWidth
        }
        currentX += barWidth
    }
    
    // Draw text below barcode
    ctx.fillStyle = "#000000"
    ctx.font = "12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(text, width / 2, height - 5)
    
    return canvas.toDataURL("image/png")
}

export async function generateWaybillImage(
    shipment: Shipment,
    costing: Costing | null,
    parcels: Parcel[],
    settings?: GeneralSettings | null
): Promise<string> {
    const companyName = (settings?.applicationName || "LOGISTICS APP").toUpperCase()
    const slogan = (settings?.about || "LOGISTICS & SERVICES").toUpperCase()
    
    // Get tracking URL
    const origin = typeof window !== "undefined" 
        ? window.location.origin 
        : (process.env.NEXT_PUBLIC_LIVE_URL || process.env.NEXT_PUBLIC_DEV_URL || "")
    const trackingURL = `${origin}/shipment-tracking?code=${shipment.trackingCode}`
    
    // Generate QR codes
    const trackingQR = await generateQRCodeDataURL(trackingURL)
    const feedbackQR = await generateQRCodeDataURL(`${trackingURL}&feedback=true`)
    const barcodeDataURL = generateBarcode(shipment.trackingCode)
    
    // Format dates and calculate values
    const shipmentDate = format(new Date(shipment.createdAt), "MM/dd/yy h:mm a")
    const totalDeclaredValue = parcels.reduce((sum, p) => sum + (p.declaredValue || 0), 0)
    const totalWeight = parcels.reduce((sum, p) => sum + ((p.weight || 0) * p.quantity), 0)
    
    const paymentTypeMap: Record<string, string> = {
        "cash": "Cash",
        "card": "Card",
        "transfer": "Bank Transfer"
    }
    
    const deliveryOptionMap: Record<string, string> = {
        "home": "Home Delivery",
        "pickup": "Pickup Point",
        "same-day": "Same Day"
    }
    
    const senderName = shipment.sender?.profile 
        ? `${shipment.sender.profile.firstName} ${shipment.sender.profile.lastName}`.toUpperCase()
        : "N/A"
    const senderAddress = shipment.senderAddress?.street || shipment.sender?.profile?.address || "N/A"
    const senderPhone = shipment.sender?.profile?.phone || "N/A"
    
    const recipientName = shipment.recipient
        ? `${shipment.recipient.firstName} ${shipment.recipient.lastName}`.toUpperCase()
        : `${shipment.recipientFirstName} ${shipment.recipientLastName}`.toUpperCase()
    const recipientAddress = shipment.deliveryAddress || shipment.recipient?.address?.street || "N/A"
    const recipientPhone = shipment.recipientPhoneNumber || shipment.recipient?.phoneNumber || "N/A"
    
    const isPaid = shipment.paymentStatus === "paid"
    
    // Create HTML structure
    const waybillHTML = `
        ${isPaid ? '<div class="paid-stamp">PAID</div>' : ''}
        
        <div class="header">
            <div class="logo-section">
                <div class="company-info">
                    <h1>${companyName}</h1>
                    <p>${slogan}</p>
                </div>
            </div>
            <div class="waybill-number-section">
                <h2>Waybill #</h2>
                <div class="barcode-container">
                    <img src="${barcodeDataURL}" alt="Barcode" />
                </div>
                <p style="font-weight: bold; margin-top: 5px;">${shipment.trackingCode}</p>
                <img src="${trackingQR}" alt="QR Code" class="qr-code-small" />
            </div>
        </div>
        
        <div class="main-details">
            <div class="detail-column">
                <h3>Payment Details</h3>
                <p><strong>Payment Mode:</strong> ${shipment.paymentMode.charAt(0).toUpperCase() + shipment.paymentMode.slice(1)}</p>
                <p><strong>Payment Type:</strong> ${paymentTypeMap[shipment.paymentType] || shipment.paymentType}</p>
                <p><strong>Cash On Delivery:</strong> ${formatPrice(0)}</p>
                <p><strong>Insurance Amount:</strong> ${formatPrice(0)}</p>
            </div>
            <div class="detail-column">
                <h3>Shipment Details</h3>
                <p><strong>Date of Shipment:</strong> ${shipmentDate}</p>
                <p><strong>Customer Category:</strong> Regular</p>
                <p><strong>Delivery Type:</strong> ${deliveryOptionMap[shipment.deliveryOption] || shipment.deliveryOption}</p>
            </div>
            <div class="detail-column">
                <h3>Waybill Info</h3>
                <p class="waybill-large">${shipment.trackingCode}</p>
                <p><strong>Declared Value:</strong> ${formatPrice(totalDeclaredValue)}</p>
                <p><strong>Total Weight:</strong> ${totalWeight.toFixed(1)} Kg</p>
            </div>
        </div>
        
        <div class="address-section">
            <div class="address-box">
                <h4>FROM</h4>
                <p><strong>${senderName}</strong></p>
                <p>${senderAddress}</p>
                <p>Phone: ${senderPhone}</p>
            </div>
            <div class="address-box">
                <h4>TO</h4>
                <p><strong>${recipientName}</strong></p>
                <p>${recipientAddress}</p>
                ${shipment.recipient?.addressLine ? `<p class="text-sm" style="font-style: italic; color: #666;">${shipment.recipient.addressLine}</p>` : ''}
                <p>Phone: ${recipientPhone}</p>
            </div>
        </div>
        
        <div class="signature-section">
            <div class="signature-box">
                <h4>Sent By:</h4>
                <div class="signature-line">Signature: ________________</div>
            </div>
            <div class="signature-box">
                <h4>Received By:</h4>
                <div class="signature-line">Name: ________________</div>
                <div class="signature-line">Phone #: ________________</div>
                <div class="signature-line">Signature: ________________</div>
                <div class="signature-line">Date: ________________</div>
                <div class="feedback-qr">
                    <img src="${feedbackQR}" alt="Feedback QR" />
                    <p>Send feedback</p>
                </div>
            </div>
        </div>
        
        <table class="parcel-table">
            <thead>
                <tr>
                    <th>CHECK</th>
                    <th>DESCRIPTION</th>
                    <th>WEIGHT</th>
                    <th>RUSH/NORMAL</th>
                    <th>QUANTITY</th>
                    <th>UNIT PRICE</th>
                    <th>AMOUNT</th>
                    <th>TOTAL</th>
                </tr>
            </thead>
            <tbody>
                ${parcels.map((parcel) => {
                    const baseDescription = parcel.packaging?.name 
                        ? `${parcel.packaging.name}, ${parcel.length}×${parcel.width}×${parcel.height}cm`
                        : `${parcel.length}×${parcel.width}×${parcel.height}cm`
                    const fullDescription = parcel.description 
                        ? `${baseDescription} | ${parcel.description}`
                        : baseDescription
                    const unitPrice = costing ? costing.amount / parcels.reduce((sum, p) => sum + p.quantity, 0) : 0
                    const amount = unitPrice * parcel.quantity
                    return `
                        <tr>
                            <td>☐-${parcel.quantity}</td>
                            <td>${fullDescription}</td>
                            <td>${parcel.weight || 0}Kg</td>
                            <td>${parcel.isRushHour ? "RUSH" : "NORMAL"}</td>
                            <td>${parcel.quantity}</td>
                            <td>${formatPrice(unitPrice)}</td>
                            <td>${formatPrice(amount)}</td>
                            <td>${formatPrice(amount)}</td>
                        </tr>
                    `
                }).join("")}
            </tbody>
        </table>
        
        <div class="financial-summary">
            <div class="financial-column">
                <h4>Charges</h4>
                <p><span>Package Fee:</span> <span>${formatPrice(costing?.packagingCharge || 0)}</span></p>
                <p><span>Extra Cost:</span> <span>${formatPrice(costing?.extraCost || 0)}</span></p>
                <p><span>TAX Amount:</span> <span>${formatPrice(costing?.tax || 0)}</span></p>
            </div>
            <div class="financial-column">
                <h4>Summary</h4>
                ${costing ? `
                    <p><span>Vat:</span> <span>${formatPrice(costing.vat)}</span></p>
                    <p><span>Insurance Amount:</span> <span>${formatPrice(costing.insurance)}</span></p>
                    <p><span>Delivery Charge:</span> <span>${formatPrice(costing.deliveryCharge)}</span></p>
                    <p><span>Total:</span> <span>${formatPrice(costing.amount)}</span></p>
                ` : '<p>No costing information available</p>'}
            </div>
        </div>
        
    `
    
    // Create style element
    const styleContent = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        .waybill-container {
            width: 210mm;
            min-height: 297mm;
            background: white;
            padding: 15mm;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            color: #000;
            position: relative;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
        }
        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .company-info h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
            letter-spacing: 2px;
        }
        .company-info p {
            font-size: 12px;
            color: #666;
        }
        .waybill-number-section {
            text-align: right;
        }
        .waybill-number-section h2 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .barcode-container {
            margin: 10px 0;
        }
        .barcode-container img {
            height: 50px;
            width: auto;
            display: block;
        }
        .qr-code-small {
            width: 80px;
            height: 80px;
            margin-top: 10px;
            display: block;
        }
        .main-details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border: 1px solid #ddd;
        }
        .detail-column h3 {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
        }
        .detail-column p {
            font-size: 11px;
            margin: 4px 0;
            color: #000;
        }
        .detail-column .waybill-large {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            margin-top: 5px;
        }
        .paid-stamp {
            position: absolute;
            left: 150px;
            top: 80px;
            width: 80px;
            height: 80px;
            border: 3px solid #00AA00;
            border-radius: 50%;
            display: ${isPaid ? "flex" : "none"};
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
            color: #00AA00;
            background: white;
            z-index: 10;
        }
        .address-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 25px 0;
            padding: 20px;
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
        }
        .address-box {
            position: relative;
        }
        .address-box .city-label {
            position: absolute;
            top: -12px;
            left: 0;
            background: white;
            padding: 0 5px;
            font-size: 10px;
            font-weight: bold;
        }
        .address-box h4 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .address-box p {
            font-size: 11px;
            margin: 3px 0;
            line-height: 1.4;
        }
        .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 25px 0;
        }
        .signature-box {
            border: 1px solid #ddd;
            padding: 15px;
        }
        .signature-box h4 {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .signature-line {
            margin: 8px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #333;
            font-size: 11px;
        }
        .feedback-qr {
            text-align: center;
            margin-top: 10px;
        }
        .feedback-qr img {
            width: 60px;
            height: 60px;
            display: block;
            margin: 0 auto;
        }
        .feedback-qr p {
            font-size: 9px;
            margin-top: 5px;
        }
        .parcel-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10px;
        }
        .parcel-table th {
            background: #333;
            color: white;
            padding: 8px 5px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #000;
        }
        .parcel-table td {
            padding: 6px 5px;
            border: 1px solid #ddd;
        }
        .parcel-table tr:nth-child(even) {
            background: #f9f9f9;
        }
        .financial-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border: 1px solid #ddd;
        }
        .financial-column h4 {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .financial-column p {
            font-size: 11px;
            margin: 4px 0;
            display: flex;
            justify-content: space-between;
        }
        .financial-column .grand-total {
            font-weight: bold;
            font-size: 14px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #333;
        }
        .bottom-section {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 11px;
        }
        .bottom-section p {
            margin: 4px 0;
        }
    `
    
    const styleElement = document.createElement("style")
    styleElement.textContent = styleContent
    
    // Create a temporary container element
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.left = "-9999px"
    container.style.top = "0"
    container.style.width = "210mm"
    container.innerHTML = `<div class="waybill-container">${waybillHTML}</div>`
    container.appendChild(styleElement)
    
    const waybillElement = container.querySelector(".waybill-container") as HTMLElement
    
    if (!waybillElement) {
        throw new Error("Failed to create waybill element")
    }
    
    // Wait for images to load
    const images = waybillElement.querySelectorAll("img")
    await Promise.all(
        Array.from(images).map(
            (img) =>
                new Promise<void>((resolve, reject) => {
                    if (img.complete) {
                        resolve()
                    } else {
                        img.onload = () => resolve()
                        img.onerror = reject
                        // Set a timeout to avoid infinite waiting
                        setTimeout(() => resolve(), 5000)
                    }
                })
        )
    )
    
    // Append to body temporarily
    document.body.appendChild(container)
    
    try {
        // Convert to PNG
        const dataUrl = await toPng(waybillElement, {
            quality: 1.0,
            pixelRatio: 2,
            backgroundColor: "#ffffff",
            cacheBust: true,
        })
        
        return dataUrl
    } finally {
        // Clean up
        document.body.removeChild(container)
    }
}
