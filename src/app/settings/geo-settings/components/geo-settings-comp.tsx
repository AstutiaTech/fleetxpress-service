"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { CountriesComp } from "../countries/components/countries-comp"
import { StatesComp } from "../states/components/states-comp"
import { CitiesComp } from "../cities/components/cities-comp"
import { LGAsComp } from "../lgas/components/lgas-comp"

export const GeoSettingsComp = () => {
    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
                <DashboardHeader title="Geo Settings" />
                <section className="w-full max-w-full">
                    <Tabs defaultValue="countries" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="countries">Countries</TabsTrigger>
                            <TabsTrigger value="states">States</TabsTrigger>
                            <TabsTrigger value="cities">Cities</TabsTrigger>
                            <TabsTrigger value="lgas">LGAs</TabsTrigger>
                        </TabsList>
                        <TabsContent value="countries" className="mt-4">
                            <CountriesComp />
                        </TabsContent>
                        <TabsContent value="states" className="mt-4">
                            <StatesComp />
                        </TabsContent>
                        <TabsContent value="cities" className="mt-4">
                            <CitiesComp />
                        </TabsContent>
                        <TabsContent value="lgas" className="mt-4">
                            <LGAsComp />
                        </TabsContent>
                    </Tabs>
                </section>
            </div>
        </PageTransition>
    )
}

export default GeoSettingsComp

