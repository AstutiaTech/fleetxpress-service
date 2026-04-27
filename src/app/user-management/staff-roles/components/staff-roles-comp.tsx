"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { DashboardHeader } from "@/components/dashboard-header"
import { StaffRole } from "@/types/staffTypes"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { Badge } from "@/components/ui/badge"

const STAFF_ROLES: StaffRole[] = ["superadmin", "admin", "manager", "agent"]

export const StaffRolesComp = observer(() => {
    const getRoleBadgeVariant = (role: StaffRole) => {
        const variants: Record<StaffRole, "default" | "secondary" | "destructive" | "outline"> = {
            superadmin: "destructive",
            admin: "default",
            manager: "secondary",
            agent: "outline",
        }
        return variants[role] || "outline"
    }

    const getRoleDescription = (role: StaffRole) => {
        const descriptions: Record<StaffRole, string> = {
            superadmin: "Full system access with all permissions",
            admin: "Administrative access with most permissions",
            manager: "Management access with limited administrative permissions",
            agent: "Agent access with basic operational permissions",
        }
        return descriptions[role] || ""
    }

    const columns: CustomTableColumn<{ role: StaffRole }>[] = [
        {
            header: "Role",
            cell: (row) => (
                <Badge variant={getRoleBadgeVariant(row.role)}>
                    {row.role.charAt(0).toUpperCase() + row.role.slice(1)}
                </Badge>
            ),
            className: "font-medium",
        },
        {
            header: "Description",
            cell: (row) => getRoleDescription(row.role),
        },
    ]

    const rolesData = STAFF_ROLES.map(role => ({ role }))

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title="Staff Roles" />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={rolesData}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No roles found
                                </div>
                            }
                        />
                    </div>
                </section>
            </div>
        </PageTransition>
    )
})

export default StaffRolesComp

