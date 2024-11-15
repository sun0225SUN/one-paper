import { OutlineNotes } from "~/components/outline";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <OutlineNotes />
    </HydrateClient>
  );
}
