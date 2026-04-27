"use client"

import Image from "next/image"
import Link from "next/link"
import { buildImageUrl } from "@/lib/utils"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"

export const BrandLogo = observer(() => {
    const { settingsStore } = useStore()
    const logoFromApi = settingsStore.generalSettings?.logo
    const logoUrl = logoFromApi ? buildImageUrl(logoFromApi) : "/images/logo_full.png"

    return (
        <Link href="/">
            <Image 
                alt="Brand Logo" 
                priority 
                width={300} 
                height={105} 
                className="dark:bg-white dark:rounded-lg" 
                src={logoUrl} 
            />
        </Link>
    )
})