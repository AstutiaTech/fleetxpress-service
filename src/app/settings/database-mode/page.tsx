import { Metadata } from "next"
import { DatabaseModeSettingsComp } from "./components/databaseModeSettingsComp"

export const metadata: Metadata = {
  title: "Database Mode Settings",
}

export default function DatabaseModeSettings() {
  return <DatabaseModeSettingsComp />
}

