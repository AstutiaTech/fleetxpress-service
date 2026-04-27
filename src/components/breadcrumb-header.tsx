"use client"

import * as React from "react"

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePathname } from "next/navigation"

export function BreadcrumbResponsive() {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const pathname = usePathname()

  // Split pathname and build breadcrumb items
  const segments = pathname.split("/").filter(Boolean)
  const items = segments.length === 0
    ? [{ href: "/", label: "Home" }]
    : [
        { href: "/", label: "Home" },
        ...segments.map((seg, idx) => {
          const href = "/" + segments.slice(0, idx + 1).join("/")
          // Capitalize and replace dashes/underscores
          const label = seg.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase())
          return { href, label }
        })
      ]

  const ITEMS_TO_DISPLAY = 3

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={items[0].href}>{items[0].label}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {items.length > ITEMS_TO_DISPLAY ? (
          <>
            <BreadcrumbItem>
              {isDesktop ? (
                <DropdownMenu open={open} onOpenChange={setOpen}>
                  <DropdownMenuTrigger className="flex items-center gap-1" aria-label="Toggle menu">
                    <BreadcrumbEllipsis className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {items.slice(1, -2).map((item) => (
                      <DropdownMenuItem key={item.href}>
                        <Link href={item.href}>{item.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Drawer open={open} onOpenChange={setOpen}>
                  <DrawerTrigger aria-label="Toggle Menu">
                    <BreadcrumbEllipsis className="h-4 w-4" />
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="text-left">
                      <DrawerTitle>Navigate to</DrawerTitle>
                      <DrawerDescription>Select a page to navigate to.</DrawerDescription>
                    </DrawerHeader>
                    <div className="grid gap-1 px-4">
                      {items.slice(1, -2).map((item) => (
                        <Link key={item.href} href={item.href} className="py-1 text-sm">
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <DrawerFooter className="pt-4">
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ) : null}

        {items.slice(-ITEMS_TO_DISPLAY + 1).map((item, index) => {
          const isLastItem = index === items.slice(-ITEMS_TO_DISPLAY + 1).length - 1
          return (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                {item.href && item.href !== pathname ? (
                  <BreadcrumbLink asChild className="max-w-20 truncate md:max-w-none">
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="max-w-20 truncate md:max-w-none">{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLastItem && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
