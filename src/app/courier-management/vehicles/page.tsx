import { Metadata } from "next";
import VehiclesComp from "./components/vehicles-comp";

export const metadata: Metadata = {
    title: "Vehicles",
};

export default function Vehicles() {
    return (
        <div className="min-h-screen">
            <VehiclesComp />
        </div>
    )
}

