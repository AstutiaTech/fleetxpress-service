import { Metadata } from "next";
import CreateVehicleTypeForm from "./create-vehicle-type-form";

export const metadata: Metadata = {
    title: "Create Vehicle Type",
};

export default function CreateVehicleType() {
    return (
        <div className="min-h-screen">
            <CreateVehicleTypeForm />
        </div>
    )
}

