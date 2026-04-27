import { Card, CardHeader, CardTitle } from "@/components/ui/card";

import { GeneralSettingsComp } from "./components/generalSettingsComp";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "General Settings",
};

export default function GeneralSettings() {
    return (
        <GeneralSettingsComp />
    )
}
