import { Metadata } from "next";
import CreateDriverForm from "./create-driver-form";

export const metadata: Metadata = {
    title: "Create Driver",
};

export default function CreateDriver() {
    return (
        <div className="min-h-screen">
            <CreateDriverForm />
        </div>
    )
}

