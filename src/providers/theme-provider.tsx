'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Ensure defaultTheme is light if not explicitly set
  const defaultTheme = props.defaultTheme || 'light'
  
  return (
    <NextThemesProvider 
      {...props} 
      defaultTheme={defaultTheme}
      enableSystem={props.enableSystem ?? false}
    >
      {children}
    </NextThemesProvider>
  )
}
