import { Metadata } from "next";
import WeightBasedPricingComp from "./components/weight-based-pricing-comp";

export const metadata: Metadata = {
    title: "Weight-Based Pricing",
};

export default function WeightBasedPricingPage() {
    return (
        <div className="min-h-screen">
            <WeightBasedPricingComp />
        </div>
    )
}

