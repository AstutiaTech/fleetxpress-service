import { Metadata } from "next";
import CustomersComp from "./components/customers-comp";

export const metadata: Metadata = {
    title: "Customers",
};

export default function Customers() {
    return (
        <div className="min-h-screen">
            <CustomersComp />
        </div>
    )
}

