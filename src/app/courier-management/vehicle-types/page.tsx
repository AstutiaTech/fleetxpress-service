import { Metadata } from "next";
import VehicleTypesComp from "./components/vehicle-types-comp";

export const metadata: Metadata = {
    title: "Vehicle Types",
};

export default function VehicleTypes() {
    return (
        <div className="min-h-screen">
            <VehicleTypesComp />
        </div>
    )
}

