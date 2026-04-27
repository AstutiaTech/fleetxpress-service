import { Metadata } from "next";
import EmailSettingsComp from "./components/email-settings-comp";

export const metadata: Metadata = {
    title: "Email Settings",
};

export default function EmailSettings() {
    return (
        <div className="min-h-screen">
            <EmailSettingsComp />
        </div>
    )
}

