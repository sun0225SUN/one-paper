// import { OutlineNotes } from "~/components/outline";
import { HydrateClient } from "~/trpc/server";
import Note from "~/components/note";
export default async function Home() {
  return (
    <HydrateClient>
      <Note />
      {/* <OutlineNotes /> */}
    </HydrateClient>
  );
}
