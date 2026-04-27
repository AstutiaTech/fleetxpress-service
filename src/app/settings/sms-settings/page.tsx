import { Metadata } from "next";
import SmsSettingsComp from "./components/sms-settings-comp";

export const metadata: Metadata = {
    title: "SMS Settings",
};

export default function SmsSettings() {
    return (
        <div className="min-h-screen">
            <SmsSettingsComp />
        </div>
    )
}

