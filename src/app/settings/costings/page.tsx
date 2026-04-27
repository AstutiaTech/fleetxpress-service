import { Metadata } from "next";
import CostingsComp from "./components/costings-comp";

export const metadata: Metadata = {
    title: "Costings Settings",
};

export default function CostingsSettings() {
    return (
        <div className="min-h-screen">
            <CostingsComp />
        </div>
    )
}

