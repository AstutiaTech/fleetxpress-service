import { Invoice } from "@/types/invoiceTypes"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// Extend jsPDF type to include lastAutoTable
declare module "jspdf" {
    interface jsPDF {
        lastAutoTable?: {
            finalY: number
        }
    }
}

export function generateInvoicePDF(invoice: Invoice, customerName?: string, customerEmail?: string) {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text("INVOICE", 105, 20, { align: "center" })
    
    // Invoice details
    doc.setFontSize(10)
    let yPos = 35
    
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, yPos)
    doc.text(`Invoice Date: ${format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}`, 14, yPos + 5)
    doc.text(`Due Date: ${format(new Date(invoice.dueDate), "MMM dd, yyyy")}`, 14, yPos + 10)
    if (invoice.shipmentId) {
        doc.text(`Shipment ID: ${invoice.shipmentId}`, 14, yPos + 15)
    }
    
    // Customer info
    yPos = 35
    if (customerName) {
        doc.text(`Customer: ${customerName}`, 105, yPos, { align: "right" })
    }
    if (customerEmail) {
        doc.text(`Email: ${customerEmail}`, 105, yPos + 5, { align: "right" })
    }
    
    // Items table
    const tableData = invoice.items.map((item) => [
        item.description,
        item.quantity.toString(),
        formatPrice(item.unitPrice, "", 2),
        formatPrice(item.quantity * item.unitPrice, "", 2),
    ])
    
    autoTable(doc, {
        startY: yPos + 20,
        head: [["Description", "Qty", "Unit Price", "Total"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [66, 66, 66] },
    })
    
    // Totals
    const finalY = (doc.lastAutoTable?.finalY || 100) + 10
    doc.setFontSize(10)
    doc.text(`Subtotal: ${formatPrice(invoice.subtotal, "", 2)}`, 150, finalY, { align: "right" })
    if (invoice.tax > 0) {
        doc.text(`Tax: ${formatPrice(invoice.tax, "", 2)}`, 150, finalY + 5, { align: "right" })
    }
    if (invoice.discount > 0) {
        doc.text(`Discount: ${formatPrice(invoice.discount, "", 2)}`, 150, finalY + 10, { align: "right" })
    }
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`Total: ${formatPrice(invoice.totalAmount, "", 2)}`, 150, finalY + (invoice.discount > 0 ? 17 : 12), { align: "right" })
    
    // Notes
    if (invoice.notes) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.text(`Notes: ${invoice.notes}`, 14, finalY + (invoice.discount > 0 ? 25 : 20), { maxWidth: 180 })
    }
    
    // Terms
    if (invoice.terms) {
        doc.setFontSize(9)
        const notesY = invoice.notes ? finalY + (invoice.discount > 0 ? 35 : 30) : finalY + (invoice.discount > 0 ? 25 : 20)
        doc.text(`Terms: ${invoice.terms}`, 14, notesY, { maxWidth: 180 })
    }
    
    return doc
}

