import { Metadata } from "next";
import LGAsComp from "./components/lgas-comp";

export const metadata: Metadata = {
    title: "LGAs Settings",
};

export default function LGAsSettings() {
    return (
        <div className="min-h-screen">
            <LGAsComp />
        </div>
    )
}

