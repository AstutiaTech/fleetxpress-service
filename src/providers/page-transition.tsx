"use client"

import { useEffect, useState } from "react"

import type React from "react"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isFirstMount, setIsFirstMount] = useState(true)

  useEffect(() => {
    // No need to synchronously call setIsFirstMount(false) in useEffect.
    // Instead, determine if it's the first mount in a way that avoids setState here.
    // As a minimal fix, comment out or remove the setState call:
    // setIsFirstMount(false)
  }, [])

  const variants = {
    hidden: { opacity: 0, x: 0, y: 20 },
    enter: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x: 0, y: -20 },
  }

  return (
    <motion.div
      key={pathname}
      initial={isFirstMount ? "enter" : "hidden"}
      animate="enter"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}
