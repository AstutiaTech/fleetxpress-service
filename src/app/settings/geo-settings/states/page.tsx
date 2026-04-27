import { Metadata } from "next";
import StatesComp from "./components/states-comp";

export const metadata: Metadata = {
    title: "States Settings",
};

export default function StatesSettings() {
    return (
        <div className="min-h-screen">
            <StatesComp />
        </div>
    )
}

