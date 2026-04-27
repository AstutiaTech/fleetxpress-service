import { Metadata } from "next";
import StaffRolesComp from "./components/staff-roles-comp";

export const metadata: Metadata = {
    title: "Staff Roles",
};

export default function StaffRoles() {
    return (
        <div className="min-h-screen">
            <StaffRolesComp />
        </div>
    )
}

