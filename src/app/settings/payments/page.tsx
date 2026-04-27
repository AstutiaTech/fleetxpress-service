import { Metadata } from "next";
import PaymentsComp from "./components/payments-comp";

export const metadata: Metadata = {
    title: "Payment Settings",
};

export default function PaymentSettings() {
    return (
        <div className="min-h-screen">
            <PaymentsComp />
        </div>
    )
}

