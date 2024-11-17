import { HydrateClient } from "~/trpc/server"
import Header from "~/components/header"
import Note from "~/components/note"

export default async function Home() {
  return (
    <HydrateClient>
      <div className="flex flex-col">
        <Header />
        <Note />
      </div>
    </HydrateClient>
  )
}
