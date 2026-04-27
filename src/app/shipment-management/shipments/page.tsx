import { Metadata } from "next";
import ShipmentComp from "../components/shipmentComp";

export const metadata: Metadata = {
    title: "Shipments",
};

export default function Shipments() {
    return (
        <div className="min-h-screen">
            <ShipmentComp />
        </div>
    )
}
