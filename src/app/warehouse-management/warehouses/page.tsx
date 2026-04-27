import { Metadata } from "next";
import WarehousesComp from "./components/warehouses-comp";

export const metadata: Metadata = {
    title: "Warehouses",
};

export default function Warehouses() {
    return (
        <div className="min-h-screen">
            <WarehousesComp />
        </div>
    )
}

