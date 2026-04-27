/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./toast"
import { useEffect, useState } from "react"

import { useToast } from "./use-toast"

export function Toaster({ position = "top-center" }: { position?: string }) {
  const { toasts } = useToast()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, icon, ...props }: any) => (
        <Toast key={id} {...props}>
          <div className="flex">
            {icon && <div className="mr-3 flex-shrink-0">{icon}</div>}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport data-position={position} />
    </ToastProvider>
  )
}
