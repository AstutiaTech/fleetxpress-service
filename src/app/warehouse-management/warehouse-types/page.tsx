import { Metadata } from "next";
import WarehouseTypesComp from "./components/warehouse-types-comp";

export const metadata: Metadata = {
    title: "Warehouse Types",
};

export default function WarehouseTypes() {
    return (
        <div className="min-h-screen">
            <WarehouseTypesComp />
        </div>
    )
}

