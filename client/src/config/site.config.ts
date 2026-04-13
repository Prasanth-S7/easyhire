import type { SiteConfig } from "@/types"

const env = import.meta.env

export const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID
export const GOOGLE_CLIENT_SECRET = env.VITE_GOOGLE_CLIENT_SECRET
export const BASE_URL = env.VITE_BASE_URL

export const siteConfig: SiteConfig = {
    name: "Project name",
    title: "A Short title",
    description: "A short description",
}