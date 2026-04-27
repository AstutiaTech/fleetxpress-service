import InsideCityComp from "./components/inside-city-comp";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Inside City Settings",
};

export default function InsideCitySettings() {
    return (
        <div className="min-h-screen">
            <InsideCityComp />
        </div>
    )
}
