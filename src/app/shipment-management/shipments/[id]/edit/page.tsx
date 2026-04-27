import { Metadata } from "next";
import EditShipmentForm from "./edit-shipment-form";

export const metadata: Metadata = {
    title: "Edit Shipment",
};

export default function EditShipmentPage() {
    return (
        <div className="min-h-screen">
            <EditShipmentForm />
        </div>
    )
}

