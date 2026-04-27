import { Metadata } from "next";
import CurrenciesComp from "./components/currencies-comp";

export const metadata: Metadata = {
    title: "Currencies Settings",
};

export default function CurrenciesSettings() {
    return (
        <div className="min-h-screen">
            <CurrenciesComp />
        </div>
    )
}

