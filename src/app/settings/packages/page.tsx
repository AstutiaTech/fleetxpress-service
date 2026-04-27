import { Metadata } from "next";
import PackagesComp from "./components/packages-comp";

export const metadata: Metadata = {
    title: "Packages Settings",
};

export default function PackagesSettings() {
    return (
        <div className="min-h-screen">
            <PackagesComp />
        </div>
    )
}

