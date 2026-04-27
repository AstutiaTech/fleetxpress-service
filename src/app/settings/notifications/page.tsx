import { Metadata } from "next";
import NotificationsComp from "./components/notifications-comp";

export const metadata: Metadata = {
    title: "Notification Settings",
};

export default function NotificationSettings() {
    return (
        <div className="min-h-screen">
            <NotificationsComp />
        </div>
    )
}

