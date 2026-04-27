import DashboardComp from "./components/dashboardComp";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard",
};

export default function Dashboard() {
    return (
        <div className="min-h-screen">
            <DashboardComp />
        </div>
    )
}
