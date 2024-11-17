import { defineRouting } from "next-intl/routing"
import { createNavigation } from "next-intl/navigation"

export const locales: string[] = ["zh", "en"]

export type Locale = (typeof locales)[number]

export const defaultLocale = "zh"

export const localeMap: Record<string, string> = {
  zh: "简体中文",
  en: "English",
}

export const routing = defineRouting({
  // A list of all locales that are supported
  locales,
  // Used when no locale matches
  defaultLocale,
  localePrefix: "never",
})

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
