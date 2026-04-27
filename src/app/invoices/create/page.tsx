import CreateInvoiceForm from "./create-invoice-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create Invoice",
};

export default function CreateInvoicePage() {
    return (
        <div className="min-h-screen">
            <CreateInvoiceForm />
        </div>
    )
}

