import type { Metadata } from "next"
import { Dashboard } from "@/components/dashboard"

export const metadata: Metadata = {
  title: "Document Manager - Dashboard",
  description: "Manage your personal documents with ease",
}

export default function Home() {
  return <Dashboard />
}

