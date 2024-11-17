"use client"

import { useModeStore } from "~/store/mode"
import { Mindmap } from "./mindmap"
import { Note } from "./note"

export function Main() {
  const mode = useModeStore((state) => state.mode)
  return <>{mode === "note" ? <Note /> : <Mindmap />}</>
}
