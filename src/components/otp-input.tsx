"use client"

import { useEffect, useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type React from "react"

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function OTPInput({ length = 6, value = "", onChange, disabled = false, className }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(
    value
      .split("")
      .slice(0, length)
      .concat(Array(length - value.length).fill("")),
  )
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Update OTP state when value prop changes
  useEffect(() => {
    const newOtp = value
      .split("")
      .slice(0, length)
      .concat(Array(length - value.length).fill(""))
    setOtp(newOtp)
  }, [value, length])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = e.target.value

    // Only allow digits
    if (!/^\d*$/.test(newValue)) return

    // Take the last character if multiple characters are pasted
    const digit = newValue.slice(-1)

    // Update the OTP array
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Call the onChange callback with the new OTP string
    onChange(newOtp.join(""))

    // Move focus to the next input if a digit was entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move focus to the previous input on backspace if current input is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Move focus to the next input on right arrow
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Move focus to the previous input on left arrow
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").trim()

    // Only allow digits
    if (!/^\d*$/.test(pastedData)) return

    // Take only the first 'length' characters
    const digits = pastedData.slice(0, length).split("")

    // Update the OTP array
    const newOtp = [...otp]
    digits.forEach((digit, index) => {
      newOtp[index] = digit
    })
    setOtp(newOtp)

    // Call the onChange callback with the new OTP string
    onChange(newOtp.join(""))

    // Move focus to the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex((val) => !val)
    if (nextEmptyIndex !== -1 && nextEmptyIndex < length) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[length - 1]?.focus()
    }
  }

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el: any) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={otp[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-12 text-center border-gray-300 text-black dark:text-xl text-xl"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
