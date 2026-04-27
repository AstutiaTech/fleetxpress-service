import { Metadata } from "next";
import CreateVehicleForm from "./create-vehicle-form";

export const metadata: Metadata = {
    title: "Create Vehicle",
};

export default function CreateVehicle() {
    return (
        <div className="min-h-screen">
            <CreateVehicleForm />
        </div>
    )
}

