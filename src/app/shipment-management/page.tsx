"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ShipmentsManagement() {
  const router = useRouter();
  useEffect(() => {
    router.push("/shipments-management/shipments")
  }, [router])

  return null;
}
