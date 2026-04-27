import { Metadata } from "next";
import CitiesComp from "./components/cities-comp";

export const metadata: Metadata = {
    title: "Cities Settings",
};

export default function CitiesSettings() {
    return (
        <div className="min-h-screen">
            <CitiesComp />
        </div>
    )
}

