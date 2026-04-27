import { Metadata } from "next";
import CountriesComp from "./components/countries-comp";

export const metadata: Metadata = {
    title: "Countries Settings",
};

export default function CountriesSettings() {
    return (
        <div className="min-h-screen">
            <CountriesComp />
        </div>
    )
}

