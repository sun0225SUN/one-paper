"use client"

import { MindMap } from "~/components/mindmap"
import { Note } from "~/components/note"
import { useModeStore } from "~/store/mode"

export function Main() {
  const mode = useModeStore((state) => state.mode)
  return <>{mode === "note" ? <Note /> : <MindMap />}</>
}
