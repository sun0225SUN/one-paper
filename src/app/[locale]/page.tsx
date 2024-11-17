import Header from "~/components/header"
import { Main } from "~/components/main"
import { HydrateClient } from "~/trpc/server"

export default async function Home() {
  return (
    <HydrateClient>
      <div className="flex flex-col">
        <Header />
        <Main />
      </div>
    </HydrateClient>
  )
}
