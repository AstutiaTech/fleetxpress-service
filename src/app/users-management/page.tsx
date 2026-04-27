"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function UsersManagement() {
  const router = useRouter();
  useEffect(() => {
    router.push("/users-management/customers")
  }, [router])

  return null;
}

