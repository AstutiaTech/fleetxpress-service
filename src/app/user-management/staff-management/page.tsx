import { Metadata } from "next";
import StaffManagementComp from "./components/staff-management-comp";

export const metadata: Metadata = {
    title: "Staff Management",
};

export default function StaffManagement() {
    return (
        <div className="min-h-screen">
            <StaffManagementComp />
        </div>
    )
}

