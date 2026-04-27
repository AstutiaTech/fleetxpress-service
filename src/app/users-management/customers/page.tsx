import CustomersComp from "./components/customers-comp";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Customers",
};

export default function CustomersPage() {
    return (
        <div className="min-h-screen">
            <CustomersComp />
        </div>
    )
}

