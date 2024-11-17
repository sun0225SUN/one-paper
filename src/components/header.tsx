import { useTranslations } from "next-intl"
import { LanguageToggle } from "~/components/language/toggle"
import { ThemeToggle } from "~/components/theme/toggle"

export default function Header() {
  const t = useTranslations("app")

  return (
    <div className="mx-auto h-16 w-full max-w-7xl p-4">
      <div className="flex w-full justify-between">
        <h1>{t("title")}</h1>
        <div className="flex items-center gap-10">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
    </div>
  )
}
