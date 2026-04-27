import { Metadata } from "next";
import DriversComp from "./components/drivers-comp";

export const metadata: Metadata = {
    title: "Drivers",
};

export default function Drivers() {
    return (
        <div className="min-h-screen">
            <DriversComp />
        </div>
    )
}

