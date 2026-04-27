import { Metadata } from "next";
import GeoSettingsComp from "./components/geo-settings-comp";

export const metadata: Metadata = {
    title: "Geo Settings",
};

export default function GeoSettings() {
    return (
        <div className="min-h-screen">
            <GeoSettingsComp />
        </div>
    )
}

