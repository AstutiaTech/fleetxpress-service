import { BreadcrumbResponsive } from "./breadcrumb-header";
import { useStore } from "@/providers/store.provider";

interface DashboardHeaderProps {
    rightWidgets?: React.JSX.Element[];
    title: string;
    hasGreeting?: boolean;
}
export const DashboardHeader = (props: DashboardHeaderProps) => {
    const { rightWidgets, title, hasGreeting } = props;
    const { authStore } = useStore()
    return (
        <div className="flex flex-col md:flex-row justify-between">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">{title}</h1>
                </div>
                {/* <BreadcrumbResponsive /> */}
            </div>
            <div className="flex gap-2 flex-col md:flex-row">
                {rightWidgets}
            </div>
        </div>
    )
};