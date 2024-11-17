import { useTranslations } from "next-intl"
import { LanguageToggle } from "~/components/language/toggle"
import { ModeToggle } from "~/components/mode-toggle"
import { ThemeToggle } from "~/components/theme/toggle"
export default function Header() {
  const t = useTranslations("app")

  return (
    <div className="sticky top-0 z-50 mx-auto h-16 w-full max-w-7xl bg-white p-4 dark:bg-black">
      <div className="flex w-full items-center justify-between">
        <h1>{t("title")}</h1>
        <div className="flex cursor-pointer items-center gap-10">
          <ModeToggle />
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
    </div>
  )
}
