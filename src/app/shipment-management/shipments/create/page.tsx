import { CreateShipmentForm } from "./create-shipment-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Shipment",
}

export default function CreateShipmentPage() {
  return (
    <div className="min-h-screen">
      <CreateShipmentForm />
    </div>
  )
}

