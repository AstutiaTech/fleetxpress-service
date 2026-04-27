import InvoicesComp from "./components/invoices-comp";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Invoices",
};

export default function Invoices() {
    return (
        <div className="min-h-screen">
            <InvoicesComp />
        </div>
    )
}

