import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Shipping Settings",
};

export default function ShippingSettings() {
    return redirect("/settings/shipping-settings/inside-city")
}
