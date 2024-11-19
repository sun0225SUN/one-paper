import { GeistSans } from "geist/font/sans"
import { type Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { Toaster } from "react-hot-toast"
import { ThemeProvider } from "~/components/theme/provider"
import { routing } from "~/i18n/routing"
import "~/styles/globals.css"
import { TRPCReactProvider } from "~/trpc/react"

export const metadata: Metadata = {
  title: "One Paper",
  description:
    "One Paper is a note-taking app that allows you to create and organize your notes in a tree structure.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
}

export default async function RootLayout({
  params: { locale },
  children,
}: Readonly<{
  children: React.ReactNode
  params: { locale: string }
}>) {
  // Ensure that the incoming `locale` is valid
  // eslint-disable-next-line
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <TRPCReactProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </TRPCReactProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
