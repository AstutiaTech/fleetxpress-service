import { Metadata } from "next";
import OutsideCityComp from "./components/outside-city-comp";

export const metadata: Metadata = {
    title: "Outside City Settings",
};

export default function OutsideCitySettings() {
    return (
        <div className="min-h-screen">
            <OutsideCityComp />
        </div>
    )
}
